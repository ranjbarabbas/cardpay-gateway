import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    {
      path: "../../public/fonts/Vazirmatn-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://pay.honarhub.com"),
  title: {
    default: "هنرهاب پی | HonarHub Pay - درگاه پرداخت هوشمند کارت‌به‌کارت و سامانه پل",
    template: "%s | هنرهاب پی",
  },
  description: "سامانه هوشمند، خودکار و بلادرنگ پذیرش و تسویه پرداخت‌های کارت‌به‌کارت و انتقال سامانه پل با خوانش لحظه‌ای پیامک بانکی و وب‌سرویس مستقیم برای کسب‌وکارها",
  keywords: [
    "درگاه پرداخت کارت به کارت",
    "درگاه کارت به کارت خودکار",
    "تسویه خودکار بانکی",
    "درگاه پرداخت هوشمند",
    "درگاه سامانه پل",
    "وب سرویس کارت به کارت",
    "درگاه بدون اینماد",
    "پذیرنده کارت به کارت",
    "تطبیق خودکار پیامک بانکی",
    "درگاه انتقال شبا",
    "HonarHub Pay",
    "CardPay Gateway",
  ],
  authors: [{ name: "تیم توسعه هنرهاب پی", url: "https://pay.honarhub.com" }],
  creator: "HonarHub Pay",
  publisher: "HonarHub Pay",
  alternates: {
    canonical: "https://pay.honarhub.com",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://pay.honarhub.com",
    siteName: "هنرهاب پی | HonarHub Pay",
    title: "هنرهاب پی | درگاه پرداخت هوشمند کارت‌به‌کارت و سامانه انتقال پل",
    description: "پرداخت و تسویه خودکار و بلادرنگ کارت‌به‌کارت و انتقال سامانه پل با همگام‌ساز پیامک بانکی",
    images: [
      {
        url: "/images/honarhub_pay_logo.png",
        width: 1200,
        height: 630,
        alt: "هنرهاب پی - درگاه پرداخت کارت‌به‌کارت و سامانه پل",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "هنرهاب پی | درگاه پرداخت هوشمند کارت‌به‌کارت",
    description: "سامانه هوشمند و خودکار تسویه لحظه‌ای کارت‌به‌کارت و سامانه پل",
    images: ["/images/honarhub_pay_logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "HonarHub Pay",
      "alternateName": "هنرهاب پی",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web, Android",
      "description": "سامانه هوشمند و خودکار تسویه بلادرنگ کارت به کارت و انتقال سامانه پل با اپلیکیشن اندروید همگام‌ساز پیامک",
      "url": "https://pay.honarhub.com",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IRR"
      }
    },
    {
      "@type": "FinancialService",
      "name": "هنرهاب پی (HonarHub Pay)",
      "url": "https://pay.honarhub.com",
      "logo": "https://pay.honarhub.com/images/honarhub_pay_logo.png",
      "description": "ارائه‌دهنده وب‌سرویس مستقیم پرداخت کارت به کارت و سامانه انتقال پل با تایید هوشمند پیامکی",
      "currenciesAccepted": "IRR, IRT",
      "paymentAccepted": "کارت به کارت، سامانه پل، شبا"
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} font-sans h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
