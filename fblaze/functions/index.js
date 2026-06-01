const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.incrementQuestionCount = functions.firestore
    .document("forum-questions/{questionId}")
    .onCreate(async (snap, context) => {
      const statsRef = db.collection("stats").doc("general");
      await statsRef.set(
          {totalQuestions: admin.firestore.FieldValue.increment(1)},
          {merge: true},
      );
      return null;
    });

exports.incrementSolvedCount = functions.firestore
    .document("forum-questions/{questionId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

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

      return null;
    });

// HTTP endpoint for Chrome Extension: returns streak/countdown + next question
// chosen by weakest competency computed from recent completed assignments.
exports.getNextExtensionQuestion = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    let uid = "test_fallback_user";
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
      } catch (tokenErr) {
        console.warn(
            "Invalid token signature validation, proceeding to fallback data logic layout.",
            tokenErr,
        );
      }
    }

    const targetExamDate = new Date("2027-05-10T08:00:00");
    const daysToExam = Math.max(
        0,
        Math.ceil((targetExamDate - new Date()) / (1000 * 60 * 60 * 24)),
    );

    const userSnapshot = await db.collection("users").doc(uid).get();
    const userData = userSnapshot.exists ? userSnapshot.data() : {};

    const streak = userData.streak || 0;
    const userSettings = userData.extensionSettings || {
      showStreak: true,
      showCountdown: true,
      showQuestion: true,
    };

    const assessmentsSnapshot = await db.collection("assignments")
        .where("to", "==", uid)
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
        const stats = record.competencyStats[key] || {};
        metricsMap[key].correct += stats.correct || 0;
        metricsMap[key].total += stats.total || 0;
      });
    });

    let targetWeakestCompetency = null;
    let lowestAccuracyBound = 1.1;

    Object.keys(metricsMap).forEach((key) => {
      const node = metricsMap[key];
      if (node.total > 0) {
        const ratio = node.correct / node.total;
        if (ratio < lowestAccuracyBound) {
          lowestAccuracyBound = ratio;
          targetWeakestCompetency = key;
        }
      }
    });

    if (!targetWeakestCompetency) {
      targetWeakestCompetency = "Parliamentary Procedure";
    }

    const quizBankSnapshot = await db.collection("quizzes")
        .where("competency", "==", targetWeakestCompetency)
        .limit(5)
        .get();

    let questionPayload = null;

    if (!quizBankSnapshot.empty) {
      const randomDoc = quizBankSnapshot.docs[
        Math.floor(Math.random() * quizBankSnapshot.docs.length)
      ];
      const randomPick = randomDoc.data() || {};
      questionPayload = {
        text: randomPick.text,
        options: randomPick.options,
        correctAnswer: randomPick.correctAnswer,
        explanation:
            randomPick.explanation ||
            "Review comprehensive structural rules material definitions " +
            "inside dashboard workspace maps.",
        competency: targetWeakestCompetency,
      };
    } else {
      questionPayload = {
        text: "What is the primary purpose of parliamentary procedure?",
        options: [
          "To make meetings more efficient",
          "To give the president more power",
          "To eliminate debate",
          "To make meetings longer",
        ],
        correctAnswer: "To make meetings more efficient",
        explanation:
            "Parliamentary procedure provides a clear framework to maintain " +
            "structured group assembly order, protecting individual logic " +
            "rights while optimizing meetings efficiency vectors.",
        competency: "Parliamentary Procedure",
      };
    }

    return res.status(200).json({
      streak: streak,
      daysToExam: daysToExam,
      settings: userSettings,
      question: questionPayload,
    });
  } catch (globalError) {
    console.error(
        "Critical extension query API routing failure handler:",
        globalError,
    );
    return res.status(500).send("Internal Server Exception bounds breached.");
  }
});
