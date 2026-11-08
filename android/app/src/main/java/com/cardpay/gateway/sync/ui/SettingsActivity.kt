package com.cardpay.gateway.sync.ui

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.cardpay.gateway.sync.data.api.CardPayApi
import com.cardpay.gateway.sync.data.model.SmsSyncRequest
import com.cardpay.gateway.sync.databinding.ActivitySettingsBinding
import com.cardpay.gateway.sync.utils.AppPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var prefs: AppPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = AppPreferences(this)
        setupViews()
    }

    private fun setupViews() {
        binding.etServerUrl.setText(prefs.serverUrl)
        binding.etApiKey.setText(prefs.apiKey)

        // Setup Theme selection
        when (prefs.themeMode) {
            "light" -> binding.rbThemeLight.isChecked = true
            "dark" -> binding.rbThemeDark.isChecked = true
            else -> binding.rbThemeSystem.isChecked = true
        }

        binding.rgThemeMode.setOnCheckedChangeListener { _, checkedId ->
            val selectedMode = when (checkedId) {
                com.cardpay.gateway.sync.R.id.rbThemeLight -> "light"
                com.cardpay.gateway.sync.R.id.rbThemeDark -> "dark"
                else -> "system"
            }
            prefs.themeMode = selectedMode
            prefs.applyTheme()
        }

        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnSave.setOnClickListener {
            val url = binding.etServerUrl.text.toString().trim()
            val key = binding.etApiKey.text.toString().trim()

            if (url.isBlank() || key.isBlank()) {
                Toast.makeText(this, "آدرس سرور و توکن دستگاه الزامی است", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            prefs.serverUrl = url
            prefs.apiKey = key
            Toast.makeText(this, "تنظیمات با موفقیت ذخیره شد", Toast.LENGTH_SHORT).show()
            finish()
        }

        binding.btnTest.setOnClickListener {
            testConnection()
        }
    }

    private fun testConnection() {
        val url = binding.etServerUrl.text.toString().trim()
        val key = binding.etApiKey.text.toString().trim()

        if (url.isBlank() || key.isBlank()) {
            Toast.makeText(this, "لطفاً آدرس سرور و توکن را وارد کنید", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnTest.isEnabled = false
        binding.btnTest.text = "در حال تست..."

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val api = CardPayApi.create(url)
                val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                val pingReq = SmsSyncRequest(
                    sender = "TEST_PING",
                    rawText = "Connection test from CardPay Settings",
                    receivedAt = df.format(Date())
                )
                val response = api.sendSms("Bearer $key", pingReq)

                withContext(Dispatchers.Main) {
                    binding.btnTest.isEnabled = true
                    binding.btnTest.text = "تست پینگ"
                    if (response.isSuccessful) {
                        Toast.makeText(this@SettingsActivity, "اتصال با سرور برقرار شد و توکن معتبر است ✅", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this@SettingsActivity, "خطا در تایید توسط سرور (کد ${response.code()})", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnTest.isEnabled = true
                    binding.btnTest.text = "تست پینگ"
                    Toast.makeText(this@SettingsActivity, "خطای عدم دسترسی به سرور: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
