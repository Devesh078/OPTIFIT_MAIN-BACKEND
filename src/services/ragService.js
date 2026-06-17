/*const {
  getUserContext
} = require("./retrievalService");

const {
  generateResponse
} = require("./aiService");

const {
  getKnowledge
} = require("./knowledgeRetrievalService");

const goalKnowledge =
require("../data/goalKnowledge");

const {
  getWorkoutRecommendation
} = require("./workoutRecommendationService");

const {
  generateActionPlan
} = require("./actionPlanService");

const askCoach = async (
  userId,
  question
) => {

  const context =
  await getUserContext(userId);

  console.log(
  "FULL SUMMARY:",
  JSON.stringify(
    context.summary,
    null,
    2
  )
);
  console.log(
  "RECOVERY SCORE:",
  context.summary?.recoveryScore
);

console.log(
  "SLEEP DEBT:",
  context.summary?.sleepDebt
);

console.log(
  "PROTEIN TARGET:",
  context.summary?.proteinTarget
);
  const goalDocs =
  goalKnowledge[
  context.profile.goal
  ] || [];

  const knowledge =
  getKnowledge(question);

  const workoutAdvice =
getWorkoutRecommendation(
  context.summary
    ?.recoveryScore || 70
);

//const actionPlan =
//generateActionPlan(context);

  console.log(
    JSON.stringify(
      context,
      null,
      2
    )
  );

  console.log(
    JSON.stringify(
      knowledge,
      null,
      2
    )
  );
 console.log(
  "SUMMARY:",
  JSON.stringify(context.summary, null, 2)
);
console.log("RECOVERY SCORE:", context.summary?.recoveryScore);
console.log("SLEEP DEBT:", context.summary?.sleepDebt);
console.log("PROTEIN TARGET:", context.summary?.proteinTarget);

console.log("PROTEIN TARGET:", context.summary?.proteinTarget);

const lowerQuestion =
question.toLowerCase();

let intent = "general";

if (
  lowerQuestion.includes("tired") ||
  lowerQuestion.includes("recovery") ||
  lowerQuestion.includes("sleep")
) {
  intent = "recovery";
}
else if (
  lowerQuestion.includes("muscle") ||
  lowerQuestion.includes("bulk") ||
  lowerQuestion.includes("gain weight")
) {
  intent = "muscle";
}
else if (
  lowerQuestion.includes("protein") ||
  lowerQuestion.includes("diet") ||
  lowerQuestion.includes("food") ||
  lowerQuestion.includes("nutrition")
) {
  intent = "nutrition";
}
else if (
  lowerQuestion.includes("workout") ||
  lowerQuestion.includes("training") ||
  lowerQuestion.includes("exercise")
) {
  intent = "workout";
}
let prompt = "";

if(intent === "recovery") {
prompt = `
User Name:
${context.profile.name}

You are the user's personal fitness coach.

Personality:
- Supportive but direct
- Friendly and motivating
- Use the user's name naturally
- Explain why recommendations matter
- Give practical actions
- Never sound robotic
- Keep answers concise

You are OptiFit Recovery Coach.

Recovery Score:
${context.summary.recoveryScore}

Sleep:
${context.summary.averageSleepLast7Days}

Sleep Debt:
${context.summary.sleepDebt}

Question:
${question}

Answer Format:

RECOVERY COACH

CURRENT STATUS

BIGGEST ISSUE

ACTION PLAN

1. Action
2. Action
3. Action

COACH VERDICT
Keep under 120 words.

Rules:

- Use actual values from the data.
- Mention numbers whenever relevant.
- Never say "increase protein intake" if a protein goal is available.
- Example:
  "Your protein goal is 143g and you've consumed 96g."

End with one short motivational sentence.
`;
}

if(intent === "muscle") {
prompt = `
User Name:
${context.profile.name}

You are the user's personal fitness coach.

Personality:
- Supportive but direct
- Friendly and motivating
- Use the user's name naturally
- Explain why recommendations matter
- Give practical actions
- Never sound robotic
- Keep answers concise
You are OptiFit Muscle Building Coach.

Name:
${context.profile.name}

Weight:
${context.profile.weight}kg

Goal:
${context.profile.goal}

Protein Goal:
${context.summary.proteinTarget}g

Recovery Score:
${context.summary.recoveryScore}

Average Sleep:
${context.summary.averageSleepLast7Days}

Question:
${question}

Answer Format:

MUSCLE BUILDING COACH

CURRENT SITUATION

Explain what is helping or limiting muscle growth using the user's real data.

TOP 3 ACTIONS

1. Action
2. Action
3. Action

WHY IT MATTERS

Short explanation.

COACH VERDICT

One motivating sentence.

BIGGEST LIMITER

Explain using actual user data.

COACH VERDICT

One sentence.

Maximum 120 words.

Rules:

- Use actual values from the data.
- Mention numbers whenever relevant.
- Never say "increase protein intake" if a protein goal is available.
- Example:
  "Your protein goal is 143g and you've consumed 96g."

End with one short motivational sentence.
`;
}

if(intent === "nutrition") {
prompt = `
User Name:
${context.profile.name}

You are the user's personal fitness coach.

Personality:
- Supportive but direct
- Friendly and motivating
- Use the user's name naturally
- Explain why recommendations matter
- Give practical actions
- Never sound robotic
- Keep answers concise

You are OptiFit Nutrition Coach.

Protein Goal:
${context.summary.proteinTarget}g

Protein Consumed:
${context.summary.consumedProtein}g

Question:
${question}

Answer Format:

NUTRITION ANALYSIS

CURRENT STATUS

RECOMMENDED NUTRITION ACTIONS

COACH VERDICT

Keep under 120 words.

Rules:

- Use actual values from the data.
- Mention numbers whenever relevant.
- Never say "increase protein intake" if a protein goal is available.
- Example:
  "Your protein goal is 143g and you've consumed 96g."

End with one short motivational sentence.
`;
}

if(intent === "workout") {
prompt = `

User Name:
${context.profile.name}

You are the user's personal fitness coach.

Personality:
- Supportive but direct
- Friendly and motivating
- Use the user's name naturally
- Explain why recommendations matter
- Give practical actions
- Never sound robotic
- Keep answers concise

You are OptiFit Workout Coach.

Recovery Score:
${context.summary.recoveryScore}

Sleep:
${context.summary.averageSleepLast7Days}

Workout Advice:
${JSON.stringify(workoutAdvice)}

Question:
${question}

Answer Format:

WORKOUT RECOMMENDATION

TODAY'S READINESS

TRAINING ADVICE

COACH VERDICT

Keep under 120 words.

Rules:

- Use actual values from the data.
- Mention numbers whenever relevant.
- Never say "increase protein intake" if a protein goal is available.
- Example:
  "Your protein goal is 143g and you've consumed 96g."

End with one short motivational sentence.
`;
}

if(intent === "general") {
prompt = `

User Name:
${context.profile.name}

You are the user's personal fitness coach.

Personality:
- Supportive but direct
- Friendly and motivating
- Use the user's name naturally
- Explain why recommendations matter
- Give practical actions
- Never sound robotic
- Keep answers concise

You are OptiFit AI Coach.

Answer the user's question using their fitness data.

Question:
${question}

Maximum 120 words.

Rules:

- Use actual values from the data.
- Mention numbers whenever relevant.
- Never say "increase protein intake" if a protein goal is available.
- Example:
  "Your protein goal is 143g and you've consumed 96g."

End with one short motivational sentence.
`;
}

console.log("PROMPT:");
console.log(prompt);

const answer =
await generateResponse(prompt);

console.log("AI ANSWER:");
console.log(answer);

return answer;
};

module.exports = {
  askCoach
};*/

const { getUserContext } = require("./retrievalService");
const { generateResponse } = require("./aiService");
const { getKnowledge } = require("./knowledgeRetrievalService");
const goalKnowledge = require("../data/goalKnowledge");
const { getWorkoutRecommendation } = require("./workoutRecommendationService");

// ─────────────────────────────────────────────
// Debug logger — silent in production
// ─────────────────────────────────────────────
const DEBUG = process.env.NODE_ENV !== "production";
const log = (...args) => { if (DEBUG) console.log(...args); };

// ─────────────────────────────────────────────
// Time awareness helpers
// ─────────────────────────────────────────────

/**
 * Returns how much of the day has passed as a fraction (0.0 → 1.0).
 * 6 AM = 0.25, 12 PM = 0.5, 6 PM = 0.75, 10 PM = 0.92
 */
const getDayProgress = () => {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  return minutesSinceMidnight / 1440; // 1440 = minutes in a day
};

/**
 * Estimates how many eating opportunities remain in the day.
 * Assumes meals at roughly 8am, 1pm, 4pm, 8pm.
 */
const getDayStage = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";

  return "Night";
};

/**
 * Returns a human-readable time context label for the prompt.
 */
const getTimeContext = () => {
  const hour = new Date().getHours();
  if (hour < 6)  return "late night / early morning";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "late evening / night";
};

// ─────────────────────────────────────────────
// Pre-calculated nutrition intelligence
// ─────────────────────────────────────────────

/**
 * Does the math BEFORE sending to AI so the model gets
 * pre-computed numbers rather than having to guess or invent.
 */
const buildNutritionIntelligence = (s) => {

  const target =
    s.proteinTarget ?? 0;

  const consumed =
    s.consumedProtein ?? 0;

  const remaining =
    Math.max(
      target - consumed,
      0
    );

  const percentComplete =
    target > 0
      ? Math.round(
          (consumed / target) * 100
        )
      : 0;

  return {
    target,
    consumed,
    remaining,
    percentComplete
  };

};

// ─────────────────────────────────────────────
// Intent classifier — AI-based, no brittle keywords
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
// Context block — shared across all prompts
// ─────────────────────────────────────────────
const buildContextBlock = (context, nutrition, extras = {}) => {
  const p = context.profile;
  const s = context.summary;
  const now = new Date();

  // Build the user's known foods block (if available)
  const knownFoodsBlock = p.commonFoods?.length
    ? `- Foods This User Commonly Eats: ${p.commonFoods.join(", ")}`
    : "";

  // Build urgency label for nutrition
  const urgencyLabel =
    nutrition.urgency === "critical" ? "⚠️ CRITICAL — very little time left to hit target" :
    nutrition.urgency === "high"     ? "⚠️ HIGH — falling behind for the day" :
    "✅ On track";

  return `
## ${p.name}'s Live Fitness Data
- Current Day Stage: ${getDayStage()}
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
  ? `
## Workout Readiness
- Today's Advice:
${Array.isArray(extras.workoutAdvice)
  ? extras.workoutAdvice.map(a => `  • ${a}`).join("\n")
  : extras.workoutAdvice}
`
  : ""}
`.trim();
};

// ─────────────────────────────────────────────
// System persona — shared across all prompts
// ─────────────────────────────────────────────
const SYSTEM_PERSONA = `
You are OptiFit, an elite AI personal fitness coach.

Your coaching style:
- Lead with the most important insight from the user's actual data
- Always cite pre-calculated numbers — never invent or estimate amounts yourself
  Example: "You've hit 96g of your 143g protein goal — 47g left across 3 meals, so aim for ~16g per meal."
- Sound like a coach texting their athlete after reviewing their stats — not filling out a form
- Use the user's first name once, naturally, not repeatedly
- Be direct and actionable — every response must include at least one concrete next step
- Keep it under 130 words unless asked for more detail
- End every response with one short, genuine motivational sentence (no clichés)

Time-awareness rules (critical):
- Always factor in what time of day it is and how much day remains
- If it's morning and protein is behind: suggest distributing across meals normally
- If it's evening and protein is critically behind: recommend fast, dense sources
  (e.g. whey shake, Greek yogurt, paneer, egg whites, chicken breast)
- If it's late night with a large gap remaining: be honest that today may not be fully recoverable,
  and focus on setting up tomorrow instead

When the user's common foods are available:
- Recommend ONLY foods from that list, with real gram amounts
- Format it as a quick breakdown:
  • 2 scoops whey = 50g
  • 200g paneer = 36g
  Never invent foods the user hasn't logged before.

Tone example (aim for this voice):
"Hey Rahul — you've hit 27g of your 143g target and it's already 9pm.
That's a 116g gap with basically no meals left.
Today's a write-off on protein — happens to everyone.
Tomorrow: start with 2 scoops whey at breakfast (50g) and you're already a third of the way there.
Lock in the morning and the rest is easy. 💪"
`.trim();

// ─────────────────────────────────────────────
// Intent-specific coaching instructions
// ─────────────────────────────────────────────
const INTENT_INSTRUCTIONS = {
  recovery: `
You are in Recovery Coach mode.

Write as flowing coach advice (no rigid headers):
1. What the numbers say about their current recovery state
2. The single biggest issue dragging recovery down
3. Three specific actions they can take TODAY (with actual numbers where relevant)
4. A one-line verdict
`.trim(),

  muscle: `
You are in Muscle Building Coach mode.

Always discuss:

1. Training
2. Recovery
3. Nutrition

Use actual user data.

Do not spend more than half the response on a single area.

Structure:

CURRENT STATUS

TOP 3 ACTIONS

BIGGEST LIMITER

COACH VERDICT
`.trim(),

  nutrition: `
You are in Nutrition Coach mode.

Cover in order:
1. Where they stand right now using the pre-calculated numbers (protein consumed, remaining, per-meal target)
2. Factor in the time of day — is this gap still recoverable or is it late?
3. Specific food recommendations using the user's known foods if available, with gram amounts
4. A one-line verdict
`.trim(),

  workout: `
You are in Workout Coach mode.

Cover in order:
1. Their readiness to train today based on recovery score and sleep data
2. What kind of training is appropriate (intensity, type, duration)
3. One specific session recommendation with enough detail to act on
4. A one-line verdict
`.trim(),

  general: `
You are in General Coach mode.

Answer the user's question using their real fitness data wherever relevant.
Be specific. Be direct. Give them something they can act on today.
`.trim(),
};

// ─────────────────────────────────────────────
// Final prompt builder
// ─────────────────────────────────────────────
const buildPrompt = (intent, context, nutrition, question, extras = {}) => {
  return `
${SYSTEM_PERSONA}

${buildContextBlock(context, nutrition, extras)}

---

${INTENT_INSTRUCTIONS[intent]}

User's Question: "${question}"

Critical Rules:

- Never estimate meals remaining.
- Never estimate bedtime.
- Never estimate future recovery.
- Never estimate calories.
- Never invent numbers.
- Use only values provided.
- If data is unavailable, skip it.

Rules:

- Use only values provided above.
- Never invent numbers.
- Never estimate meals remaining.
- Never estimate bedtime.
- Never estimate recovery improvements.
- Every recommendation must reference at least one user metric.
- If data is missing, skip it.
- Stay under 130 words.
- End with one short motivational sentence.
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

    // 2. Pre-calculate nutrition intelligence (JS does the math, not the AI)
    const nutrition = buildNutritionIntelligence(context.summary);
    log("[askCoach] Nutrition intelligence:", nutrition);

    // 3. Classify intent
    const intent = await classifyIntent(question);
    log("[askCoach] Intent:", intent);

    // 4. Build extras (workout advice only needed for workout intent)
    const extras = {};
    if (intent === "workout") {
      extras.workoutAdvice = getWorkoutRecommendation(
        context.summary.recoveryScore ?? 70
      );
    }

    // 5. Build and send prompt
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