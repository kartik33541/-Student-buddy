// **************NEW SERVER.JS************************************

require("dotenv").config(); // MUST be the first line

const http = require("http");

const { handleAskMentor } = require("./mentor/askMentor");
const { handleAnalyzeCode } = require("./analyzer/analyzeCode");
const { handleInterview } = require("./interview/interviewEngine");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL_NAME = "llama-3.3-70b-versatile";

/* =========================
   GROQ CALL (CENTRALIZED)
   ========================= */
function callGroq(
  prompt,
  systemPrompt = "You are a strict DSA mentor for C++ competitive programming."
) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })
  })
    .then(r => r.json())
    .then(d => d.choices[0].message.content);
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();

  let body = "";
  req.on("data", c => (body += c));
  req.on("end", async () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end("Invalid JSON");
      return;
    }

    const slug = parsed.slug || "unknown";

    /* =========================
       BACKGROUND.JS ROUTE
       (NEW, SAFE ADDITION)
       ========================= */
    if (parsed.type === "BACKGROUND_GROQ") {
      if (!parsed.prompt) {
        res.writeHead(400);
        res.end("No prompt provided");
        return;
      }

      try {
        const reply = await callGroq(parsed.prompt);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply }));
      } catch {
        res.writeHead(500);
        res.end("Groq request failed");
      }
      return;
    }

    /* =========================
       ASK MENTOR
       ========================= */
    if (parsed.type === "ASK_MENTOR") {
      return handleAskMentor(parsed, slug, callGroq, res);
    }

    /* =========================
       ANALYZE CODE
       ========================= */
    if (parsed.type === "ANALYZE_CODE") {
      return handleAnalyzeCode(parsed, slug, callGroq, res);
    }

    /* =========================
       INTERVIEW MODE
       ========================= */
    if (parsed.type?.startsWith("INTERVIEW")) {
      return handleInterview(parsed, callGroq, res);
    }

    /* =========================
       BACKWARD COMPATIBILITY
       ========================= */
    if (parsed.code && !parsed.type) {
      return handleAnalyzeCode(parsed, slug, callGroq, res);
    }

    res.writeHead(400);
    res.end("Invalid request");
  });
});

server.listen(3001, () => {
  console.log("✅ Student Buddy backend running on port 3001");
});
