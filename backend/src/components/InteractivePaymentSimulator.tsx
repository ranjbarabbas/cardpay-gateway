"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Smartphone,
  CreditCard,
  Send,
  Sparkles,
} from "lucide-react";

export default function InteractivePaymentSimulator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentScene, setCurrentScene] = useState(1);
  const [amountText, setAmountText] = useState("");
  const [submitBtnPressed, setSubmitBtnPressed] = useState(false);
  const [panelSuccess, setPanelSuccess] = useState(false);
  const [customerPhoneShown, setCustomerPhoneShown] = useState(false);
  const [phonePayPressed, setPhonePayPressed] = useState(false);
  const [phonePaymentSuccess, setPhonePaymentSuccess] = useState(false);
  const [activePhone, setActivePhone] = useState<"customer" | "sync">("customer");
  const [syncPhoneShown, setSyncPhoneShown] = useState(false);
  const [smsNotificationShown, setSmsNotificationShown] = useState(false);
  const [signalShooting, setSignalShooting] = useState(false);
  const [gatewaySuccess, setGatewaySuccess] = useState(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    let isCancelled = false;

    const runSimulationLoop = async () => {
      // Small initial delay on first mount
      await sleep(400);

      while (!isCancelled) {
        // 0. Reset all states for new loop iteration
        setAmountText("");
        setSubmitBtnPressed(false);
        setPanelSuccess(false);
        setCustomerPhoneShown(false);
        setPhonePayPressed(false);
        setPhonePaymentSuccess(false);
        setActivePhone("customer");
        setSyncPhoneShown(false);
        setSmsNotificationShown(false);
        setSignalShooting(false);
        setGatewaySuccess(false);

        // مرحله ۱: تولید فاکتور با آفست در پنل فروشنده
        setCurrentStep(1);
        setCurrentScene(1);
        await sleep(600);
        if (isCancelled) break;

        // Typing effect for 100,000 Toman
        const textToType = "۱۰۰۰۰۰";
        let typed = "";
        for (let i = 0; i < textToType.length; i++) {
          if (isCancelled) break;
          typed += textToType[i];
          setAmountText(typed);
          await sleep(120);
        }
        await sleep(400);
        if (isCancelled) break;

        // Click submit button
        setSubmitBtnPressed(true);
        await sleep(180);
        setSubmitBtnPressed(false);
        setPanelSuccess(true);
        await sleep(2000);
        if (isCancelled) break;

        // مرحله ۲: پرداخت مشتری در درگاه و موبایل‌بانک
        setCurrentStep(2);
        setCurrentScene(2);
        await sleep(700);
        setCustomerPhoneShown(true);
        await sleep(2200);
        if (isCancelled) break;

        // Click pay in customer phone
        setPhonePayPressed(true);
        await sleep(180);
        setPhonePayPressed(false);
        setPhonePaymentSuccess(true);
        await sleep(2400);
        if (isCancelled) break;

        // مرحله ۳: دریافت پیامک توسط اپلیکیشن همگام‌ساز و تایید
        setCurrentStep(3);
        setActivePhone("sync");
        await sleep(80);
        setSyncPhoneShown(true);
        await sleep(1400);
        if (isCancelled) break;

        setSmsNotificationShown(true);
        await sleep(2400);
        if (isCancelled) break;

        // Shoot confirmation signal to gateway
        setSignalShooting(true);
        await sleep(800);
        setGatewaySuccess(true);
        await sleep(2800);
        if (isCancelled) break;

        // مرحله ۴: بازگشت به سایت پذیرنده و نمایش وضعیت موفق
        setCurrentStep(4);
        setSignalShooting(false);
        setCurrentScene(3);
        await sleep(3500);
        if (isCancelled) break;

        // Small pause before repeating
        await sleep(1000);
      }
    };

    runSimulationLoop();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="w-full bg-[#0B0F17]/95 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden font-sans">
      <style jsx>{`
        @keyframes shootSignalAnim {
          0% {
            transform: translate(60px, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-100px, 0);
            opacity: 0;
          }
        }
        .signal-bullet {
          animation: shootSignalAnim 0.8s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>نحوه کار سامانه • شبیه‌ساز انیمیشنی چرخه پرداخت</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            پردازش و تایید اتوماتیک پرداخت کارت به کارت در چند ثانیه
          </h2>
        </div>

        {/* Live Automatic Indicator */}
        <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl text-emerald-300 text-xs font-bold shrink-0 shadow-lg shadow-emerald-500/10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>شبیه‌ساز خودکار</span>
        </div>
      </div>

      {/* Main Grid: Steps on right, Stage on left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Right Column: 4 Steps List */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          {/* Step 1 */}
          <div
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              currentStep === 1
                ? "bg-slate-900 border-teal-500/80 shadow-lg shadow-teal-500/10 opacity-100 ring-1 ring-teal-500/30"
                : "bg-slate-950/40 border-slate-800/60 opacity-40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                مرحله ۱
              </span>
              <CreditCard className="w-4 h-4 text-teal-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">تولید فاکتور با آفست</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سفارش ۱۰۰,۰۰۰ تومانی با مبلغ ۱۰۰,۰۱۱ تومان و شناسه PAY-XXXX صادر می‌شود.
            </p>
          </div>

          {/* Step 2 */}
          <div
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              currentStep === 2
                ? "bg-slate-900 border-teal-500/80 shadow-lg shadow-teal-500/10 opacity-100 ring-1 ring-teal-500/30"
                : "bg-slate-950/40 border-slate-800/60 opacity-40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                مرحله ۲
              </span>
              <Send className="w-4 h-4 text-teal-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">پرداخت مشتری</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              مشتری از طریق موبایل‌بانک مبلغ دقیق ۱۰۰,۰۱۱ تومان را به کارت مقصد واریز می‌کند.
            </p>
          </div>

          {/* Step 3 */}
          <div
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              currentStep === 3
                ? "bg-slate-900 border-teal-500/80 shadow-lg shadow-teal-500/10 opacity-100 ring-1 ring-teal-500/30"
                : "bg-slate-950/40 border-slate-800/60 opacity-40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                مرحله ۳
              </span>
              <Smartphone className="w-4 h-4 text-teal-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">همگام‌سازی و تایید</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              اپلیکیشن همگام‌ساز پیامک واریز را دریافت کرده و به سامانه درگاه تاییدیه می‌دهد.
            </p>
          </div>

          {/* Step 4 */}
          <div
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              currentStep === 4
                ? "bg-slate-900 border-teal-500/80 shadow-lg shadow-teal-500/10 opacity-100 ring-1 ring-teal-500/30"
                : "bg-slate-950/40 border-slate-800/60 opacity-40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                مرحله ۴
              </span>
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">بازگشت به پذیرنده</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تراکنش در سیستم ثبت شده و مشتری با پیام پرداخت موفق به سایت پذیرنده هدایت می‌شود.
            </p>
          </div>
        </div>

        {/* Left Column: Interactive Visual Stage */}
        <div className="lg:col-span-7 bg-[#05070B] border border-slate-800/90 rounded-2xl min-h-[380px] md:min-h-[420px] relative overflow-hidden flex items-center justify-center p-4">
          {/* Ambient stage glow */}
          <div className="absolute w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Scene 1: Seller's Invoice Creation */}
          <div
            className={`absolute inset-0 flex items-center justify-center p-6 transition-all duration-500 ${
              currentScene === 1 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <div className="bg-[#101726] border border-slate-800 rounded-2xl p-6 text-center w-72 relative shadow-2xl space-y-3">
              <span className="text-xs text-slate-400 font-medium block">ایجاد فاکتور جدید فروشگاه</span>

              {/* Amount input mock */}
              <div
                className="bg-black/90 border border-slate-700/80 text-white p-2.5 rounded-xl font-mono text-base font-bold h-11 flex items-center justify-center tracking-wider text-emerald-300 shadow-inner"
                dir="ltr"
              >
                {amountText || <span className="text-slate-600 text-xs font-sans font-normal">مبلغ (تومان)</span>}
              </div>

              {/* Submit button mock */}
              <div
                className={`bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition duration-150 cursor-pointer shadow-md shadow-teal-500/20 ${
                  submitBtnPressed ? "scale-95" : "scale-100"
                }`}
              >
                صدور فاکتور
              </div>

              {/* Success Overlay */}
              <div
                className={`absolute inset-0 bg-emerald-600/95 backdrop-blur-sm rounded-2xl flex flex-col justify-center items-center text-white font-bold transition-opacity duration-300 p-4 ${
                  panelSuccess ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
              >
                <CheckCircle2 className="w-8 h-8 text-white mb-2" />
                <span className="text-sm font-black">فاکتور صادر گردید</span>
                <span className="text-[11px] font-normal text-emerald-100 mt-1">در حال انتقال به درگاه پرداخت...</span>
              </div>
            </div>
          </div>

          {/* Scene 2 & 3: Gateway & Phone Screen */}
          <div
            className={`absolute inset-0 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 p-4 transition-all duration-500 ${
              currentScene === 2 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {/* Gateway Box */}
            <div className="bg-[#101726] border border-slate-800 rounded-2xl p-4 w-60 sm:w-64 relative shadow-2xl space-y-2.5 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px]">
                <span className="text-teal-400 font-black">هنرهاب پی</span>
                <span className="font-mono text-slate-400 text-[10px]">PAY-XXXX</span>
              </div>

              <div className="text-center py-1">
                <span className="text-xl font-black text-white font-mono">۱۰۰,۰۱۱</span>
                <span className="text-[10px] text-slate-400 mr-1">تومان</span>
              </div>

              <div className="bg-black/90 p-2.5 rounded-xl text-center font-mono text-xs text-emerald-300 tracking-widest border border-slate-800" dir="ltr">
                6037-9911-2233-4455
              </div>

              <div className="text-center text-[10px] text-slate-400">
                به نام: <span className="text-slate-200 font-bold">امیر رضایی</span>
              </div>

              {/* Gateway Success Overlay */}
              <div
                className={`absolute inset-0 bg-emerald-600/95 backdrop-blur-sm rounded-2xl flex flex-col justify-center items-center text-white font-bold transition-opacity duration-300 p-4 ${
                  gatewaySuccess ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
              >
                <CheckCircle2 className="w-8 h-8 text-white mb-1" />
                <span className="text-sm font-black">پرداخت تایید شد</span>
              </div>

              {/* Signal Bullet */}
              {signalShooting && (
                <div
                  className="signal-bullet absolute w-2.5 h-2.5 bg-emerald-400 rounded-full top-1/2 left-1/2 shadow-lg shadow-emerald-400"
                />
              )}
            </div>

            {/* Customer Phone Mockup (Step 2) */}
            {activePhone === "customer" && (
              <div
                className={`w-40 h-72 bg-black border-4 border-slate-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all duration-500 ${
                  customerPhoneShown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <div className="bg-blue-900/90 text-white text-[11px] font-bold p-2 text-center flex items-center justify-center gap-1">
                  <span>موبایل‌بانک</span>
                </div>
                <div className="p-3 text-[10px] flex flex-col gap-2.5 flex-1 bg-slate-950 text-slate-300">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">مبلغ انتقال:</span>
                    <span className="font-mono font-bold text-white">۱۰۰,۰۱۱ تومان</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800" dir="ltr">
                    <span className="text-slate-400 block text-[9px] text-right">شماره کارت مقصد:</span>
                    <span className="font-mono text-emerald-400">4455-***-6037</span>
                  </div>

                  <div
                    className={`mt-auto bg-emerald-600 text-white text-center py-1.5 rounded-lg text-[10px] font-bold transition duration-300 ${
                      phonePaymentSuccess ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    ✓ پرداخت موفق
                  </div>

                  <div
                    className={`bg-teal-500 text-slate-950 text-center py-2 rounded-lg font-black text-[11px] cursor-pointer shadow transition duration-150 ${
                      phonePayPressed ? "scale-95 bg-teal-400" : "scale-100"
                    }`}
                  >
                    تایید و واریز
                  </div>
                </div>
              </div>
            )}

            {/* Sync Companion Phone Mockup (Step 3) */}
            {activePhone === "sync" && (
              <div
                className={`w-40 h-72 bg-black border-4 border-emerald-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all duration-500 ${
                  syncPhoneShown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <div className="bg-emerald-900 text-white text-[10px] font-bold p-2 text-center flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3 text-emerald-300" />
                  <span>هنرهاب پی (همگام‌ساز)</span>
                </div>
                <div className="p-3 text-[10px] flex flex-col flex-1 bg-slate-950 text-slate-300 justify-between">
                  <div
                    className={`bg-slate-900 border-r-4 border-emerald-400 p-2.5 rounded-lg text-[10px] space-y-1 transition-all duration-300 shadow ${
                      smsNotificationShown ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                    }`}
                  >
                    <span className="text-emerald-400 font-bold block text-[9px]">📩 پیامک جدید بانک</span>
                    <span className="block text-white font-mono text-[10px]">واریز: ۱۰۰,۰۱۱ تومان</span>
                    <span className="text-[9px] text-slate-400 block">موجودی: ۲,۵۰۰,۰۰۰</span>
                  </div>

                  <div className="text-center py-2 text-[10px] text-slate-400 flex flex-col items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>در حال پردازش و تطبیق پیامک...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scene 4: Return to Merchant Panel */}
          <div
            className={`absolute inset-0 flex items-center justify-center p-6 transition-all duration-500 ${
              currentScene === 3 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <div className="bg-[#101726] border border-emerald-500/50 rounded-2xl p-6 text-center w-76 sm:w-80 shadow-2xl space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                ✓
              </div>
              <h3 className="text-sm font-black text-white">پرداخت با موفقیت انجام شد</h3>
              <div className="bg-black/90 p-3 rounded-xl text-right text-[11px] space-y-1.5 border border-slate-800 leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-slate-400">کد پیگیری:</span>
                  <span className="text-teal-400 font-mono font-bold">PAY-XXXX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">مبلغ پرداختی:</span>
                  <span className="text-teal-400 font-mono font-bold">۱۰۰,۰۱۱ تومان</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">وضعیت:</span>
                  <span className="text-emerald-400 font-bold">موفق و تایید شده</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
