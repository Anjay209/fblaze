async function getCertQuestContext(userId, competition) {
  const db = firebase.firestore();

  let baselineText = "";
  if (competition) {
    const compDoc = await db.collection("competitions").doc(competition).get();
    if (compDoc.exists && compDoc.data() && compDoc.data().baseline && compDoc.data().baseline.text) {
      baselineText = compDoc.data().baseline.text;
    }
  }

  let personalText = "";
  const snap = await db
    .collection("userTraining")
    .doc(userId)
    .collection("entries")
    .orderBy("timestamp", "desc")
    .limit(10)
    .get();

  snap.forEach(d => {
    if (d.data() && d.data().content) {
      personalText += d.data().content + "\n\n";
    }
  });

  return `
OFFICIAL COMPETITION BASELINE
${baselineText}

STUDENT PERSONAL TRAINING DATA
${personalText}
`;
}
