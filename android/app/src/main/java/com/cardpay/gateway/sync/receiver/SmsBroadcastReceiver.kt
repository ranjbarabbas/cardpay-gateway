package com.cardpay.gateway.sync.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.cardpay.gateway.sync.service.SmsSyncForegroundService
import com.cardpay.gateway.sync.utils.AppPreferences

class SmsBroadcastReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsBroadcastReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val prefs = AppPreferences(context)
        if (!prefs.isSyncEnabled) {
            Log.d(TAG, "Sync is disabled in settings. Skipping received SMS.")
            return
        }

        try {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (messages.isNullOrEmpty()) return

            val sender = messages[0].displayOriginatingAddress ?: ""
            val timestamp = messages[0].timestampMillis

            // Combine multipart SMS segments
            val fullBody = StringBuilder()
            for (msg in messages) {
                fullBody.append(msg.displayMessageBody)
            }

            val body = fullBody.toString()
            Log.d(TAG, "Received SMS from: $sender (length: ${body.length})")

            // Forward to Foreground Service for network dispatch
            SmsSyncForegroundService.sendSms(context, sender, body, timestamp)
        } catch (e: Exception) {
            Log.e(TAG, "Error processing incoming SMS", e)
        }
    }
}
