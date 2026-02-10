import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "docs")));

// GitHub Proxy (REGEX = VERSION SAFE)
app.get(/^\/api\/github-proxy\/(.+)/, async (req, res) => {
  try {
    const githubPath = req.params[0];

    const r = await fetch(`https://github-proxy.certquest.workers.dev/github/${githubPath}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_READ_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });

    const data = await r.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
