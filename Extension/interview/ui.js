// interview/ui.js

export function showPanel(panel, panels) {
  panels.codePanel.classList.add("hidden");
  panels.interviewPanel.classList.add("hidden");
  panels.reportPanel.classList.add("hidden");
  panel.classList.remove("hidden");
}

export function setActiveStep(step, steps) {
  steps.stepCode.classList.remove("active");
  steps.stepInterview.classList.remove("active");
  steps.stepReport.classList.remove("active");
  step.classList.add("active");
}
