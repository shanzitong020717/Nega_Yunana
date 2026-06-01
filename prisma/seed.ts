import { getDb } from "../src/lib/db";
import { seedPhrases } from "../src/data/seed-phrases";

async function main() {
  const db = getDb();

  const user =
    (await db.userProfile.findFirst({
      where: {
        name: "Yuna",
        role: "Overseas Sales & Solution",
      },
    })) ??
    (await db.userProfile.create({
      data: {
        name: "Yuna",
        role: "Overseas Sales & Solution",
        englishLevel: "B2",
        trainingPreferences: {
          correctionStyle: "after_session",
          subtitleMode: "english_only",
          defaultDifficulty: "normal",
        },
      },
    }));

  for (const phrase of seedPhrases) {
    await db.phrase.upsert({
      where: {
        userId_english: {
          userId: user.id,
          english: phrase.english,
        },
      },
      update: {
        category: phrase.category,
        chinese: phrase.chinese,
        useCase: phrase.useCase,
        tags: phrase.tags,
        source: "BUILT_IN",
      },
      create: {
        userId: user.id,
        category: phrase.category,
        english: phrase.english,
        chinese: phrase.chinese,
        useCase: phrase.useCase,
        simpleVersion: phrase.simpleVersion,
        professionalVersion: phrase.professionalVersion,
        tags: phrase.tags,
        source: "BUILT_IN",
      },
    });
  }

  await db.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await getDb().$disconnect();
  process.exit(1);
});
