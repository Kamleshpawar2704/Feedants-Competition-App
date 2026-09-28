const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  getCompetition: (slug, userId) =>
    request(`/competitions/slug/${slug}?userId=${encodeURIComponent(userId)}`),

  register: (competitionId, userId) =>
    request(`/competitions/${competitionId}/register`, {
      method: "POST",
      body: JSON.stringify({ userId })
    }),

  submit: (competitionId, userId, videoUrl) =>
    request(`/competitions/${competitionId}/submissions`, {
      method: "POST",
      body: JSON.stringify({ userId, videoUrl })
    })
};
