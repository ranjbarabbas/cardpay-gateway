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

        // Common Persian financial and bank keywords
        private val FINANCIAL_KEYWORDS = listOf(
            "مانده", "واریز", "برداشت", "موجود", "حساب", "کارت",
            "انتقال", "پایا", "ساتنا", "شاپرک", "سپرده", "ریال", "تومان",
            "bank", "mehr", "meli", "mellat", "saman", "sepah"
        )
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

            // Filter on device: Only forward if it matches bank or financial structure
            if (!isBankOrFinancialSms(sender, body)) {
                Log.d(TAG, "Ignored non-financial/personal SMS from: $sender")
                return
            }

            Log.d(TAG, "Bank-like SMS detected from: $sender. Forwarding to foreground service.")
            SmsSyncForegroundService.sendSms(context, sender, body, timestamp)
        } catch (e: Exception) {
            Log.e(TAG, "Error processing incoming SMS", e)
        }
    }

    /**
     * Checks if the SMS exhibits banking or financial characteristics
     */
    private fun isBankOrFinancialSms(sender: String, body: String): Boolean {
        val lowerSender = sender.lowercase()
        val lowerBody = body.lowercase()

        // 1. Sender contains bank indicators
        if (lowerSender.contains("bank") || lowerSender.contains("mehr") ||
            lowerSender.contains("meli") || lowerSender.contains("mellat") ||
            lowerSender.contains("b.q") || lowerSender.contains("shaparak")) {
            return true
        }

        // 2. Deposit or withdrawal indicator (+ or - next to numbers)
        val hasPlusMinusAmount = Regex("""[0-9,]+(\+|\-)""").containsMatchIn(body) ||
                                 Regex("""(\+|\-)\s*[0-9,]+""").containsMatchIn(body)

        if (hasPlusMinusAmount) return true

        // 3. Contains Persian bank keywords
        var matches = 0
        for (keyword in FINANCIAL_KEYWORDS) {
            if (lowerBody.contains(keyword)) {
                matches++
                if (matches >= 2) return true
            }
        }

        return false
    }
}
