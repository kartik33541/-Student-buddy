
function detectLanguage(code) {
  const c = code.toLowerCase();

  // ---------- Python (LeetCode style) ----------
  if (
    c.includes("class solution:") &&
    c.includes("def ") &&
    c.includes("self")
  ) {
    return "Python";
  }

  // ---------- JavaScript ----------
  if (
    c.includes("var ") ||
    c.includes("let ") ||
    c.includes("const ") ||
    c.includes("=>") ||
    c.includes("function(")
  ) {
    return "JavaScript";
  }

  // ---------- Java ----------
  if (
    c.includes("class solution") &&
    (
      c.includes("public int") ||
      c.includes("public boolean") ||
      c.includes("public string") ||
      c.includes("int[]") ||
      c.includes("list<") ||
      c.includes("arraylist")
    )
  ) {
    return "Java";
  }

  // ---------- C++ ----------
  if (
    c.includes("class solution") &&
    (
      c.includes("vector<") ||
      c.includes("unordered_") ||
      c.includes("&") ||
      c.includes("long long")
    )
  ) {
    return "C++";
  }

  // ---------- Fallback ----------
  return "C++";
}

async function handleAnalyzeCode(parsed, slug, callGroq, res) {
  const code = parsed.code;
  const language = detectLanguage(code);
  if (!code) {
    res.writeHead(400);
    res.end("No code provided");
    return;
  }

  const analyzePrompt = `
// You are an experienced DSA mentor guiding a student who is solving LeetCode problems in ${language}.
// The student has written the following ${language} code for the LeetCode problem:
// "${slug}"

// ======================
// MANDATORY LANGUAGE RULE
// ======================
// - MANDATORY LANGUAGE RULE
//- ALL code references must assume ${language}
//- Do NOT mention other programming languages
//- Think like a competitive programmer reviewing ${language} code


// ======================
// OUTPUT FORMAT (STRICT)
// ======================
// - Output MUST be point-wise
// - Each point should be short and clear
// - NO paragraphs
// - NO unnecessary theory
// - Easy language, mentor-style tone

// ======================
// ANALYSIS BEHAVIOR
// ======================
// 1. First, briefly acknowledge what the student is trying to do

// 2. Clearly explain what is missing or incorrect
//    - Be specific
//    - Avoid judgmental tone

// 3. If code is ~70–90% correct:
//    - Mention exact line number or section
//    - Explain WHY it fails (logic, edge case, overflow, etc.)

// 4. If code is very incomplete:
//    - Explain what essential step is missing
//    - Relate it to what the student already wrote

// ======================
// GUIDED HINT RULE
// ======================
// - The LAST point MUST be a mentor-style hint
// - Build on the student's current code
// - Do NOT introduce a new approach abruptly

// ======================
// STRICT RESTRICTIONS
// ======================
// - Do NOT provide full solution
// - Do NOT rewrite the entire code
// - Do NOT give optimized solution
// - Do NOT include multiple approaches

// ======================
// STUDENT CODE (WITH LINE CONTEXT)
// ======================
// ${code}

// Now analyze the code and respond following ALL rules above.
// `;
  const reply = await callGroq(analyzePrompt);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ reply }));
}

module.exports = { handleAnalyzeCode };