
// ================= BACKEND CALL =================
async function callBackend(prompt) {
  const res = await fetch("https://student-buddy-production.up.railway.app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "BACKGROUND_GROQ",
      prompt
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Backend request failed: " + txt);
  }

  const data = await res.json();
  return data.reply;
}

// ================= MESSAGE HANDLER =================
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

  // =================================================
  // =============== GET_HINT (BUILD-UP) ==============
  // =================================================
  if (req.action === "GET_HINT") {
    const { slug, level } = req;

    const prompt = `
You are a LeetCode mentor helping a competitive programmer.

IMPORTANT LANGUAGE RULE (MANDATORY):
- ALL code must be written in C++
- DO NOT provide Python, Java, or any other language
- Assume the user is coding in C++

Problem identifier (LeetCode slug):
"${slug}"

You already know this problem.

USER REQUEST TYPE:
"${level}"

VERY IMPORTANT OUTPUT RULES (STRICT):
- If USER REQUEST TYPE is NOT "optimal":
  → Respond with ONLY the requested section
  → DO NOT include any other sections
  → DO NOT include code unless explicitly required by that section

- If USER REQUEST TYPE IS "optimal":
  → Respond with ALL sections in the following exact order:
    1. Intuition
    2. Step-by-step Thinking
    3. Concept
    4. Algorithm (pseudocode, C++ style)
    5. Brute Force (C++ code + time & space complexity)
    6. Optimal Solution (C++ code + time & space complexity)

SECTION DEFINITIONS (FOLLOW STRICTLY):
- intuition → core idea only, NO steps, NO code
- steps → step-by-step reasoning, NO code
- concept → explain relevant data structures / algorithms
- algorithm → pseudocode only (C++ style)
- brute → brute-force C++ code + explicit time & space complexity
- optimal → optimal C++ code + explicit time & space complexity

FORMATTING RULES:
- Use clear headings
- Do NOT add extra sections
- Do NOT explain what you are doing
- Follow the rules exactly

Now respond according to the USER REQUEST TYPE.
`;

    callBackend(prompt)
      .then((reply) => sendResponse({ reply }))
      .catch((err) => sendResponse({ error: err.message }));

    return true; // async response
  }
});
