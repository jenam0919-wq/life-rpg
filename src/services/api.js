const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = (
  configuredApiUrl ||
  (import.meta.env.PROD
    ? "https://life-rpg-backend-saw4.onrender.com"
    : "/api")
).replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function authHeaders(token, headers = {}) {
  return token
    ? { ...headers, Authorization: `Bearer ${token}` }
    : headers;
}

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  request,
  get(path, token) {
    return request(path, {
      headers: authHeaders(token),
    });
  },
  post(path, body, token) {
    return request(path, {
      method: "POST",
      headers: authHeaders(token, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    });
  },
};

export default api;
