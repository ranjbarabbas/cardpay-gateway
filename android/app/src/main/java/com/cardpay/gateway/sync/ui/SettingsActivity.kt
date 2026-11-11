package com.cardpay.gateway.sync.ui

import android.graphics.Color
import android.os.Bundle
import android.view.View
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
import java.io.IOException
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
        binding.btnBack.setOnClickListener {
            finish()
        }

        // Initialize state
        val isProd = prefs.isProductionMode
        binding.switchEnvMode.isChecked = isProd
        updateEnvironmentUI(isProd)

        binding.etApiKey.setText(prefs.apiKey)

        // Environment toggle listener
        binding.switchEnvMode.setOnCheckedChangeListener { _, isChecked ->
            updateEnvironmentUI(isChecked)
        }

        // Save Settings
        binding.btnSave.setOnClickListener {
            saveSettings()
        }

        // Test Connection
        binding.btnTest.setOnClickListener {
            testConnection()
        }
    }

    private fun updateEnvironmentUI(isProd: Boolean) {
        if (isProd) {
            binding.tvEnvTitle.text = "محیط عملیاتی (Production)"
            binding.tvEnvBadge.text = "سرور ثابت: https://pay.honarhub.com"
            binding.tvEnvDescription.text = "در محیط عملیاتی، ارتباط به صورت امن و مستقیم با سرور اصلی هنرهاب پی برقرار است و آدرس سرور غیرقابل تغییر می‌باشد."
            binding.etServerUrl.setText(AppPreferences.PRODUCTION_SERVER_URL)
            binding.etServerUrl.isEnabled = false
            binding.tilServerUrl.helperText = "آدرس سرور در محیط عملیاتی قفل و غیرقابل تغییر است."
        } else {
            binding.tvEnvTitle.text = "محیط تست و توسعه (Test / Sandbox)"
            binding.tvEnvBadge.text = "آدرس سرور قابل ویرایش"
            binding.tvEnvDescription.text = "در محیط تست، می‌توانید آدرس سرور محلی یا سرور تستی را تعیین فرمایید."
            binding.etServerUrl.setText(prefs.testServerUrl)
            binding.etServerUrl.isEnabled = true
            binding.tilServerUrl.helperText = "آدرس سرور یا آی‌پی محلی پورت ۳۰۵۰ را وارد فرمایید."
        }
    }

    private fun saveSettings() {
        val isProd = binding.switchEnvMode.isChecked
        val key = binding.etApiKey.text?.toString()?.trim().orEmpty()

        if (key.isBlank()) {
            Toast.makeText(this, "کلید اتصال دستگاه الزامی است", Toast.LENGTH_SHORT).show()
            binding.tilApiKey.error = "کلید اتصال را وارد کنید"
            return
        }
        binding.tilApiKey.error = null

        if (!isProd) {
            val url = binding.etServerUrl.text?.toString()?.trim().orEmpty()
            if (url.isBlank()) {
                Toast.makeText(this, "آدرس سرور در محیط تست الزامی است", Toast.LENGTH_SHORT).show()
                binding.tilServerUrl.error = "آدرس سرور الزامی است"
                return
            }
            binding.tilServerUrl.error = null
            prefs.testServerUrl = url
        }

        prefs.isProductionMode = isProd
        prefs.apiKey = key

        Toast.makeText(this, "تنظیمات با موفقیت ذخیره شد ✅", Toast.LENGTH_SHORT).show()
        finish()
    }

    private fun testConnection() {
        val isProd = binding.switchEnvMode.isChecked
        val url = if (isProd) {
            AppPreferences.PRODUCTION_SERVER_URL
        } else {
            binding.etServerUrl.text?.toString()?.trim().orEmpty()
        }

        val key = binding.etApiKey.text?.toString()?.trim().orEmpty()

        if (url.isBlank()) {
            Toast.makeText(this, "آدرس سرور مشخص نشده است", Toast.LENGTH_SHORT).show()
            return
        }
        if (key.isBlank()) {
            Toast.makeText(this, "لطفاً کلید دستگاه را وارد فرمایید", Toast.LENGTH_SHORT).show()
            binding.tilApiKey.error = "کلید دستگاه الزامی است"
            return
        }
        binding.tilApiKey.error = null

        binding.btnTest.isEnabled = false
        binding.btnTest.text = "در حال بررسی..."
        binding.cardTestResult.visibility = View.VISIBLE
        binding.tvTestResultTitle.text = "وضعیت تست اتصال:"
        binding.tvTestResult.text = "در حال ارسال درخواست تست به سرور $url ..."
        binding.tvTestResult.setTextColor(Color.parseColor("#475569"))

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val api = CardPayApi.create(url)
                val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                val pingReq = SmsSyncRequest(
                    sender = "TEST_PING",
                    rawText = "Connection test from HonarHub Pay Settings",
                    receivedAt = df.format(Date())
                )
                val response = api.sendSms("Bearer $key", pingReq)

                withContext(Dispatchers.Main) {
                    binding.btnTest.isEnabled = true
                    binding.btnTest.text = "تست اتصال"

                    if (response.isSuccessful) {
                        // 200 OK: Device was found, key verified!
                        binding.tvTestResultTitle.text = "اتصال موفق ✅"
                        binding.tvTestResultTitle.setTextColor(Color.parseColor("#059669"))
                        binding.tvTestResult.text = "اتصال با موفقیت برقرار شد و کلید معتبر است."
                        binding.tvTestResult.setTextColor(Color.parseColor("#059669"))
                        Toast.makeText(this@SettingsActivity, "اتصال برقرار شد و کلید معتبر است ✅", Toast.LENGTH_LONG).show()
                    } else if (response.code() == 401 || response.code() == 403) {
                        // Key invalid / unauthorized device
                        binding.tvTestResultTitle.text = "کلید نامعتبر ❌"
                        binding.tvTestResultTitle.setTextColor(Color.parseColor("#DC2626"))
                        binding.tvTestResult.text = "اتصال برقرار است ولی کلید معتبر نیست."
                        binding.tvTestResult.setTextColor(Color.parseColor("#DC2626"))
                        Toast.makeText(this@SettingsActivity, "اتصال برقرار است ولی کلید معتبر نیست ❌", Toast.LENGTH_LONG).show()
                    } else {
                        // Server responded with an error (e.g. 500, 502)
                        val code = response.code()
                        binding.tvTestResultTitle.text = "خطای سرور (کد $code) ❌"
                        binding.tvTestResultTitle.setTextColor(Color.parseColor("#D97706"))
                        binding.tvTestResult.text = "اتصال به سرور برقرار شد اما سرور با خطای $code پاسخ داد."
                        binding.tvTestResult.setTextColor(Color.parseColor("#D97706"))
                        Toast.makeText(this@SettingsActivity, "پاسخ ناموفق سرور (کد $code) ❌", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnTest.isEnabled = true
                    binding.btnTest.text = "تست اتصال"

                    val isNetworkError = e is IOException || e.message?.contains("connect") == true || e.message?.contains("host") == true
                    val errorTitle = if (isNetworkError) "خطای ارتباط با سرور ❌" else "خطای سیستمی ❌"
                    val errorDetail = if (isNetworkError) {
                        "خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت یا آدرس سرور را بررسی فرمایید."
                    } else {
                        "عدم برقراری ارتباط: ${e.localizedMessage ?: "خطای ناشناخته"}"
                    }

                    binding.tvTestResultTitle.text = errorTitle
                    binding.tvTestResultTitle.setTextColor(Color.parseColor("#DC2626"))
                    binding.tvTestResult.text = errorDetail
                    binding.tvTestResult.setTextColor(Color.parseColor("#DC2626"))
                    Toast.makeText(this@SettingsActivity, errorDetail, Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
