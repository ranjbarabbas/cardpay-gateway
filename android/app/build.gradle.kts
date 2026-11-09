plugins {
    id("com.android.application")
    id("kotlin-android")
}

android {
    namespace = "com.cardpay.gateway.sync"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.cardpay.gateway.sync"
        minSdk = 24
        targetSdk = 34
        versionCode = 5
        versionName = "1.4.0"
    }

    signingConfigs {
        create("release") {
            storeFile = file("cardpay-release.jks")
            storePassword = "cardpay123"
            keyAlias = "cardpay"
            keyPassword = "cardpay123"
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")

    // Networking & JSON
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
