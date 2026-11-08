import { db } from "../src/lib/db";

async function main() {
  console.log("Updating seed data...");

  // 1. Create Default Device
  const device = await db.device.upsert({
    where: { apiKey: "dev_admin_test_secret_key_12345" },
    update: {},
    create: {
      name: "گوشی ادمین (Admin Phone)",
      apiKey: "dev_admin_test_secret_key_12345",
      phoneModel: "Android Test Phone",
      isActive: true,
      lastSeenAt: new Date(),
    },
  });

  // 2. Create Default Bank Card (Bank Mehr Iran)
  const card = await db.bankCard.upsert({
    where: { cardNumber: "6037991823456789" },
    update: {
      accountNumber: "662179818703777001",
    },
    create: {
      ownerName: "عباس رنجبر",
      cardNumber: "6037991823456789",
      accountNumber: "662179818703777001",
      bankSlug: "mehr_iran",
      bankTitle: "بانک قرض‌الحسنه مهر ایران",
      deviceId: device.id,
      isActive: true,
    },
  });

  // 3. Create Trusted Sender (APPROVED)
  await db.trustedSender.upsert({
    where: { senderId: "B.QMEHRIRAN" },
    update: {
      status: "APPROVED",
      description: "سرخط رسمی بانک قرض‌الحسنه مهر ایران",
    },
    create: {
      senderId: "B.QMEHRIRAN",
      bankSlug: "mehr_iran",
      description: "سرخط رسمی بانک قرض‌الحسنه مهر ایران",
      status: "APPROVED",
    },
  });

  console.log("✅ Seed completed successfully!");
}

main().catch(console.error).finally(() => db.$disconnect());
