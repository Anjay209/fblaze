#!/usr/bin/env bash
set -e

echo "🔧 Fixing CertQuest AI training context (bash-safe)..."

FILES=(
  "docs/home.html"
  "docs/Public/home.html"
  "docs/Public/create.html"
  "docs/Public/home2.html"
  "docs/Public/solulu.html"
)

for FILE in "${FILES[@]}"; do
  if [[ ! -f "$FILE" ]]; then
    echo "⚠️  Skipping $FILE (not found)"
    continue
  fi

  if grep -q "__CERTQUEST_CONTEXT__" "$FILE"; then
    echo "⏭️  Skipping $FILE (already patched)"
    continue
  fi

  echo "🛠️  Patching $FILE"

  perl -0777 -i -pe '
    s|</body>|<script>
async function loadCertQuestContext(userId, competition) {
  const db = firebase.firestore();

  let baselineText = "";
  if (competition) {
    const compDoc = await db.collection("competitions").doc(competition).get();
    if (compDoc.exists && compDoc.data().baseline && compDoc.data().baseline.text) {
      baselineText = compDoc.data().baseline.text;
    }
  }

  let personalText = "";
  const entriesSnap = await db
    .collection("userTraining")
    .doc(userId)
    .collection("entries")
    .orderBy("timestamp", "desc")
    .limit(10)
    .get();

  entriesSnap.forEach(d => {
    if (d.data().content) personalText += d.data().content + "\\n\\n";
  });

  window.__CERTQUEST_CONTEXT__ =
    "=== OFFICIAL COMPETITION STUDY GUIDE ===\\n" +
    baselineText +
    "\\n\\n=== STUDENT PERSONAL TRAINING DATA ===\\n" +
    personalText;
}
</script>
</body>|s
  ' "$FILE"

  perl -0777 -i -pe '
    s/content:\s*prompt/content: (window.__CERTQUEST_CONTEXT__ || "") + "\\n\\n" + prompt/gs
  ' "$FILE"
done

echo "✅ CertQuest AI context successfully composed."
echo "🚀 Baseline + personal training now injected into every AI call."
