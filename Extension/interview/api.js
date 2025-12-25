// interview/api.js

const API_URL = "https://student-buddy-production.up.railway.app";

export async function startInterviewAPI(slug, code) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "INTERVIEW_START",
      slug,
      code
    })
  });

  return res.json();
}

export async function submitAnswerAPI(sessionId, answer) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "INTERVIEW_ANSWER",
      sessionId,
      answer
    })
  });

  return res.json();
}

export async function endInterviewAPI(sessionId) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "INTERVIEW_END",
      sessionId
    })
  });

  return res.json();
}
