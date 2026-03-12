import {getIdentity} from "./identity";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export const apiFetch = async (path: string, init?: RequestInit) => {
  const identity = getIdentity();

  const res = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(identity
        ? {
            "X-User-Id": identity.id,
            "X-User-Role": identity.role,
          }
        : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Request failed with ${res.status}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown;
  }
};
