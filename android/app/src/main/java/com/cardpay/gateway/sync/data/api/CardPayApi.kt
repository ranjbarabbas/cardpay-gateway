package com.cardpay.gateway.sync.data.api

import com.cardpay.gateway.sync.data.model.SmsSyncRequest
import com.cardpay.gateway.sync.data.model.SmsSyncResponse
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface CardPayApi {

    @POST("api/v1/sms/receive")
    suspend fun sendSms(
        @Header("Authorization") authHeader: String,
        @Body request: SmsSyncRequest
    ): Response<SmsSyncResponse>

    companion object {
        fun create(baseUrl: String): CardPayApi {
            val cleanUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .build()

            return Retrofit.Builder()
                .baseUrl(cleanUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(CardPayApi::class.java)
        }
    }
}
