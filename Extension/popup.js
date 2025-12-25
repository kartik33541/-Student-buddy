
function cleanMentorOutput(text) {
  if (!text) return "";

  return text
    // Remove markdown headings
    .replace(/^#{1,6}\s*/gm, "")
    // Remove bullet symbols (*, -, •)
    .replace(/^[\*\-\•]\s*/gm, "")
    // Remove inline asterisks
    .replace(/\*/g, "")
    // Remove extra blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("button[data-level]");
  const responseDiv = document.getElementById("response");

  /* =========================
     HINT BUTTONS (UNCHANGED)
     ========================= */
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const level = btn.dataset.level;
      responseDiv.innerText = "Thinking...";

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs?.[0]?.url) {
          responseDiv.innerText = "No active tab found.";
          return;
        }

        const match = tabs[0].url.match(/problems\/([^/]+)/);
        if (!match) {
          responseDiv.innerText = "Open a LeetCode problem page.";
          return;
        }

        chrome.runtime.sendMessage(
          { action: "GET_HINT", slug: match[1], level },
          (res) => {
            responseDiv.innerText =
              res?.reply || res?.error || "No response from AI.";
          }
        );
      });
    });
  });

  /* =========================
     ANALYZE MY CODE (UNCHANGED)
     ========================= */
  document.getElementById("analyze-code-btn")
    ?.addEventListener("click", async () => {
      responseDiv.innerText = "Reading code from clipboard...";
      try {
        const code = await navigator.clipboard.readText();
        if (!code.trim()) throw new Error();

        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          const slug =
            tabs?.[0]?.url?.match(/problems\/([^/]+)/)?.[1] ||
            "unknown-problem";

          const res = await fetch("https://student-buddy-production.up.railway.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, slug })
          });

          const data = await res.json();
          responseDiv.innerText = data.reply;
        });
      } catch {
        responseDiv.innerText =
          "Copy your C++ code first, then click Analyze.";
      }
    });

  /* =========================
     ASK MENTOR (TEXT + VOICE)
     ========================= */
  const askMentorBtn = document.getElementById("ask-mentor-btn");
  const askMentorBox = document.getElementById("ask-mentor-box");
  const mentorInput = document.getElementById("mentor-input");
  const mentorSubmit = document.getElementById("mentor-submit");
  const voiceBtn = document.getElementById("mentor-voice-btn");

  let lastInputWasVoice = false;

  askMentorBtn?.addEventListener("click", () => {
    askMentorBox.style.display =
      askMentorBox.style.display === "none" ? "flex" : "none";
    mentorInput.focus();
  });

  mentorInput.addEventListener("input", () => {
    lastInputWasVoice = false;
  });

  /* =========================
     SPEECH → TEXT (IMPROVED)
     ========================= */
  voiceBtn?.addEventListener("click", () => {
    lastInputWasVoice = true;
    responseDiv.innerText = "Listening...";

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      responseDiv.innerText = "Speech recognition not supported.";
      lastInputWasVoice = false;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";          // BEST accuracy for EN + Hinglish
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.start();

    recognition.onresult = (event) => {
      mentorInput.value = event.results[0][0].transcript;
      responseDiv.innerText = "Got it. Asking mentor...";
      mentorSubmit.click(); // auto-submit
    };

    recognition.onerror = () => {
      responseDiv.innerText = "Could not hear properly. Try again.";
      lastInputWasVoice = false;
    };
  });

  /* =========================
     LANGUAGE TYPE DETECTION
     ========================= */
  function detectLanguageType(text) {
    const hindiRegex = /[\u0900-\u097F]/;
    const hinglishWords =
      /(hai|haan|nahi|ka|ki|ke|kya|kyu|kyon|wala|kar|hoga|raha|rahi)/i;

    if (hindiRegex.test(text)) return "HINDI";
    if (hinglishWords.test(text)) return "HINGLISH";
    return "ENGLISH";
  }

  /* =========================
     TEXT → SPEECH (STABLE)
     ========================= */
  function speakText(text, langType) {
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();

    let voice = null;

    if (langType === "ENGLISH") {
      utterance.lang = "en-US";
      utterance.rate = 0.98;
      voice =
        voices.find(v =>
          v.lang.startsWith("en") &&
          v.name.toLowerCase().includes("male")
        ) ||
        voices.find(v => v.lang === "en-US");
    }

    if (langType === "HINGLISH") {
      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      voice =
        voices.find(v => v.lang === "en-IN") ||
        voices.find(v => v.lang.startsWith("en"));
    }

    if (langType === "HINDI") {
      utterance.lang = "hi-IN";
      utterance.rate = 0.9;
      voice = voices.find(v => v.lang === "hi-IN");
    }

    utterance.voice = voice || voices[0];
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }

  /* =========================
     ASK MENTOR SUBMIT
     ========================= */
  mentorSubmit?.addEventListener("click", async () => {
    const question = mentorInput.value.trim();
    if (!question) return;

    responseDiv.innerText = "Mentor is thinking...";

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const slug =
        tabs?.[0]?.url?.match(/problems\/([^/]+)/)?.[1] ||
        "unknown-problem";

      const res = await fetch("https://student-buddy-production.up.railway.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ASK_MENTOR",
          slug,
          question
        })
      });

      const data = await res.json();
      responseDiv.innerText = cleanMentorOutput(data.reply);

      if (lastInputWasVoice) {
        const langType = detectLanguageType(question);
        speakText(data.reply, langType);
        lastInputWasVoice = false;
      }
    });
  });



  /* =========================
   INTERVIEW MODE LAUNCHER
   ========================= */
  const interviewBtn = document.getElementById("interview-mode-btn");

  if (interviewBtn) {
    interviewBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].url) {
          alert("No active tab found.");
          return;
        }

        const match = tabs[0].url.match(/problems\/([^/]+)/);
        if (!match) {
          alert("Open a LeetCode problem first.");
          return;
        }

        const slug = match[1];

        chrome.tabs.create({
          url: chrome.runtime.getURL(
            `interview.html?slug=${slug}`
          )
        });
      });
    });
  }

});



