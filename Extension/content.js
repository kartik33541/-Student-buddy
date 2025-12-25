// ================= INJECT MONACO READER =================
(function injectMonacoReader() {
  if (window.__STUDENT_BUDDY_MONACO_INJECTED__) return;
  window.__STUDENT_BUDDY_MONACO_INJECTED__ = true;

  const script = document.createElement("script");

  script.textContent =
    "(function () {\n" +
    "  function getCode() {\n" +
    "    try {\n" +
    "      if (!window.monaco || !monaco.editor) return null;\n" +
    "\n" +
    "      // 1️⃣ Try active editor first (most reliable)\n" +
    "      if (monaco.editor.getEditors) {\n" +
    "        const editors = monaco.editor.getEditors();\n" +
    "        if (editors && editors.length > 0) {\n" +
    "          const val = editors[0].getValue();\n" +
    "          if (val && val.trim().length > 0) return val;\n" +
    "        }\n" +
    "      }\n" +
    "\n" +
    "      // 2️⃣ Fallback: find first non-empty model\n" +
    "      const models = monaco.editor.getModels();\n" +
    "      for (let i = 0; i < models.length; i++) {\n" +
    "        const v = models[i].getValue();\n" +
    "        if (v && v.trim().length > 0) return v;\n" +
    "      }\n" +
    "\n" +
    "      return null;\n" +
    "    } catch (e) {\n" +
    "      return null;\n" +
    "    }\n" +
    "  }\n" +
    "\n" +
    "  window.addEventListener('message', function (event) {\n" +
    "    if (event.data && event.data.type === 'REQUEST_EDITOR_CODE') {\n" +
    "      const code = getCode();\n" +
    "      window.postMessage({ type: 'EDITOR_CODE_RESPONSE', code: code }, '*');\n" +
    "    }\n" +
    "  });\n" +
    "})();";

  document.documentElement.appendChild(script);
  script.remove();
})();

// ================= CONTENT SCRIPT =================
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action !== "GET_CODE_FOR_ANALYSIS") return;

  let attempts = 0;
  const MAX_ATTEMPTS = 6;

  function requestCode() {
    attempts++;

    function handler(event) {
      if (event.data && event.data.type === "EDITOR_CODE_RESPONSE") {
        window.removeEventListener("message", handler);

        if (!event.data.code && attempts < MAX_ATTEMPTS) {
          setTimeout(requestCode, 350);
          return;
        }

        if (!event.data.code) {
          sendResponse({ code: null });
          return;
        }

        const lines = event.data.code.split("\n");
        const numbered = lines
          .slice(0, 200)
          .map((line, idx) => `${idx + 1} | ${line}`)
          .join("\n");

        sendResponse({ code: numbered });
      }
    }

    window.addEventListener("message", handler);
    window.postMessage({ type: "REQUEST_EDITOR_CODE" }, "*");
  }

  requestCode();
  return true; // REQUIRED for async response
});




