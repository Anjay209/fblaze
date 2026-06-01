const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/firestore");
const {onCall} = require("firebase-functions/https");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

const {OpenAI} = require("openai");

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

    const systemPrompt = `You are an expert FBLA written-competition ` +
      `exam designer. Your role is to generate ORIGINAL, competition-` +
      `accurate FBLA-style multiple-choice questions that match the ` +
      `structure, rigor, tone, and professional standards of official ` +
      `FBLA written tests. Follow all guidelines carefully.`;

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

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
            "Authorization": `Bearer ${apiKey}`,
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

exports.getNextExtensionQuestion = functions.https.onRequest(
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      try {
        const userId = req.query.userId;
        if (!userId) {
          res.status(400).json({error: "Missing userId query parameter"});
          return;
        }

        const trainingDoc = await db.collection("userTraining")
            .doc(userId).get();
        let systemTrainingPrompt = "";

        if (trainingDoc.exists) {
          const docData = trainingDoc.data();
          systemTrainingPrompt = docData?.gptTrainingContext?.content || "";
        }

        let currentCompetency = "AP Business Administration";

        if (!systemTrainingPrompt.trim()) {
          const userDoc = await db.collection("users").doc(userId).get();
          let matchedCompetition = "";

          if (userDoc.exists) {
            const userData = userDoc.data();

            if (Array.isArray(userData?.competitions) &&
              userData.competitions.length > 0) {
              matchedCompetition = userData.competitions[0];
            } else if (userData?.competitions &&
                     typeof userData.competitions === "object") {
              const keys = Object.keys(userData.competitions);
              if (keys.length > 0) {
                matchedCompetition = userData.competitions[keys[0]];
              }
            }
          }

          if (matchedCompetition) {
            currentCompetency = matchedCompetition;
            const competitionDoc = await db.collection("competitions")
                .doc(matchedCompetition).get();

            if (competitionDoc.exists) {
              const compData = competitionDoc.data();
              systemTrainingPrompt = compData?.baseline?.text ||
                                   compData?.text || "";
            }
          }
        } else {
          const progressDoc = await db.collection("userProgress")
              .doc(userId).get();
          if (progressDoc.exists) {
            currentCompetency = progressDoc.data()?.weakestTopic ||
                              "Product Sprint Highlight";
          } else {
            currentCompetency = "Product Sprint Highlight";
          }
        }

        if (!systemTrainingPrompt.trim()) {
          systemTrainingPrompt = "Focus on core business practices.";
          currentCompetency = "Business Administration";
        }

        const systemMessage = `Generate a multiple choice question on ` +
                            `"${currentCompetency}". Use this baseline ` +
                            `text to formulate variables: \n\n` +
                            systemTrainingPrompt;

        const userMessage = `Return a raw JSON object with no markdown wrappers:
      {
        "competency": "${currentCompetency.toUpperCase()}",
        "text": "The test question?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "Exact matching choice option string",
        "explanation": "Detailed breakdown context rationale text."
      }`;

        // Initialize inside the runtime call where env vars are loaded
        const activeKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
        const openai = new OpenAI({apiKey: activeKey});

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemMessage,
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
          response_format: {type: "json_object"},
        });

        const quizData = JSON.parse(aiResponse.choices[0].message.content);

        res.status(200).json({
          streak: 12,
          daysToExam: 344,
          settings: {
            showStreak: true,
            showCountdown: true,
            showQuestion: true,
          },
          question: quizData,
        });
      } catch (err) {
        console.error("Pipeline failure log:", err);
        res.status(500).json({error: "Failed to sync question loop."});
      }
    },
);
