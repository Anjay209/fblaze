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
