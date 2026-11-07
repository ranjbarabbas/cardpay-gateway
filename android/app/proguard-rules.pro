# Proguard rules for CardPay Android app
-keep class com.cardpay.gateway.sync.data.model.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
