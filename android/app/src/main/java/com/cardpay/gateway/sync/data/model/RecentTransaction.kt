package com.cardpay.gateway.sync.data.model

import com.google.gson.annotations.SerializedName

data class RecentTransaction(
    @SerializedName("id") val id: String,
    @SerializedName("sender") val sender: String,
    @SerializedName("messageSnippet") val messageSnippet: String,
    @SerializedName("amountToman") val amountToman: Long? = null,
    @SerializedName("trackingCode") val trackingCode: String? = null,
    @SerializedName("status") val status: String, // e.g. "تایید شده", "در حال بررسی", "ناموفق"
    @SerializedName("statusCode") val statusCode: String, // "MATCHED", "PENDING", "ERROR"
    @SerializedName("timestamp") val timestamp: Long = System.currentTimeMillis()
)

data class DeviceTransactionsResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<RecentTransaction>?,
    @SerializedName("error") val error: String?
)
