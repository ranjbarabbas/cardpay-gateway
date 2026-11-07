# CardPay Gateway (Automated P2P Card-to-Card Payment System)

An automated peer-to-peer (P2P) card-to-card payment gateway built with **Next.js**, **PostgreSQL (Prisma)**, and an **Android Native (Kotlin) SMS Bridge**.

CardPay enables direct bank-to-bank settlement with zero intermediaries, dynamic payment collision prevention (+5 Tomans offset), real-time countdown checkout pages, and instant payment verification via incoming bank SMS messages.

---

## 🏛 Architecture Overview

```
[Merchant / Store Frontend]
         │
         ▼ 1. POST /api/v1/payment/request (amount, cardId, callbackUrl)
[CardPay Gateway Backend (Next.js + Postgres)]
         │
         ├─► 2. Generates unique Authority & +5 Toman Offset
         ▼
[Hosted Checkout Page (/pay/[authority])]
  - Displays Destination Card
  - Shows Exact Payable Amount (+ Offset)
  - 10-minute Countdown Timer
  - Real-time Status Polling (Auto-redirect)
         │
         ▼ 3. Customer Transfers via Card-to-Card (Mobile Banking / ATM)
[Bank Network]
         │
         ▼ 4. Deposit SMS Sent to Cardholder Phone
[Android Phone (Admin or Artist)]
  - Native Kotlin App with Foreground Service
  - SMS BroadcastReceiver Intercepts Bank SMS
         │
         ▼ 5. POST /api/v1/sms/receive (Bearer DEVICE_API_KEY)
[CardPay Matcher Engine]
  - Parses Bank SMS (Account, Amount, Ref Code)
  - Matches with active PENDING Transaction
  - Marks PAID & Triggers Webhook
         │
         ▼ 6. Redirect to Merchant Callback URL
[Merchant Website]
         │
         ▼ 7. POST /api/v1/payment/verify (authority, amount)
[Order Marked Complete]
```

---

## 🚀 Key Features

1. **Dynamic Amount Offset (+5 Tomans)**:
   - When multiple users pay identical amounts simultaneously, the system automatically assigns unique increments (`+5`, `+10`, `+15`, etc.).
   - **10-Minute Payment Countdown**: Visible to the customer on the checkout screen.
   - **20-Minute Cooldown Window**: System locks identical amounts for 20 minutes to prevent edge-case collisions from late transfers.
2. **Multi-Card & Artist Management**:
   - Admin can register multiple bank cards (admin cards or vendor/artist accounts).
   - Set account numbers, IBANs, and associate cards with specific Android devices.
   - Activate, deactivate, or delete cards at any time via Admin UI or API.
3. **Modular Bank SMS Parser (Strategy Pattern)**:
   - First-class support for **Bank Mehr Iran** (`B.QMEHRIRAN`), extracting account numbers, deposit amounts, date/time, and balances.
   - Extensible interface (`IBankSMSParser`) allowing new banks to be added with minimal code.
   - Dynamic **Trusted Senders** registry: Admin can whitelist new SMS sender numbers with one click.
4. **Discrepancy & Reconciliation Engine**:
   - Unmatched bank deposits or late transfers are automatically logged as discrepancy tickets.
   - 1-click manual match and override in the Admin Dashboard.
5. **Android Native Sync Bridge (Kotlin)**:
   - Persistent `ForegroundService` with sticky notification to ensure uninterrupted 24/7 background operation across Android 10 - 15.
   - `BroadcastReceiver` listening to `android.provider.Telephony.SMS_RECEIVED`.
   - Device API Key authentication and connection test ping.
   - Automatic restart on device reboot (`BOOT_COMPLETED`).

---

## 📂 Project Structure

```
cardpay-gateway/
├── backend/                  # Next.js App Router & Prisma Service
│   ├── prisma/
│   │   └── schema.prisma     # PostgreSQL Database Schema
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/        # Admin Management Dashboard
│   │   │   ├── pay/[authority]/ # Hosted Checkout Page
│   │   │   └── api/v1/       # REST API Endpoints
│   │   │       ├── payment/  # request, verify, status
│   │   │       ├── sms/      # receive (from Android)
│   │   │       └── admin/    # cards, devices, senders, reconcile
│   │   └── lib/
│   │       ├── services/     # Amount offset & SMS matcher engines
│   │       │   └── parsers/  # Bank SMS parsers (Mehr Iran, etc.)
│   │       └── db.ts         # Prisma client instance
│   └── package.json
│
└── android/                  # Android Native SMS Sync Application
    ├── app/
    │   ├── src/main/
    │   │   ├── AndroidManifest.xml
    │   │   ├── java/com/cardpay/gateway/sync/
    │   │   │   ├── data/api/       # Retrofit Client
    │   │   │   ├── data/model/     # Request / Response Models
    │   │   │   ├── receiver/       # SmsBroadcastReceiver & BootReceiver
    │   │   │   ├── service/        # SmsSyncForegroundService
    │   │   │   ├── ui/             # MainActivity (Settings & Status)
    │   │   │   └── utils/          # AppPreferences
    │   │   └── res/layout/         # Material 3 UI Layouts
    │   └── build.gradle.kts
    └── build.gradle.kts
```

---

## 🛠 Backend Installation & Setup

### 1. Prerequisites
- Node.js 18+ (Tested on v22)
- PostgreSQL Database

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```
Configure your database URL and admin key:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cardpay_db?schema=public"
ADMIN_API_KEY="your-secure-admin-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Migration
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
- Gateway Landing: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3000/admin`

---

## 📱 Android App Setup

1. Open the `/android` project in **Android Studio**.
2. Build and install the APK on the phone that receives bank SMS (Admin's phone or Vendor's phone).
3. Grant **SMS** and **Notification** permissions when prompted.
4. In the app settings:
   - **Server URL**: Enter your deployed gateway URL (e.g. `https://gateway.yourdomain.com`).
   - **Device API Key**: Generate a key from the CardPay Admin Dashboard (`/admin` -> "دستگاه‌های اندروید") and paste it into the app.
   - Click **Save**, then **Test Ping** to verify connectivity.
   - Turn on the **Background Sync Service** toggle.

---

## 🔌 API Reference

### 1. Request Payment Intent
`POST /api/v1/payment/request`
```json
{
  "amount": 1000000,
  "cardId": "optional-specific-card-id",
  "callbackUrl": "https://store.example.com/checkout/callback",
  "customerMobile": "09123456789",
  "description": "Order #4821"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "authority": "CPAY_LXZK8_A1B2C3",
    "paymentUrl": "https://gateway.yourdomain.com/pay/CPAY_LXZK8_A1B2C3",
    "originalAmountToman": 1000000,
    "offsetToman": 5,
    "payableAmountToman": 1000005,
    "payableAmountRial": 10000050,
    "expiresAt": "2026-11-07T13:10:00.000Z",
    "card": {
      "ownerName": "عباس رنجبر",
      "cardNumber": "6037991234567890",
      "bankTitle": "بانک قرض‌الحسنه مهر ایران"
    }
  }
}
```

### 2. Verify Payment
`POST /api/v1/payment/verify`
```json
{
  "authority": "CPAY_LXZK8_A1B2C3",
  "amount": 1000000
}
```
**Response:**
```json
{
  "success": true,
  "status": "PAID",
  "data": {
    "authority": "CPAY_LXZK8_A1B2C3",
    "trackingCode": "662179818703777001",
    "amountToman": 1000005,
    "originalAmountToman": 1000000,
    "offsetToman": 5,
    "paidAt": "2026-11-07T13:02:15.000Z"
  }
}
```

---

## 📝 License
Proprietary - Developed for HonarHub & Associated Merchant Platforms.
