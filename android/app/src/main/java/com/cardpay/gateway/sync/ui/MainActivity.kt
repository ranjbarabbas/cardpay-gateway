package com.cardpay.gateway.sync.ui

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.cardpay.gateway.sync.R
import com.cardpay.gateway.sync.data.api.CardPayApi
import com.cardpay.gateway.sync.databinding.ActivityMainBinding
import com.cardpay.gateway.sync.service.SmsSyncForegroundService
import com.cardpay.gateway.sync.utils.AppPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: AppPreferences
    private lateinit var transactionAdapter: TransactionAdapter

    private val transactionUpdateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            loadTransactions(fetchFromServer = false)
            updateStatusView()
        }
    }

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
        setupTransactionsRecyclerView()
    }

    override fun onResume() {
        super.onResume()
        updateThemeToggleIcon()
        updateStatusView()
        loadTransactions(fetchFromServer = true)
    }

    override fun onStart() {
        super.onStart()
        val filter = IntentFilter(SmsSyncForegroundService.ACTION_TRANSACTION_UPDATED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(transactionUpdateReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(transactionUpdateReceiver, filter)
        }
    }

    override fun onStop() {
        super.onStop()
        try {
            unregisterReceiver(transactionUpdateReceiver)
        } catch (_: Exception) {}
    }

    private fun setupTransactionsRecyclerView() {
        transactionAdapter = TransactionAdapter()
        binding.rvTransactions.layoutManager = LinearLayoutManager(this)
        binding.rvTransactions.adapter = transactionAdapter
        loadTransactions(fetchFromServer = false)
    }

    private fun loadTransactions(fetchFromServer: Boolean) {
        // 1. Immediately show locally cached transactions
        val localList = prefs.getRecentTransactions()
        renderTransactionList(localList)

        // 2. Fetch latest from server if configured
        if (fetchFromServer && prefs.apiKey.isNotBlank() && prefs.serverUrl.isNotBlank()) {
            lifecycleScope.launch(Dispatchers.IO) {
                try {
                    val api = CardPayApi.create(prefs.serverUrl)
                    val response = api.getRecentTransactions("Bearer ${prefs.apiKey}")
                    if (response.isSuccessful && response.body()?.success == true) {
                        val serverItems = response.body()?.data
                        if (!serverItems.isNullOrEmpty()) {
                            // Merge server transactions with local transactions
                            val mergedMap = LinkedHashMap<String, com.cardpay.gateway.sync.data.model.RecentTransaction>()
                            for (item in serverItems) {
                                mergedMap[item.id] = item
                            }
                            for (local in localList) {
                                if (!mergedMap.containsKey(local.id)) {
                                    mergedMap[local.id] = local
                                }
                            }
                            val mergedList = mergedMap.values.sortedByDescending { it.timestamp }.take(10)
                            prefs.setRecentTransactions(mergedList)

                            withContext(Dispatchers.Main) {
                                renderTransactionList(mergedList)
                            }
                        }
                    }
                } catch (_: Exception) {
                    // Retain local list if offline
                }
            }
        }
    }

    private fun renderTransactionList(list: List<com.cardpay.gateway.sync.data.model.RecentTransaction>) {
        if (list.isEmpty()) {
            binding.layoutEmptyLogs.visibility = View.VISIBLE
            binding.rvTransactions.visibility = View.GONE
        } else {
            binding.layoutEmptyLogs.visibility = View.GONE
            binding.rvTransactions.visibility = View.VISIBLE
            transactionAdapter.submitList(list)
        }
    }

    private fun updateThemeToggleIcon() {
        if (prefs.themeMode == "light") {
            binding.btnToggleTheme.setImageResource(R.drawable.ic_dark_mode)
            binding.btnToggleTheme.contentDescription = "تغییر به حالت تیره"
        } else {
            binding.btnToggleTheme.setImageResource(R.drawable.ic_light_mode)
            binding.btnToggleTheme.contentDescription = "تغییر به حالت روشن"
        }
    }

    private fun setupUI() {
        // Gear settings icon click
        binding.btnOpenSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        binding.btnQuickSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        // Refresh transactions button
        binding.btnRefreshTransactions.setOnClickListener {
            Toast.makeText(this, "در حال بروزرسانی سوابق تراکنش‌ها...", Toast.LENGTH_SHORT).show()
            loadTransactions(fetchFromServer = true)
        }

        // Quick Theme Toggle (Light / Dark)
        updateThemeToggleIcon()
        binding.btnToggleTheme.setOnClickListener {
            val newTheme = if (prefs.themeMode == "light") "dark" else "light"
            prefs.themeMode = newTheme
            prefs.applyTheme()
            updateThemeToggleIcon()
            val themeName = if (newTheme == "dark") "تیره (Dark Mode)" else "روشن (Light Mode)"
            Toast.makeText(this, "پوسته برنامه به $themeName تغییر یافت", Toast.LENGTH_SHORT).show()
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

        val envPrefix = if (prefs.isProductionMode) "[عملیاتی]" else "[تست]"
        binding.tvServerInfo.text = "$envPrefix سرور متصل: ${prefs.serverUrl}"
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
