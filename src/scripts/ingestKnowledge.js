require("dotenv").config();
const pineconeIndex = require("../services/pineconeService");
const { prepareVectors } = require("../services/ingestKnowledgeService");

const knowledgeDocs = [
  {
    id: "protein_basics",
    category: "nutrition",
    text: `Protein is essential for muscle repair and growth. The recommended daily intake for someone focused on muscle building is 1.6–2.2g per kg of body weight. High-protein foods include chicken breast (31g per 100g), eggs (13g per 100g), paneer (18g per 100g), Greek yogurt (10g per 100g), whey protein (25g per scoop). Spreading protein intake across 3–5 meals maximizes muscle protein synthesis. Having protein within 2 hours post-workout accelerates recovery.`,
  },
  {
    id: "sleep_recovery",
    category: "recovery",
    text: `Sleep is the most powerful recovery tool available. During deep sleep, the body releases growth hormone which repairs muscle tissue. Adults need 7–9 hours per night for optimal recovery. Sleep debt accumulates when you consistently sleep less than needed. Signs of poor recovery include elevated resting heart rate, reduced motivation, soreness that lasts more than 48 hours, and declining performance. Prioritize sleep over extra training sessions when recovery score is low.`,
  },
  {
    id: "muscle_building",
    category: "muscle",
    text: `Muscle hypertrophy requires three things: progressive overload, adequate protein, and sufficient recovery. Progressive overload means consistently increasing weight, reps, or volume over time. Compound movements like squats, deadlifts, bench press, and rows build the most muscle mass. Training each muscle group 2x per week is optimal for intermediate lifters. Rest periods of 60–90 seconds for hypertrophy, 2–3 minutes for strength. Avoid training the same muscle group two days in a row.`,
  },
  {
    id: "workout_intensity",
    category: "workout",
    text: `Training intensity should match recovery status. On days with high recovery scores (80+), push hard with heavy compound lifts. On moderate recovery days (60–79), focus on moderate intensity hypertrophy work. On low recovery days (below 60), stick to light movement, mobility work, or active rest. Overtraining occurs when training stress consistently exceeds recovery capacity. Signs include persistent fatigue, mood changes, and strength plateaus.`,
  },
  {
    id: "nutrition_timing",
    category: "nutrition",
    text: `Meal timing affects energy levels and recovery. Pre-workout: eat carbs and protein 1–2 hours before training. Post-workout: consume protein within 2 hours to maximize muscle protein synthesis. In the morning, a high-protein breakfast sets up the day for hitting protein targets. At night, casein protein (found in paneer, cottage cheese) digests slowly and supports overnight muscle repair. Avoid heavy meals within 2 hours of sleep as they can disrupt sleep quality.`,
  },
  {
    id: "indian_protein_foods",
    category: "nutrition",
    text: `High protein Indian foods include: Paneer (18g per 100g), Chicken breast (31g per 100g), Eggs (13g per 100g), Dal/Lentils (9g per 100g cooked), Rajma/Kidney beans (9g per 100g cooked), Chole/Chickpeas (9g per 100g cooked), Greek yogurt/Hung curd (10g per 100g), Tofu (8g per 100g), Sattu (20g per 100g), Moong dal chilla is a quick high protein breakfast. Whey protein supplement provides 24–25g per scoop and is the fastest absorbing protein source.`,
  },
];

const ingest = async () => {
  console.log("Starting knowledge ingestion...\n");
  let totalVectors = 0;

  for (const doc of knowledgeDocs) {
    try {
      const vectors = await prepareVectors(doc);
      console.log(`Vectors count: ${vectors.length}`);        // ADD THIS
      console.log(`First vector ID: ${vectors[0]?.id}`);      // ADD THIS
      console.log(`Values length: ${vectors[0]?.values?.length}`); // ADD THIS
      
      if (vectors.length > 0) {
        await pineconeIndex.upsert({ records: vectors });
        totalVectors += vectors.length;
        console.log(`Uploaded "${doc.id}" → ${vectors.length} vectors`);
      }
    } catch (err) {
      console.error(`Failed to process "${doc.id}":`, err.message);
      console.error(err); // ADD THIS - full error
    }
  }

  console.log(`\nIngestion complete! Total vectors uploaded: ${totalVectors}`);
};
ingest().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});