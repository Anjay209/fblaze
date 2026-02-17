async function callCertQuestAI({ userId, competition, prompt }) {
  const context = await getCertQuestContext(userId, competition);

  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.openaiApiKey
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: context },
        { role: "user", content: prompt }
      ]
    })
  });
}
