const {onDocumentCreated, onDocumentUpdated} =
  require("firebase-functions/firestore");
const {onCall} = require("firebase-functions/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const OPENAI_KEY = "sk-proj-hM8sXD4g8Kmd2cDJxHqWtygnXRRYJZw9QOIKyuxRRpVuoy3" +
  "nzFxUn8VA-EsKV9SIC9ZyfDDpXBT3BlbkFJ7nzj1DzKLhhRsjywqjiMYrXZIlNUapmsZ" +
  "Gcv9H0Q3wkaXsofHS2mHX2Yauh6tX7CZBogviumgA";

exports.incrementQuestionCount = onDocumentCreated(
    "forum-questions/{questionId}",
    async (event) => {
      const statsRef = db.collection("stats").doc("general");
      await statsRef.set(
          {totalQuestions: admin.firestore.FieldValue.increment(1)},
          {merge: true},
      );
    },
);

exports.incrementSolvedCount = onDocumentUpdated(
    "forum-questions/{questionId}",
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();

      if (before.solved === false && after.solved === true) {
        const statsRef = db.collection("stats").doc("general");
        await statsRef.set(
            {solvedQuestions: admin.firestore.FieldValue.increment(1)},
            {merge: true},
        );
      }

      if (before.solved === true && after.solved === false) {
        const statsRef = db.collection("stats").doc("general");
        await statsRef.set(
            {solvedQuestions: admin.firestore.FieldValue.increment(-1)},
            {merge: true},
        );
      }
    },
);

exports.generateQuestionsWithAI = onCall(async (request) => {
  try {
    const axios = require("axios");

    const systemPrompt = `You are an expert FBLA written-competition exam
designer.

Your role is to generate ORIGINAL, competition-accurate FBLA-style
multiple-choice questions that match the structure, rigor, tone, and
professional standards of official FBLA written tests.

You must follow ALL rules below.

────────────────────────────────
CORE FBLA PHILOSOPHY
────────────────────────────────
FBLA written tests assess professional correctness, precision, and applied
business literacy.

They do NOT assess creativity, opinion, or open-ended reasoning.

Each question must test exactly ONE concept.

Questions must be concise, objective, and professionally worded.

Avoid unnecessary narrative unless the question type explicitly requires a
scenario.

────────────────────────────────
APPROVED FBLA QUESTION ARCHETYPES
────────────────────────────────
Every question MUST clearly belong to ONE of the following archetypes:

1. Definition / Term Identification  
   - Identifying the correct term based on a definition  
   - Selecting the correct meaning of a professional word or concept  

2. Classification / Category Recognition  
   - Determining where an item belongs within a professional category system  
   - Examples include document types, account categories, system types,
     business forms, or classifications  

3. Procedural / Workflow Knowledge  
   - Understanding the stages of a professional workflow specific to the
     competition area  
   - Identifying where information originates within that workflow  
   - Determining which document, tool, or action is appropriate at a given
     stage  
   - Recognizing correct sequencing of professional tasks within the domain  

4. Tool-to-Function Matching  
   - Matching software features, commands, utilities, or tools to their
     correct purpose  
   - Selecting the correct function used to accomplish a professional task  

5. Quantitative / Calculation Application  
   - Performing single-step or limited multi-step calculations  
   - Selecting the correct numeric result based on provided data  
   - Avoid unnecessary complexity or advanced math  

6. Language Precision & Usage  
   - Correct use of professional vocabulary  
   - Distinguishing homophones, word meanings, spelling, grammar, and standard
     usage  

7. Error Detection / Exception Identification  
   - Identifying what is incorrect, misspelled, or does NOT belong  
   - Using negation ("NOT") carefully and intentionally  

────────────────────────────────
QUESTION STRUCTURE RULES
────────────────────────────────
• Each question must assess ONE idea only.  
• Do not combine multiple concepts in one question.  
• Avoid ambiguous wording.  
• Use professional, neutral language.

Acceptable stem styles include:
- "Which of the following…"
- "What term best describes…"
- "The document used to…"
- "Which action should be taken…"
- "Which of the following is NOT…"

────────────────────────────────
ANSWER CHOICE DESIGN (CRITICAL)
────────────────────────────────
Each question MUST include exactly FOUR answer choices.

Answer choices must:
• Be the same grammatical form  
• Be similar in length  
• Belong to the same conceptual family  

Wrong answer choices (distractors) must be plausible and realistic.

Allowed distractor strategies include:
• Closely related terms within the same category  
• Common student misconceptions  
• Incorrect step within a workflow  
• Reversed or misapplied professional rules  
• Visually or linguistically similar words  
• Typical calculation or classification errors  

Never include joke answers or obviously incorrect options.

────────────────────────────────
DIFFICULTY CALIBRATION
────────────────────────────────
Easy:
• Direct recall or recognition  
• Minimal traps  

Medium:
• Requires discrimination between similar concepts  
• Includes common misconceptions  

Hard:
• Includes negation ("NOT")  
• Requires precise rule awareness  
• Uses subtle wording differences  
• Penalizes shallow memorization  

────────────────────────────────
CONTENT INTEGRITY RULES
────────────────────────────────
• All questions must be ORIGINAL.  
• Do NOT copy real FBLA questions.  
• Do NOT closely paraphrase known questions.  
• Use authentic structure only, not replicated wording.

Questions must feel realistic for competitive FBLA written events at the
regional, state, or national level.

When study materials are provided, extract concepts, facts, names, dates,
laws, and details from them. Present this information as established
business knowledge. NEVER mention "the study guide", "the document",
"the material", or use phrases like "according to", "as stated in", or
"mentioned in".

────────────────────────────────
OUTPUT REQUIREMENTS
────────────────────────────────
• Generate ONLY the requested number of questions.  
• Each question must have exactly four answer options.  
• Only ONE option may be correct.  
• Output valid JSON only.  
• Do not include explanations, commentary, or headings.  

You are writing as a professional exam author — not as a tutor or teacher.`;

    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {role: "system", content: systemPrompt},
            ...request.data.messages,
          ],
          temperature: request.data.temperature || 0.8,
          max_tokens: request.data.max_tokens || 2500,
        },
        {
          headers: {
            "Authorization": `Bearer ${OPENAI_KEY}`,
            "Content-Type": "application/json",
          },
        },
    );

    return {
      success: true,
      content: response.data.choices[0].message.content,
    };
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
});

const functions = require("firebase-functions");
const axios = require("axios");

const DEFAULT_WEAK_COMPETENCY =
  "General Business Administration & Procedure";
const TARGET_EXAM_DATE = new Date("2027-05-10T08:00:00");

/**
 * Resolves the user's weakest competency from stats or assignments.
 * @param {string} userId Firebase user id.
 * @return {Promise<string>} Weakest competency label.
 */
async function resolveWeakestCompetency(userId) {
  const statsSnapshot = await db.collection("stats").doc(userId).get();
  if (statsSnapshot.exists) {
    const statsData = statsSnapshot.data();
    if (statsData && statsData.competencies) {
      const sorted = Object.entries(statsData.competencies)
          .sort((a, b) => a[1] - b[1]);
      if (sorted.length > 0) {
        return sorted[0][0];
      }
    }
  }

  const assessmentsSnapshot = await db.collection("assignments")
      .where("to", "==", userId)
      .where("status", "==", "complete")
      .orderBy("completedAt", "desc")
      .limit(15)
      .get();

  const metricsMap = {};
  assessmentsSnapshot.forEach((doc) => {
    const record = doc.data();
    if (!record || !record.competencyStats) return;
    Object.keys(record.competencyStats).forEach((key) => {
      if (!metricsMap[key]) metricsMap[key] = {correct: 0, total: 0};
      const stat = record.competencyStats[key];
      metricsMap[key].correct += stat.correct || 0;
      metricsMap[key].total += stat.total || 0;
    });
  });

  let weakest = null;
  let lowestRatio = 1.1;
  Object.keys(metricsMap).forEach((key) => {
    const node = metricsMap[key];
    if (node.total > 0) {
      const ratio = node.correct / node.total;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        weakest = key;
      }
    }
  });

  return weakest || DEFAULT_WEAK_COMPETENCY;
}

/**
 * Generates one extension question via OpenAI using training context.
 * @param {string} trainingContextText User training roadmap text.
 * @param {string} targetWeakCompetency Target competency to focus on.
 * @return {Promise<Object>} Parsed question JSON payload.
 */
async function generateExtensionQuestion(
    trainingContextText,
    targetWeakCompetency,
) {
  const contextBlock = (trainingContextText || "")
      .substring(0, 12000);

  const systemDirective = [
    "You are an advanced AP/Business exam mentor pipeline engine.",
    "Generate one high-fidelity multiple-choice question for the user's",
    "weakest competency area.",
    `Target competency weakness: "${targetWeakCompetency}"`,
    "Base theme and scenario on this user training roadmap context:",
    "---",
    contextBlock || "No custom training context provided.",
    "---",
    "Respond with strict valid JSON only. No code fences or notes.",
    "JSON format:",
    "{",
    "  \"competency\": \"string\",",
    "  \"text\": \"question stem\",",
    "  \"options\": [\"A\", \"B\", \"C\", \"D\"],",
    "  \"correctAnswer\": \"exact correct option text\",",
    "  \"explanation\": \"why correct and others are wrong\"",
    "}",
  ].join("\n");

  const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [{role: "system", content: systemDirective}],
        response_format: {type: "json_object"},
        temperature: 0.7,
        max_tokens: 1200,
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
      },
  );

  return JSON.parse(response.data.choices[0].message.content);
}

exports.getNextExtensionQuestion = functions.https.onRequest(
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") return res.status(204).send("");

      try {
        const userId = req.query.userId;
        if (!userId) {
          return res.status(400).json({
            error: "Missing required parameter: userId",
          });
        }

        console.log(
            "Analyzing telemetry and prompt tracks for user:",
            userId,
        );

        const trainingSnapshot =
          await db.collection("userTraining").doc(userId).get();
        let trainingContextText = "";
        if (trainingSnapshot.exists) {
          const trainingData = trainingSnapshot.data() || {};
          const trainingContext = trainingData.gptTrainingContext || {};
          trainingContextText = trainingContext.content || "";
          console.log("Extracted custom roadmap content payload.");
        } else {
          console.warn("No training context document for user:", userId);
        }

        const targetWeakCompetency = await resolveWeakestCompetency(userId);
        console.log("Target weak competency:", targetWeakCompetency);

        let streakCount = 0;
        let daysToExam = Math.max(
            0,
            Math.ceil((TARGET_EXAM_DATE - new Date()) / (1000 * 60 * 60 * 24)),
        );

        const userSnapshot = await db.collection("users").doc(userId).get();
        let userSettings = {
          showStreak: true,
          showCountdown: true,
          showQuestion: true,
        };
        if (userSnapshot.exists) {
          const userData = userSnapshot.data() || {};
          streakCount = userData.streak || 0;
          userSettings = userData.extensionSettings || userSettings;
          if (userData.examDate) {
            const diffTime = Math.abs(
                new Date(userData.examDate) - new Date(),
            );
            daysToExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        const generatedPayload = await generateExtensionQuestion(
            trainingContextText,
            targetWeakCompetency,
        );

        return res.status(200).json({
          streak: streakCount,
          daysToExam: daysToExam,
          settings: userSettings,
          question: {
            competency:
              generatedPayload.competency || targetWeakCompetency,
            text: generatedPayload.text,
            options: generatedPayload.options,
            correctAnswer: generatedPayload.correctAnswer,
            explanation: generatedPayload.explanation,
          },
        });
      } catch (error) {
        console.error("Critical routing function execution error:", error);
        return res.status(500).json({
          error: "Internal processing logic thread broken.",
        });
      }
    },
);
