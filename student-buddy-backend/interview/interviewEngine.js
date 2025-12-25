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

  return "C++";
}

const interviewSessions = new Map();

const INTENT_POOLS = {
  UNDERSTANDING: [
    "Explain the invariant your algorithm maintains and why it guarantees correctness.",
    "What assumption does your solution rely on that would break it immediately?",
    "Explain your approach as if reviewing a pull request."
  ],
  COMPLEXITY: [
    "Under what realistic conditions could this degrade beyond logarithmic time?",
    "What is the tightest bound on comparisons performed?",
    "Would this still be optimal if comparisons were expensive?"
  ],
  EDGE_CASES: [
    "Which input would you test first before deploying this?",
    "What silent failure worries you the most?",
    "What happens when low and high cross earlier than expected?"
  ],
  CONSTRAINTS: [
    "What if memory access is slower than computation?",
    "How does large duplication affect correctness?",
    "What if input does not fit cache?"
  ],
  TRADEOFFS: [
    "Why this approach instead of another?",
    "What tradeoff are you making for simplicity?",
    "What would you change under latency constraints?"
  ],
  STRETCH: [
    "How would you debug this if it fails intermittently?",
    "What assumption here worries you most?",
    "How would you monitor this in production?"
  ]
};

const STAGES = Object.keys(INTENT_POOLS);

/* =========================
   NEW: FIRST QUESTION POOL
   (ONLY ADDITION)
========================= */
const FIRST_QUESTION_POOL = [
  "Explain your approach briefly. Assume I already know the problem.",
  "Walk me through your solution at a high level.",
  "Before we go deeper, summarize how your solution works.",
  "Give me a quick overview of your approach and key decisions.",
  "Explain the idea behind your solution without diving into code."
];

async function handleInterview(parsed, callGroq, res) {
  const { type } = parsed;

  /* ===== START ===== */
  if (type === "INTERVIEW_START") {
    const sessionId = Date.now().toString();
    const language = detectLanguage(parsed.code);

    interviewSessions.set(sessionId, {
      slug: parsed.slug,
      code: parsed.code,
      language,
      answers: [],
      usedIntents: new Set(),
      crossAsked: false,
      maxQ: Math.random() < 0.5 ? 6 : 7
    });

    const firstQuestion =
      FIRST_QUESTION_POOL[
        Math.floor(Math.random() * FIRST_QUESTION_POOL.length)
      ];

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      sessionId,
      question: firstQuestion
    }));
    return;
  }

  /* ===== ANSWER ===== */
  if (type === "INTERVIEW_ANSWER") {
    const s = interviewSessions.get(parsed.sessionId);
    s.answers.push(parsed.answer);

    if (s.answers.length >= s.maxQ) {
      res.writeHead(200);
      res.end(JSON.stringify({ question: null }));
      return;
    }

    let prompt = "";

    if (!s.crossAsked && s.answers.length >= 2) {
      s.crossAsked = true;
      prompt = `
You are a technical interviewer.

Challenge a specific claim from the candidate using their own ${s.language} code.

Problem: ${s.slug}
Code:
${s.code}
Last Answer:
${parsed.answer}

Ask ONE sharp follow-up.
`;
    } else {
      const stage = STAGES[Math.floor(Math.random() * STAGES.length)];
      const pool = INTENT_POOLS[stage].filter(i => !s.usedIntents.has(i));
      const intent = pool[Math.floor(Math.random() * pool.length)];
      s.usedIntents.add(intent);

      prompt = `
You are a senior interviewer conducting a real interview.

Intent:
"${intent}"

Rules:
- Conditional or hypothetical framing
- No theory
- One question only
- Interview-level difficulty
- Assume the candidate is coding in ${s.language}

Problem: ${s.slug}
Code:
${s.code}
Candidate Answer:
${parsed.answer}
`;
    }

    const question = await callGroq(prompt, "You are a strict technical interviewer.");
    res.writeHead(200);
    res.end(JSON.stringify({ question }));
    return;
  }

  /* ===== END ===== */
  if (type === "INTERVIEW_END") {
    const s = interviewSessions.get(parsed.sessionId);

    const reportPrompt = `
You are a senior technical interviewer evaluating a real coding interview.

The candidate wrote the solution in ${s.language}.
Do NOT reward or penalize based on language choice.

You MUST be STRICT and REALISTIC.
High scores must be EARNED.

===========================
CRITICAL SCORING RULES
===========================

- If answers are empty, vague, "NL", or irrelevant:
  • Communication MUST be ≤ 3/10
  • Understanding MUST be ≤ 8/20
  • Final score MUST NOT exceed 60

- If code is correct BUT explanations are weak:
  • Penalize Communication and Understanding
  • Do NOT compensate with Code Quality

- Scores above 85 require:
  • Clear explanations
  • Correct handling of follow-ups
  • Confident reasoning

- Scores above 90 are RARE and only for excellent interviews.

======================
OUTPUT FORMAT (STRICT)
======================

INTERVIEW SUMMARY:
Write a professional, honest interview summary in 4–6 lines.
Mention weaknesses clearly if present.
Do NOT include scores here.

FINAL ACCURACY SCORE:
<NUMBER> / 100

BREAKDOWN:
- Understanding: X/20
- Correctness: X/25
- Constraints: X/15
- Edge cases: X/10
- Code quality: X/20
- Communication: X/10

FOCUS AREAS:
Provide 2–3 specific, interview-relevant improvement areas.

======================
EVALUATION CONTEXT
======================

Code:
${s.code}

Candidate Answers:
${s.answers.join("\n")}

Now evaluate STRICTLY following ALL rules above.
`;

    const report = await callGroq(reportPrompt, "Senior interviewer feedback");

    const recommendedProblems = [
      { id: 1, title: "Two Sum", slug: "two-sum" },
      { id: 217, title: "Contains Duplicate", slug: "contains-duplicate" },
      { id: 560, title: "Subarray Sum Equals K", slug: "subarray-sum-equals-k" }
    ];

    interviewSessions.delete(parsed.sessionId);

    res.writeHead(200);
    res.end(JSON.stringify({
      report,
      recommendations: recommendedProblems
    }));
  }
}

module.exports = { handleInterview };
