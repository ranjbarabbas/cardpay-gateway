package com.cardpay.gateway.sync.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.cardpay.gateway.sync.data.api.CardPayApi
import com.cardpay.gateway.sync.data.model.SmsSyncRequest
import com.cardpay.gateway.sync.databinding.ActivityMainBinding
import com.cardpay.gateway.sync.service.SmsSyncForegroundService
import com.cardpay.gateway.sync.utils.AppPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: AppPreferences

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val smsGranted = permissions[Manifest.permission.RECEIVE_SMS] ?: false
        if (smsGranted) {
            Toast.makeText(this, "SMS Permission Granted", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "SMS Permission is required for payment verification", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = AppPreferences(this)
        requestRequiredPermissions()
        setupUI()
    }

    override fun onResume() {
        super.onResume()
        updateStatusView()
    }

    private fun setupUI() {
        binding.etServerUrl.setText(prefs.serverUrl)
        binding.etApiKey.setText(prefs.apiKey)
        binding.switchSync.isChecked = prefs.isSyncEnabled

        updateStatusView()

        binding.btnSave.setOnClickListener {
            val url = binding.etServerUrl.text.toString().trim()
            val key = binding.etApiKey.text.toString().trim()

            if (url.isBlank() || key.isBlank()) {
                Toast.makeText(this, "Server URL and API Key are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            prefs.serverUrl = url
            prefs.apiKey = key
            Toast.makeText(this, "Settings saved successfully", Toast.LENGTH_SHORT).show()
        }

        binding.switchSync.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked && (prefs.apiKey.isBlank() || prefs.serverUrl.isBlank())) {
                Toast.makeText(this, "Please configure Server URL & API Key first", Toast.LENGTH_LONG).show()
                binding.switchSync.isChecked = false
                return@setOnCheckedChangeListener
            }

            prefs.isSyncEnabled = isChecked
            if (isChecked) {
                SmsSyncForegroundService.startService(this)
            } else {
                val stopIntent = Intent(this, SmsSyncForegroundService::class.java).apply {
                    action = SmsSyncForegroundService.ACTION_STOP
                }
                startService(stopIntent)
            }
            updateStatusView()
        }

        binding.btnTest.setOnClickListener {
            testServerConnection()
        }
    }

    private fun updateStatusView() {
        if (prefs.isSyncEnabled) {
            binding.tvStatus.text = "Service is ACTIVE & LISTENING"
            binding.tvStatus.setTextColor(Color.parseColor("#10B981"))
        } else {
            binding.tvStatus.text = "Service is STOPPED"
            binding.tvStatus.setTextColor(Color.parseColor("#EF4444"))
        }
        binding.tvLastSync.text = "Last status: ${prefs.lastSyncStatus}"
    }

    private fun testServerConnection() {
        val url = binding.etServerUrl.text.toString().trim()
        val key = binding.etApiKey.text.toString().trim()

        if (url.isBlank() || key.isBlank()) {
            Toast.makeText(this, "Please enter Server URL and API Key", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnTest.isEnabled = false
        binding.btnTest.text = "Testing..."

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val api = CardPayApi.create(url)
                val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                val pingReq = SmsSyncRequest(
                    sender = "PING_TEST",
                    rawText = "Connection test from CardPay Android App",
                    receivedAt = df.format(Date())
                )
                val response = api.sendSms("Bearer $key", pingReq)

                withContext(Dispatchers.Main) {
                    binding.btnTest.isEnabled = true
                    binding.btnTest.text = "Test Ping"
                    if (response.isSuccessful) {
                        Toast.makeText(this@MainActivity, "Connection successful! Server verified.", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this@MainActivity, "Server rejected request (Code: ${response.code()})", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnTest.isEnabled = true
                    binding.btnTest.text = "Test Ping"
                    Toast.makeText(this@MainActivity, "Connection failed: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun requestRequiredPermissions() {
        val permissions = mutableListOf(Manifest.permission.RECEIVE_SMS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }
}
