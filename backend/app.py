from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os, json, requests  # use official openai if you prefer
app = FastAPI()

# Restrict CORS to your GitHub Pages origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://<your-gh-username>.github.io"],
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

OPENAI_BASE = os.getenv("OPENAI_BASE", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

def _key():
    k = os.getenv("OPENAI_API_KEY")
    if not k: raise RuntimeError("OPENAI_API_KEY missing")
    return k

@app.post("/api/chat")
def chat(payload: dict):
    user_msg = payload.get("message", "").strip()
    if not user_msg:
        raise HTTPException(400, "message required")
    r = requests.post(
        f"{OPENAI_BASE}/chat/completions",
        headers={"Authorization": f"Bearer {_key()}"},
        json={
            "model": OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": "You are a concise helpful assistant."},
                {"role": "user", "content": user_msg}
            ]
        },
        timeout=60,
    )
    if r.status_code >= 400:
        raise HTTPException(r.status_code, r.text)
    data = r.json()
    return {"reply": data["choices"][0]["message"]["content"]}

