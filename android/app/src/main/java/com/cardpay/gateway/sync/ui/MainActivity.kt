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
import com.cardpay.gateway.sync.databinding.ActivityMainBinding
import com.cardpay.gateway.sync.service.SmsSyncForegroundService
import com.cardpay.gateway.sync.utils.AppPreferences

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: AppPreferences

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val smsGranted = permissions[Manifest.permission.RECEIVE_SMS] ?: false
        if (smsGranted) {
            Toast.makeText(this, "دسترسی پیامک فعال شد", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "دسترسی دریافت پیامک برای عملکرد درگاه ضروری است", Toast.LENGTH_LONG).show()
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
        // Gear settings icon click
        binding.btnOpenSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        binding.btnQuickSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        binding.switchSync.isChecked = prefs.isSyncEnabled

        binding.switchSync.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked && (prefs.apiKey.isBlank() || prefs.serverUrl.isBlank())) {
                Toast.makeText(this, "لطفاً ابتدا از آیکون چرخ‌دنده تنظیمات، سرور و توکن را وارد کنید", Toast.LENGTH_LONG).show()
                binding.switchSync.isChecked = false
                startActivity(Intent(this, SettingsActivity::class.java))
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
    }

    private fun updateStatusView() {
        if (prefs.isSyncEnabled) {
            binding.tvStatus.text = "سرویس فعال و در حال رصد هوشمند است"
            binding.tvStatus.setTextColor(Color.parseColor("#10B981"))
            binding.statusDot.setBackgroundColor(Color.parseColor("#10B981"))
        } else {
            binding.tvStatus.text = "سرویس غیرفعال است"
            binding.tvStatus.setTextColor(Color.parseColor("#EF4444"))
            binding.statusDot.setBackgroundColor(Color.parseColor("#EF4444"))
        }

        binding.tvServerInfo.text = "سرور متصل: ${prefs.serverUrl}"
        binding.tvLastSync.text = "آخرین وضعیت: ${prefs.lastSyncStatus}"
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
