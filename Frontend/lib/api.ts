export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:5001";

export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotSignedInError";
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem("token");
  } catch {
    // storage unavailable: nothing to clear
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * fetch against the backend with the stored JWT. No token: go to /login and throw NotSignedInError.
 * A 401 answer clears the token and goes to /login (the response is still returned).
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    throw new NotSignedInError();
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401) {
    clearToken();
    redirectToLogin();
  }
  return response;
}
