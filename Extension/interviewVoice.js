// /* ======================================================
//    Interview Voice Interaction Engine
//    - Voice input (Style B: click → speak → silence stop)
//    - Voice output (male, Indian English preference)
//    - NO business logic
//    - NO backend calls
//    ====================================================== */

// /* =========================
//    VOICE OUTPUT (TTS)
//    ========================= */
let selectedMaleVoice = null;

function loadVoices() {
  const voices = window.speechSynthesis.getVoices();

  // Prefer Indian English male voice
  selectedMaleVoice =
    voices.find(v =>
      v.lang === "en-IN" && /male|man|raj|ravi|google/i.test(v.name)
    ) ||
    voices.find(v =>
      v.lang.startsWith("en") && /male|man|google/i.test(v.name)
    ) ||
    voices.find(v => v.lang.startsWith("en")) ||
    null;
}

// Load voices (Chrome loads async)
loadVoices();
window.speechSynthesis.onvoiceschanged = loadVoices;

export function speakQuestion(text) {
  if (!text || !window.speechSynthesis) return;

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.95;   // calm interviewer pace
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (selectedMaleVoice) {
    utterance.voice = selectedMaleVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/* =========================
   VOICE INPUT (STT)
   ========================= */
let recognition = null;
let listening = false;

export function startVoiceAnswer(onResult, onError) {
  if (listening) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError && onError("Speech recognition not supported.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;       // Style B
  recognition.interimResults = false;   // final text only
  recognition.maxAlternatives = 1;

  listening = true;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    listening = false;
    onResult && onResult(transcript);
  };

  recognition.onerror = (event) => {
    listening = false;
    onError && onError(event.error || "Voice error");
  };

  recognition.onend = () => {
    listening = false;
  };

  recognition.start();
}

export function stopVoice() {
  if (recognition && listening) {
    recognition.stop();
    listening = false;
  }
}

/* =========================
   STATE HELPERS
   ========================= */
export function isListening() {
  return listening;
}



