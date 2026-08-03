const { getUserContext } = require("./retrievalService");
const { generateResponse } = require("./aiService");
const { getWorkoutRecommendation } = require("./workoutRecommendationService");
const { vectorSearch } = require("./vectorSearchService");

// ─────────────────────────────────────────────
// Debug logger — silent in production
// ─────────────────────────────────────────────
const DEBUG = process.env.NODE_ENV !== "production";
const log = (...args) => { if (DEBUG) console.log(...args); };

// ─────────────────────────────────────────────
// Timezone-aware time helpers (IST = UTC+5:30)
// Uses pure UTC math — works on all cloud servers
// ─────────────────────────────────────────────

const getISTMinutesSinceMidnight = () => {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMinutes + 330) % 1440;
};

const getISTHour = () => Math.floor(getISTMinutesSinceMidnight() / 60);

const getISTTimeString = () => {
  const totalMinutes = getISTMinutesSinceMidnight();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMin = minutes.toString().padStart(2, "0");
  return `${displayHour}:${displayMin} ${ampm}`;
};

const getDayStage = () => {
  const hour = getISTHour();
  if (hour >= 0 && hour < 5)  return "Late Night";
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
};

const getTimeContext = () => getDayStage();

// ─────────────────────────────────────────────
// Pre-calculated nutrition intelligence
// ─────────────────────────────────────────────
const buildNutritionIntelligence = (s) => {
  const target = s.proteinTarget ?? 0;
  const consumed = s.consumedProtein ?? 0;
  const remaining = Math.max(target - consumed, 0);
  const percentComplete = target > 0 ? Math.round((consumed / target) * 100) : 0;
  return { target, consumed, remaining, percentComplete };
};

// ─────────────────────────────────────────────
// Intent classifier
// ─────────────────────────────────────────────
const classifyIntent = async (question) => {
  const VALID_INTENTS = ["recovery", "muscle", "nutrition", "workout", "general"];

  const classifierPrompt = `
You are a fitness query classifier.

Classify the following question into exactly ONE category:
- recovery  → fatigue, sleep, rest, energy levels
- muscle    → muscle gain, bulking, hypertrophy, strength
- nutrition → diet, protein, food, macros, calories, eating
- workout   → exercise, training, gym, cardio, sets, reps
- general   → anything else fitness-related

Question: "${question}"

Reply with ONLY the single category word. No explanation. No punctuation.
`;

  try {
    const raw = await generateResponse(classifierPrompt);
    const intent = raw.trim().toLowerCase();
    return VALID_INTENTS.includes(intent) ? intent : "general";
  } catch {
    return "general";
  }
};

// ─────────────────────────────────────────────
// Context block
// ─────────────────────────────────────────────
const buildContextBlock = (context, nutrition, extras = {}) => {
  const p = context.profile;
  const s = context.summary;

  const knownFoodsBlock = p.commonFoods?.length
    ? `- Foods This User Commonly Eats: ${p.commonFoods.join(", ")}`
    : "";

  const knowledgeBlock = extras.knowledgeChunks?.length
    ? `\n## Retrieved Fitness Knowledge\n${extras.knowledgeChunks.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
    : "";

  return `
## ${p.name}'s Live Fitness Data
- Current Time Context: ${getTimeContext()}
- Current Local Time (IST): ${getISTTimeString()}
- Goal: ${p.goal}
- Weight: ${p.weight} kg
- Recovery Score: ${s.recoveryScore ?? "N/A"} / 100
- Avg Sleep (last 7 days): ${s.averageSleepLast7Days ?? "N/A"} hours
- Sleep Debt: ${s.sleepDebt ?? "N/A"} hours

## Nutrition
- Protein Target: ${nutrition.target}g
- Protein Consumed: ${nutrition.consumed}g
- Protein Remaining: ${nutrition.remaining}g
- Protein Progress: ${nutrition.percentComplete}%
${knownFoodsBlock}

${extras.workoutAdvice
  ? `## Workout Readiness\n- Today's Advice:\n${
      Array.isArray(extras.workoutAdvice)
        ? extras.workoutAdvice.map(a => `  • ${a}`).join("\n")
        : extras.workoutAdvice
    }`
  : ""}
${knowledgeBlock}
`.trim();
};

// ─────────────────────────────────────────────
// System persona
// ─────────────────────────────────────────────
const SYSTEM_PERSONA = `
You are OptiFit, an elite AI personal fitness coach.

Your coaching style:
- Lead with the most important insight from the user's actual data
- Always cite pre-calculated numbers — never invent or estimate amounts yourself
- Sound like a coach texting their athlete after reviewing their stats
- Use the user's first name once, naturally, not repeatedly
- Be direct and actionable — every response must include at least one concrete next step
- Keep it under 130 words unless asked for more detail
- End every response with one short, genuine motivational sentence (no clichés)
- Use the Retrieved Fitness Knowledge section to enrich your answer with accurate facts

Time-awareness rules (critical):
- Always factor in what time of day it is and how much day remains
- If it's morning and protein is behind: suggest distributing across meals normally
- If it's evening and protein is critically behind: recommend fast, dense sources
- If it's late night with a large gap remaining: be honest that today may not be fully recoverable
- 12:00 AM–4:59 AM = Late Night. Never refer to this as morning.
- Do not suggest breakfast, lunch, or "start your day" during Late Night

When the user's common foods are available:
- Recommend ONLY foods from that list, with real gram amounts

Food Recommendation Rules:
- Answer the food request first
- Think like a human coach, not a nutrition calculator
- For late-night snack requests: suggest realistic snacks people actually eat
- Do not immediately recommend whey protein or meal-prep foods unless asked

Question Priority Rules:
- First answer the user's question directly
- Then use fitness data and retrieved knowledge to personalize the answer
- Do not turn every nutrition question into a protein-target discussion
`.trim();

// ─────────────────────────────────────────────
// Intent-specific instructions
// ─────────────────────────────────────────────
const INTENT_INSTRUCTIONS = {
  recovery: `
You are in Recovery Coach mode.
1. What the numbers say about their current recovery state
2. The single biggest issue dragging recovery down
3. Three specific actions they can take TODAY (with actual numbers)
4. A one-line verdict
`.trim(),

  muscle: `
You are in Muscle Building Coach mode.
Discuss: Training, Recovery, Nutrition. Use actual user data.
Structure: CURRENT STATUS → TOP 3 ACTIONS → BIGGEST LIMITER → COACH VERDICT
`.trim(),

  nutrition: `
You are in Nutrition Coach mode.
1. Where they stand using pre-calculated numbers
2. Factor in time of day — is the gap recoverable?
3. Specific food recommendations with gram amounts
4. Answer the food question first if one was asked
5. A one-line verdict
`.trim(),

  workout: `
You are in Workout Coach mode.
1. Their readiness based on recovery score and sleep
2. What kind of training is appropriate today
3. One specific session recommendation
4. A one-line verdict
`.trim(),

  general: `
You are in General Coach mode.
Answer using real fitness data and retrieved knowledge wherever relevant.
Be specific. Be direct. Give something they can act on today.
`.trim(),
};

// ─────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────
const buildPrompt = (intent, context, nutrition, question, extras = {}) => {
  return `
${SYSTEM_PERSONA}

${buildContextBlock(context, nutrition, extras)}

---

${INTENT_INSTRUCTIONS[intent]}

User's Question: "${question}"

Rules:
- Use only values provided above
- Never invent numbers
- Never estimate meals remaining, bedtime, or future recovery
- Every recommendation must reference at least one user metric
- If data is missing, skip it
- Stay under 130 words
- End with one short motivational sentence
`.trim();
};

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
const askCoach = async (userId, question) => {
  try {
    // 1. Load user data
    const context = await getUserContext(userId);
    if (!context?.profile || !context?.summary) {
      return "I couldn't load your fitness data right now. Please try again in a moment.";
    }

    // 2. Pre-calculate nutrition
    const nutrition = buildNutritionIntelligence(context.summary);
    log("[askCoach] Nutrition:", nutrition);

    // 3. Classify intent
    const intent = await classifyIntent(question);
    log("[askCoach] Intent:", intent);

    // 4. RAG — retrieve relevant knowledge chunks
    const knowledgeChunks = await vectorSearch(question, 3);
    log("[askCoach] Knowledge chunks:", knowledgeChunks.length);

    // 5. Build extras
    const extras = { knowledgeChunks };
    if (intent === "workout") {
      extras.workoutAdvice = getWorkoutRecommendation(
        context.summary.recoveryScore ?? 70
      );
    }

    // 6. Build and send prompt
    const prompt = buildPrompt(intent, context, nutrition, question, extras);
    log("[askCoach] Prompt:\n", prompt);

    const answer = await generateResponse(prompt);
    log("[askCoach] Answer:\n", answer);

    return answer;

  } catch (err) {
    console.error("[askCoach] Error:", err);
    return "Something went wrong on my end. Give it another shot in a moment.";
  }
};

module.exports = { askCoach };