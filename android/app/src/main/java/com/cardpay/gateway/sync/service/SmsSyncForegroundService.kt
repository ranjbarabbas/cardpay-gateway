package com.cardpay.gateway.sync.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.app.PendingIntent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.cardpay.gateway.sync.ui.MainActivity
import com.cardpay.gateway.sync.data.api.CardPayApi
import com.cardpay.gateway.sync.data.model.RecentTransaction
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
import java.util.UUID

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
        const val ACTION_TRANSACTION_UPDATED = "com.cardpay.gateway.sync.ACTION_TRANSACTION_UPDATED"

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

        startForeground(NOTIFICATION_ID, buildOngoingNotification("سرویس رصد و همگام‌سازی پیامک‌های بانکی فعال است"))
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
                    val isMatched = result?.matched == true
                    val tracking = result?.trackingCode ?: result?.authority ?: ""
                    val reason = result?.reason ?: ""

                    val statusText: String
                    val statusLabel: String
                    val statusCode: String

                    if (isMatched) {
                        statusText = "تراکنش تایید شد (کد: $tracking)"
                        statusLabel = "تایید شده"
                        statusCode = "MATCHED"
                        showSmsNotification("تایید پرداخت هنرهاب پی", "تراکنش واریز با موفقیت تایید شد (کد: $tracking)")
                    } else {
                        if (reason.contains("PENDING_REVIEW") || reason.contains("UNTRUSTED_SENDER") || reason.contains("سرخط")) {
                            statusLabel = "در حال بررسی (سرخط)"
                            statusText = "پیامک ثبت شد: در حال بررسی سرخط"
                        } else {
                            statusLabel = "در حال بررسی"
                            statusText = "پیامک ثبت شد: $reason"
                        }
                        statusCode = "PENDING"
                        showSmsNotification("پیامک بانکی جدید", "پیامک بانک دریافت شد: $statusLabel")
                    }

                    prefs.lastSyncStatus = statusText
                    updateOngoingNotification(statusText)

                    // Extract amount if present in text
                    val amount: Long? = try {
                        val reg = Regex("""(?:مبلغ|واریز|واریزی|مبلغ:|مبلغ: )\s*([0-9,]+)""")
                        val m = reg.find(body)
                        m?.groupValues?.get(1)?.replace(",", "")?.toLongOrNull()
                    } catch (e: Exception) {
                        null
                    }

                    val txItem = RecentTransaction(
                        id = result?.smsLogId ?: UUID.randomUUID().toString(),
                        sender = sender,
                        messageSnippet = body.take(160),
                        amountToman = amount,
                        trackingCode = if (tracking.isNotBlank()) tracking else null,
                        status = statusLabel,
                        statusCode = statusCode,
                        timestamp = timestamp
                    )
                    prefs.addRecentTransaction(txItem)
                    sendTransactionUpdateBroadcast()
                    Log.i(TAG, "SMS successfully processed: $statusText")
                } else {
                    val errorMsg = "پاسخ ناموفق سرور: ${response.code()}"
                    prefs.lastSyncStatus = errorMsg
                    Log.e(TAG, errorMsg)

                    val statusLabel = if (response.code() == 401 || response.code() == 403) "کلید نامعتبر" else "خطای سرور"
                    val txItem = RecentTransaction(
                        id = UUID.randomUUID().toString(),
                        sender = sender,
                        messageSnippet = body.take(160),
                        amountToman = null,
                        trackingCode = null,
                        status = statusLabel,
                        statusCode = "ERROR",
                        timestamp = timestamp
                    )
                    prefs.addRecentTransaction(txItem)
                    sendTransactionUpdateBroadcast()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Network error during SMS forward", e)
                prefs.lastSyncStatus = "خطای اتصال: ${e.localizedMessage}"

                val txItem = RecentTransaction(
                    id = UUID.randomUUID().toString(),
                    sender = sender,
                    messageSnippet = body.take(160),
                    amountToman = null,
                    trackingCode = null,
                    status = "خطای اتصال",
                    statusCode = "ERROR",
                    timestamp = timestamp
                )
                prefs.addRecentTransaction(txItem)
                sendTransactionUpdateBroadcast()
            }
        }
    }

    private fun sendTransactionUpdateBroadcast() {
        try {
            val broadcastIntent = Intent(ACTION_TRANSACTION_UPDATED).apply {
                setPackage(packageName)
            }
            sendBroadcast(broadcastIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending transaction update broadcast", e)
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

    private fun createActivityPendingIntent(id: Int): PendingIntent {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getActivity(this, id, intent, flags)
    }

    private fun showAdminNotification(title: String, message: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notifId = (System.currentTimeMillis() % 10000).toInt() + 2000
        val pendingIntent = createActivityPendingIntent(notifId)

        val notification = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        manager.notify(notifId, notification)
    }

    private fun showSmsNotification(title: String, message: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notifId = (System.currentTimeMillis() % 10000).toInt() + 3000
        val pendingIntent = createActivityPendingIntent(notifId)

        val notification = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        manager.notify(notifId, notification)
    }

    private fun buildOngoingNotification(statusText: String): Notification {
        val pendingIntent = createActivityPendingIntent(NOTIFICATION_ID)
        return NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
            .setContentTitle("هنرهاب پی (همگام‌ساز پیامک)")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(pendingIntent)
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
                "سرویس همگام‌ساز هنرهاب پی",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "نمایش وضعیت سرویس فعال رصد پیامک‌های بانکی"
            }
            manager?.createNotificationChannel(serviceChannel)

            // 2. Admin Push Notification Channel
            val alertChannel = NotificationChannel(
                ALERT_CHANNEL_ID,
                "پیام‌ها و اعلان‌های هنرهاب پی",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "پیام‌های سیستم و اعلان‌های ارسالی از پنل مدیریت هنرهاب پی"
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
