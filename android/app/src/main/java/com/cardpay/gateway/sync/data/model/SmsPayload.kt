package com.cardpay.gateway.sync.data.model

import com.google.gson.annotations.SerializedName

data class SmsSyncRequest(
    @SerializedName("sender") val sender: String,
    @SerializedName("rawText") val rawText: String,
    @SerializedName("receivedAt") val receivedAt: String
)

data class SmsSyncResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: SmsSyncData?,
    @SerializedName("error") val error: String?
)

data class SmsSyncData(
    @SerializedName("matched") val matched: Boolean,
    @SerializedName("smsLogId") val smsLogId: String?,
    @SerializedName("transactionId") val transactionId: String?,
    @SerializedName("authority") val authority: String?,
    @SerializedName("reason") val reason: String?
)
