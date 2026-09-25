export const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

/** Decodes the payload of a JWT (base64url, UTF-8 safe). Throws when the token is malformed. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split(".")[1] ?? "";
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const json = decodeURIComponent(
    Array.from(binary, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
  );
  return JSON.parse(json);
}

export function roleFromToken(token: string): string {
  try {
    const role = decodeJwtPayload(token)[ROLE_CLAIM];
    return typeof role === "string" ? role : "Client";
  } catch {
    return "Client";
  }
}
