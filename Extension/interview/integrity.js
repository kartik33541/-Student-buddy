// interview/integrity.js
export function initInterviewIntegrity({
  interviewState,
  showPanel,
  setActiveStep,
  reportPanel,
  stepReport,
  panels,
  steps,
  reportContent
}) {
  function showTabSwitchWarning() {
    const warning = document.createElement("div");
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #7c2d12;
      color: #fef3c7;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 13px;
      z-index: 9999;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    `;
    warning.innerText =
      "Warning: Tab switching detected. Next violation will terminate the interview.";
    document.body.appendChild(warning);

    setTimeout(() => {
      warning.style.opacity = "0";
      setTimeout(() => warning.remove(), 500);
    }, 6000);
  }

  function terminateInterviewForViolation() {
    if (interviewState.interviewTerminated) return;

    interviewState.interviewTerminated = true;
    interviewState.interviewActive = false;

    // 🔒 HARD LOCK submit button
    const submitBtn = document.getElementById("submit-answer-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Interview Ended";
    }

    showPanel(reportPanel, panels);
    setActiveStep(stepReport, steps);

    reportContent.innerHTML = `
      <div class="termination-box">
        <div class="termination-title">Interview Terminated</div>
        <div class="termination-message">
          The interview was automatically ended because repeated tab or window
          switching was detected during the session.<br><br>
          In real technical interviews, this behavior is treated as an
          integrity violation.
        </div>
        <hr class="termination-divider" />
        <div class="termination-score">Final Accuracy Score: 0 / 100</div>
      </div>
    `;
  }

  document.addEventListener("visibilitychange", () => {
    if (
      !interviewState.interviewActive ||
      interviewState.interviewTerminated
    ) return;

    if (document.visibilityState === "hidden") {
      interviewState.tabSwitchCount++;

      if (interviewState.tabSwitchCount === 1) {
        showTabSwitchWarning();
      } else {
        terminateInterviewForViolation();
      }
    }
  });
}
