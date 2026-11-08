package com.cardpay.gateway.sync.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.cardpay.gateway.sync.data.api.CardPayApi
import com.cardpay.gateway.sync.data.model.SmsSyncRequest
import com.cardpay.gateway.sync.utils.AppPreferences
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class SmsSyncForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var prefs: AppPreferences
    private var pollJob: Job? = null

    companion object {
        private const val TAG = "SmsSyncService"
        private const val SERVICE_CHANNEL_ID = "cardpay_sms_sync_channel"
        private const val ALERT_CHANNEL_ID = "cardpay_admin_alerts_channel"
        private const val NOTIFICATION_ID = 1001

        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_PROCESS_SMS = "ACTION_PROCESS_SMS"

        const val EXTRA_SENDER = "EXTRA_SENDER"
        const val EXTRA_BODY = "EXTRA_BODY"
        const val EXTRA_TIMESTAMP = "EXTRA_TIMESTAMP"

        fun startService(context: Context) {
            val intent = Intent(context, SmsSyncForegroundService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun sendSms(context: Context, sender: String, body: String, timestamp: Long) {
            val intent = Intent(context, SmsSyncForegroundService::class.java).apply {
                action = ACTION_PROCESS_SMS
                putExtra(EXTRA_SENDER, sender)
                putExtra(EXTRA_BODY, body)
                putExtra(EXTRA_TIMESTAMP, timestamp)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        prefs = AppPreferences(this)
        createNotificationChannels()
        startNotificationPoller()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                pollJob?.cancel()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_PROCESS_SMS -> {
                val sender = intent.getStringExtra(EXTRA_SENDER) ?: ""
                val body = intent.getStringExtra(EXTRA_BODY) ?: ""
                val timestamp = intent.getLongExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())
                handleIncomingSms(sender, body, timestamp)
            }
            ACTION_START -> {
                Log.d(TAG, "Foreground service started and listening")
            }
        }

        startForeground(NOTIFICATION_ID, buildOngoingNotification("سرویس شنود پیامک‌های بانکی فعال است"))
        return START_STICKY
    }

    private fun handleIncomingSms(sender: String, body: String, timestamp: Long) {
        if (!prefs.isSyncEnabled || prefs.apiKey.isBlank() || prefs.serverUrl.isBlank()) {
            Log.w(TAG, "Sync disabled or missing credentials. Skipping SMS.")
            return
        }

        serviceScope.launch {
            try {
                val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                val isoDate = df.format(Date(timestamp))

                val api = CardPayApi.create(prefs.serverUrl)
                val request = SmsSyncRequest(sender = sender, rawText = body, receivedAt = isoDate)
                val response = api.sendSms("Bearer ${prefs.apiKey}", request)

                if (response.isSuccessful && response.body()?.success == true) {
                    val result = response.body()?.data
                    val statusText = if (result?.matched == true) {
                        "تراکنش تایید شد (کد: ${result.trackingCode ?: result.authority})"
                    } else {
                        "پیامک ثبت شد: ${result?.reason ?: "در صف بررسی"}"
                    }
                    prefs.lastSyncStatus = statusText
                    updateOngoingNotification(statusText)
                    Log.i(TAG, "SMS successfully processed: $statusText")
                } else {
                    val errorMsg = "پاسخ ناموفق سرور: ${response.code()}"
                    prefs.lastSyncStatus = errorMsg
                    Log.e(TAG, errorMsg)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Network error during SMS forward", e)
                prefs.lastSyncStatus = "خطای اتصال: ${e.localizedMessage}"
            }
        }
    }

    /**
     * Polls the server periodically for Push Notifications sent by the Admin Panel
     */
    private fun startNotificationPoller() {
        pollJob?.cancel()
        pollJob = serviceScope.launch {
            while (isActive) {
                if (prefs.isSyncEnabled && prefs.apiKey.isNotBlank() && prefs.serverUrl.isNotBlank()) {
                    try {
                        val api = CardPayApi.create(prefs.serverUrl)
                        val res = api.getNotifications("Bearer ${prefs.apiKey}")
                        if (res.isSuccessful && res.body()?.success == true) {
                            val items = res.body()?.data
                            if (!items.isNullOrEmpty()) {
                                for (item in items) {
                                    showAdminNotification(item.title, item.message)
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.d(TAG, "Notification poll error: ${e.message}")
                    }
                }
                delay(20000) // Poll every 20 seconds
            }
        }
    }

    private fun showAdminNotification(title: String, message: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notification = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        val notifId = (System.currentTimeMillis() % 10000).toInt() + 2000
        manager.notify(notifId, notification)
    }

    private fun buildOngoingNotification(statusText: String): Notification {
        return NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
            .setContentTitle("CardPay SMS Sync Service")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateOngoingNotification(statusText: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildOngoingNotification(statusText))
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)

            // 1. Service Ongoing Channel
            val serviceChannel = NotificationChannel(
                SERVICE_CHANNEL_ID,
                "CardPay Sync Background Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows the active SMS listener status"
            }
            manager?.createNotificationChannel(serviceChannel)

            // 2. Admin Push Notification Channel
            val alertChannel = NotificationChannel(
                ALERT_CHANNEL_ID,
                "CardPay Admin Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Push notifications sent from CardPay Admin Dashboard"
                enableVibration(true)
            }
            manager?.createNotificationChannel(alertChannel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        pollJob?.cancel()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
