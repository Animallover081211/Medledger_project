import {getToken} from "./identity";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export const apiFetch = async (path: string, init?: RequestInit) => {
  const token = getToken();

  const res = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const text = await res.text();
  if (!res.ok) {
    const error = new Error(text || `Request failed with ${res.status}`);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown;
  }
};
