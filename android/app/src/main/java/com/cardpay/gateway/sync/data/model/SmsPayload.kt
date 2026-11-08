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
    @SerializedName("trackingCode") val trackingCode: String?,
    @SerializedName("reason") val reason: String?
)

data class DeviceNotificationItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("message") val message: String,
    @SerializedName("createdAt") val createdAt: String
)

data class DeviceNotificationResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<DeviceNotificationItem>?
)
