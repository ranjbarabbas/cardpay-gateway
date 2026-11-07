import { db } from "../src/lib/db";

async function main() {
  console.log("Seeding initial data...");

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
    update: {},
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

  // 3. Create Trusted Sender
  await db.trustedSender.upsert({
    where: { senderId: "B.QMEHRIRAN" },
    update: {},
    create: {
      senderId: "B.QMEHRIRAN",
      bankSlug: "mehr_iran",
      description: "سرخط پیامک بانک قرض‌الحسنه مهر ایران",
      isTrusted: true,
    },
  });

  console.log("✅ Database successfully seeded!");
  console.log(`- Card ID: ${card.id} (Owner: ${card.ownerName})`);
  console.log(`- Account Number: ${card.accountNumber}`);
  console.log(`- Device Token: ${device.apiKey}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
