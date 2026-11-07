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
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class SmsSyncForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var prefs: AppPreferences

    companion object {
        private const val TAG = "SmsSyncService"
        private const val CHANNEL_ID = "cardpay_sms_sync_channel"
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
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
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

        startForeground(NOTIFICATION_ID, buildNotification("سرویس شنود پیامک بانکی فعال است"))
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
                        "پرداخت با موفقیت تطبیق یافت (شناسه: ${result.authority})"
                    } else {
                        "پیامک دریافت شد (${result?.reason ?: "ثبت در سیستم"})"
                    }
                    prefs.lastSyncStatus = statusText
                    updateNotification(statusText)
                    Log.i(TAG, "SMS successfully forwarded to backend: $statusText")
                } else {
                    val errorMsg = "خطا در ارسال پیامک: ${response.code()}"
                    prefs.lastSyncStatus = errorMsg
                    Log.e(TAG, errorMsg)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Network error during SMS forward", e)
                prefs.lastSyncStatus = "خطای ارتباط با سرور: ${e.localizedMessage}"
            }
        }
    }

    private fun buildNotification(statusText: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CardPay Sync Service")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(statusText: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(statusText))
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "CardPay Sync Foreground Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors and forwards incoming bank SMS to CardPay server"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
