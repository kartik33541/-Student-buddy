
import {
  speakQuestion,
  startVoiceAnswer,
  stopVoice
} from "./interviewVoice.js";

import { interviewState } from "./interview/state.js";
import { showPanel, setActiveStep } from "./interview/ui.js";
import { initInterviewIntegrity } from "./interview/integrity.js";
import {
  startInterviewAPI,
  submitAnswerAPI,
  endInterviewAPI
} from "./interview/api.js";

import { generateRecommendations } from "./interview/recommendations.js";

let slug = "unknown-problem";

/* =========================
   TIMER STATE (ADDITIVE)
   ========================= */
let questionTimer = null;
let timeLeft = 60;

/* =========================
   DOM ELEMENTS
   ========================= */
const problemTitle = document.getElementById("problem-title");

const codePanel = document.getElementById("code-panel");
const interviewPanel = document.getElementById("interview-panel");
const reportPanel = document.getElementById("report-panel");

const stepCode = document.getElementById("step-code");
const stepInterview = document.getElementById("step-interview");
const stepReport = document.getElementById("step-report");

const pasteCodeBtn = document.getElementById("paste-code-btn");
const startInterviewBtn = document.getElementById("start-interview-btn");

const codeInput = document.getElementById("code-input");

const interviewQuestion = document.getElementById("interview-question");
const answerInput = document.getElementById("answer-input");
const submitAnswerBtn = document.getElementById("submit-answer-btn");

const speakBtn = document.getElementById("speak-btn");

const reportContent = document.getElementById("report-content");
const exitBtn = document.getElementById("exit-btn");

/* =========================
   UI GROUPING
   ========================= */
const panels = { codePanel, interviewPanel, reportPanel };
const steps = { stepCode, stepInterview, stepReport };

/* =========================
   INIT
   ========================= */
(function init() {
  const params = new URLSearchParams(window.location.search);
  slug = params.get("slug") || "unknown-problem";
  problemTitle.innerText = `Problem: ${slug}`;
})();

/* =========================
   TIMER UI (ADDITIVE)
   ========================= */
function ensureTimerUI() {
  if (document.getElementById("question-timer")) return;

  const timer = document.createElement("div");
  timer.id = "question-timer";
  timer.className = "question-timer hidden";
  timer.innerText = "01:30";

  interviewPanel.prepend(timer);
}

/* =========================
   SAFE AUTO SUBMIT (FIX)
   ========================= */
function forceAutoSubmit() {
  if (
    !interviewState.interviewActive ||
    submitAnswerBtn.disabled
  ) return;

  if (!answerInput.value.trim()) {
    answerInput.value = "(No response provided)";
  }

  submitAnswerBtn.click();
}

/* =========================
   TIMER LOGIC (FIXED)
   ========================= */
function startQuestionTimer(autoSubmit) {
  clearInterval(questionTimer);

  timeLeft = 60;
  const timerEl = document.getElementById("question-timer");
  timerEl.classList.add("hidden");
  timerEl.classList.remove("danger");

  questionTimer = setInterval(() => {
    if (!interviewState.interviewActive) {
      clearInterval(questionTimer);
      return;
    }

    timeLeft--;

    if (timeLeft <= 15) {
      timerEl.classList.remove("hidden");
      timerEl.innerText = `00:${String(timeLeft).padStart(2, "0")}`;
    }

    if (timeLeft <= 10) {
      timerEl.classList.add("danger");
    }

    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      autoSubmit();
    }
  }, 1000);
}

/* =========================
   INTEGRITY INIT
   ========================= */
initInterviewIntegrity({
  interviewState,
  showPanel,
  setActiveStep,
  reportPanel,
  stepReport,
  panels,
  steps,
  reportContent
});

/* =========================
   CODE SUBMISSION
   ========================= */
pasteCodeBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) return alert("Clipboard is empty.");
    codeInput.value = text;
  } catch {
    alert("Unable to read clipboard.");
  }
});

startInterviewBtn.addEventListener("click", async () => {
  const code = codeInput.value.trim();
  if (!code) return alert("Paste code first.");

  startInterviewBtn.disabled = true;
  startInterviewBtn.innerText = "Starting...";

  try {
    const data = await startInterviewAPI(slug, code);

    interviewState.sessionId = data.sessionId;
    interviewState.interviewActive = true;
    interviewState.interviewTerminated = false;
    interviewState.tabSwitchCount = 0;

    interviewQuestion.innerText = data.question;
    speakQuestion(data.question);

    showPanel(interviewPanel, panels);
    setActiveStep(stepInterview, steps);

    ensureTimerUI();
    startQuestionTimer(forceAutoSubmit);

  } catch {
    alert("Backend not reachable.");
  } finally {
    startInterviewBtn.disabled = false;
    startInterviewBtn.innerText = "Start Interview";
  }
});

/* =========================
   ANSWERS (UNCHANGED LOGIC)
   ========================= */
submitAnswerBtn.addEventListener("click", async () => {
  const answer = answerInput.value.trim();
  if (!answer) return;

  stopVoice();

  submitAnswerBtn.disabled = true;
  submitAnswerBtn.innerText = "Submitting...";
  answerInput.value = "";

  try {
    const data = await submitAnswerAPI(
      interviewState.sessionId,
      answer
    );

    if (!data || !data.question) {
      interviewState.interviewActive = false;
      await endInterview();
      return;
    }

    interviewQuestion.innerText = data.question;
    speakQuestion(data.question);

    startQuestionTimer(forceAutoSubmit);

  } catch (err) {
    console.error("Submit failed:", err);

    if (interviewState.interviewActive) {
      alert("Failed to submit answer. Please try again.");
    }

  } finally {
    if (interviewState.interviewActive) {
      submitAnswerBtn.disabled = false;
      submitAnswerBtn.innerText = "Submit Answer";
    }
  }
});

/* =========================
   VOICE INPUT
   ========================= */
speakBtn.addEventListener("click", () => {
  startVoiceAnswer(
    text => answerInput.value = text,
    () => alert("Voice input failed.")
  );
});

/* =========================
   REPORT RENDERING
   ========================= */
function renderRecommendations(list) {
  return `
    <div class="report-section">
      <h3 class="report-title">Recommended Practice Problems</h3>
      <div class="recommendation-grid">
        ${list.map(p => `
          <a class="recommendation-card"
             href="https://leetcode.com/problems/${p.slug}/"
             target="_blank">
            ${p.id}. ${p.title}
            <span class="arrow">→</span>
          </a>
        `).join("")}
      </div>
    </div>
  `;
}

function renderInterviewReport(raw) {
  const clean = raw.replace(/\*\*/g, "").trim();

  const summary =
    clean.match(/INTERVIEW SUMMARY:?([\s\S]*?)FINAL ACCURACY SCORE:/i)?.[1]?.trim() || "";

  const scoreBlock =
    clean.match(/FINAL ACCURACY SCORE:?([\s\S]*?)FOCUS AREAS:/i)?.[1]?.trim() || "";

  const focusBlock =
    clean.match(/FOCUS AREAS:?([\s\S]*)$/i)?.[1]?.trim() || "";

  const scoreLines = scoreBlock.split("\n").map(l => l.trim()).filter(Boolean);

  const totalScoreLine = scoreLines.find(l => /\/\s*100/.test(l));
  const scoreMatch = totalScoreLine?.match(/(\d+)\s*\/\s*100/);
  const score = scoreMatch ? scoreMatch[1] : "—";

  const breakdownLines = scoreLines.filter(l => l !== totalScoreLine);

  const focusAreas = focusBlock.split("\n").filter(Boolean);
  const recommendations = generateRecommendations(focusAreas);

  return `
    <div class="report-section">
      <h3 class="report-title">Interview Summary</h3>
      <p>${summary}</p>
    </div>

    <div class="report-section">
      <h3 class="report-title">Final Accuracy Score</h3>
      <div class="report-score">${score} / 100</div>
      ${
        breakdownLines.length
          ? `<ul class="score-breakdown">
              ${breakdownLines.map(l => `<li>${l}</li>`).join("")}
            </ul>`
          : ""
      }
    </div>

    <div class="report-section">
      <h3 class="report-title">Focus Areas</h3>
      <ul class="report-focus">
        ${focusAreas.map(a => `<li>${a}</li>`).join("")}
      </ul>
    </div>

    ${renderRecommendations(recommendations)}
  `;
}

/* =========================
   END INTERVIEW
   ========================= */
async function endInterview() {
  clearInterval(questionTimer);

  showPanel(reportPanel, panels);
  setActiveStep(stepReport, steps);

  reportContent.innerText = "Evaluating your interview...";

  try {
    const data = await endInterviewAPI(interviewState.sessionId);
    reportContent.innerHTML = renderInterviewReport(data.report);
  } catch {
    reportContent.innerText = "Failed to generate report.";
  }
}

/* =========================
   EXIT
   ========================= */
exitBtn.addEventListener("click", () => {
  interviewState.interviewActive = false;
  interviewState.tabSwitchCount = 0;
  clearInterval(questionTimer);
  window.close();
});
