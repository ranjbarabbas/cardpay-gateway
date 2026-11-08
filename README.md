# CardPay Gateway & Android Sync Companion

[![GitHub Release](https://img.shields.io/github/v/release/ranjbarabbas/cardpay-gateway?style=for-the-badge&color=emerald&logo=github)](https://github.com/ranjbarabbas/cardpay-gateway/releases)
[![Download APK](https://img.shields.io/badge/Download-CardPay_Sync_v1.0.0.apk-10B981?style=for-the-badge&logo=android&logoColor=white)](https://github.com/ranjbarabbas/cardpay-gateway/releases/download/v1.0.0/cardpay-sync.apk)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Kotlin](https://img.shields.io/badge/Kotlin-Android_Native-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org)

An enterprise-grade, peer-to-peer (P2P) card-to-card automated payment gateway system. Designed for independent merchants, startups, and marketplaces seeking direct-to-bank instant settlement with zero intermediary fees, zero account freeze risks, and zero dependency on traditional PSPs.

---

## 📥 Android Companion App Release

| Asset Name | Version | Size | Checksum (SHA-256) | Download Link |
| :--- | :---: | :---: | :--- | :--- |
| **`cardpay-sync.apk`** | `v1.0.0` | **5.2 MB** | `80e0dbfb35e8c46926ab18d9771876cb0148581abe4553f21f52102e6f872107` | [**Download from GitHub Releases**](https://github.com/ranjbarabbas/cardpay-gateway/releases/download/v1.0.0/cardpay-sync.apk) |

> **Direct Server Endpoint:** You can also download the latest APK directly from your gateway instance at `GET /api/v1/download/apk`.

---

## 🏛 System Architecture & Data Flow

```
[Customer Checkout] 
        │
        ▼ 1. POST /api/v1/payment/request (amount, callbackUrl)
[CardPay Gateway Backend (Next.js 16 + SQLite / PostgreSQL)]
        │
        ├─► 2. Generates PAY-YYYYMMDDXXXXXXXX tracking code & +11 Toman dynamic offset
        ▼
[Hosted Checkout UI (/pay/[authority])]
  - Realistic EMV Chip Card visualizer
  - 10-Minute countdown safety timer
  - Auto-polling status listener
        │
        ▼ 3. Customer Transfers Funds via Mobile Banking or ATM
[Bank Network (Bank Mehr Iran / others)]
        │
        ▼ 4. Inbound Deposit SMS to Phone ("111122223333444455\n1,500,110+\n...")
[Android Device (Admin / Artist Phone)]
  - Persistent Foreground Service (Sticky Notification)
  - Isolated Settings Activity (Gear icon ⚙️)
  - BroadcastReceiver intercepts SMS from whitelist
  - Real-time Admin Push Notification poller
        │
        ▼ 5. POST /api/v1/sms/receive (Header: x-device-key)
[CardPay Matcher & Anti-Fraud Engine]
  - Verifies Approved Trusted Sender (e.g. B.QMEHRIRAN)
  - Unrecognized senders quarantined to Pending Review queue
  - Matches active reservation window (+11 Toman offset)
  - Marks transaction SUCCESS & triggers webhook
        │
        ▼ 6. Redirect to Store Callback
[Merchant Backend]
        │
        ▼ 7. POST /api/v1/payment/verify
[Order Settled & Fulfilled]
```

---

## 🌟 Key Features

### 1. Dynamic Amount Offset Algorithm (`+11` Tomans)
- Prevents payment collision between concurrent customers purchasing items of the same price.
- **Incremental Steps**: First transaction gets `Amount + 11`, concurrent transaction gets `Amount + 12`, third gets `Amount + 13`, etc.
- **Safety Window**: 10-minute customer countdown on the checkout page; 20-minute reservation lock in the backend database.

### 2. Standard Shamsi Internal Tracking Codes
- Internal tracking codes follow the format:
  $$\text{PAY-} + \text{YYYYMMDD (Jalali Date)} + \text{XXXXXXXX (8 Secure Random Digits)}$$
- Example: `PAY-1405081748291045`

### 3. Two-Tier Anti-Fraud SMS Verification
- **Approved Trusted Senders**: SMS from verified bank senders (e.g. `B.QMEHRIRAN`) are processed immediately, confirming transactions automatically.
- **Pending Review Queue**: Unverified numbers sending bank-format messages are quarantined in the admin panel with `Approve & Trust` or `Reject` actions to prevent counterfeit SMS attacks.

### 4. Native Android Companion App (Kotlin)
- **Standalone Settings Activity**: Accessed via a clean Gear icon (⚙️) on the top bar.
- **Push Notification Engine**: Admin can push custom notifications and broadcast alerts directly to mobile devices from `/admin`.
- **Persistent Foreground Service**: Runs 24/7 in the background with auto-restart on boot (`BOOT_COMPLETED`).

### 5. GitBook-Style Interactive Developer Portal (`/docs`)
- Full REST API reference with copyable endpoints.
- Interactive **Live Sandbox Playground**: execute real requests directly against the gateway.
- Multi-language code snippets for **cURL**, **Node.js (TypeScript)**, **Python**, and **PHP**.
- Global search shortcut (`Cmd+K` / `Ctrl+K`).

### 6. Configurable Admin Access (`EMAILS`)
- Admin authorization can be controlled via the `EMAILS` environment variable (e.g. `EMAILS="admin@example.com,support@example.com"`).

---

## 🔌 Core API Endpoints

### 1. Create Payment Request
`POST /api/v1/payment/request`

```bash
curl -X POST "http://localhost:3050/api/v1/payment/request" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150000,
    "callbackUrl": "https://mystore.ir/checkout/callback",
    "description": "Order #1042"
  }'
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "authority": "CP-685b8fae92cf4a66a1a8ecb8",
    "internalTrackingCode": "PAY-1405081748291045",
    "payableAmountToman": 150011,
    "originalAmountToman": 150000,
    "offsetAmountToman": 11,
    "reservationWindowMinutes": 20,
    "paymentUrl": "http://localhost:3050/pay/CP-685b8fae92cf4a66a1a8ecb8",
    "assignedCard": {
      "bankName": "بانک قرض الحسنه مهر ایران",
      "cardNumber": "6037990012345678",
      "accountNumber": "111122223333444455",
      "holderName": "رضا محمدی"
    }
  }
}
```

### 2. Verify Payment
`POST /api/v1/payment/verify`

```bash
curl -X POST "http://localhost:3050/api/v1/payment/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "authority": "CP-685b8fae92cf4a66a1a8ecb8",
    "amount": 150011
  }'
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Transaction verified and settled successfully",
  "data": {
    "authority": "CP-685b8fae92cf4a66a1a8ecb8",
    "internalTrackingCode": "PAY-1405081748291045",
    "status": "SETTLED",
    "paidAmountToman": 150011
  }
}
```

---

## 🚀 Getting Started

### 1. Clone & Configure
```bash
git clone https://github.com/ranjbarabbas/cardpay-gateway.git
cd cardpay-gateway/backend
cp .env.example .env
```

### 2. Environment Variables (`.env`)
```env
DATABASE_URL="file:./dev.db"
ADMIN_API_KEY="super-secret-admin-key"
NEXT_PUBLIC_APP_URL="http://localhost:3050"
EMAILS="admin@example.com"
```

### 3. Install & Run
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The gateway runs by default on port **3050** (`http://localhost:3050`):
- **Landing Page**: `http://localhost:3050/`
- **Interactive Docs**: `http://localhost:3050/docs`
- **Admin Dashboard**: `http://localhost:3050/admin`

---

## 📱 Compiling Android App from Source

```bash
cd android
export ANDROID_HOME=/path/to/android-sdk
export JAVA_HOME=/path/to/jdk-17
./gradlew assembleRelease
```
The compiled release binary is located at `android/app/build/outputs/apk/release/app-release.apk`.

---

## 📄 License
MIT License. Open-source CardPay Gateway Project.
All commits and documentation are maintained strictly in English.
