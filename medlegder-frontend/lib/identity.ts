export type IdentityRole = "patient" | "doctor" | "hospital" | "pharmacy" | "regulator";

export type Identity = {
  id: string;
  role: IdentityRole;
};

const tokenKey = "medledger.token";
const userKey = "medledger.user";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(tokenKey);
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tokenKey, token);
};

export const getIdentity = (): Identity | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(userKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
};

export const setIdentity = (identity: Identity) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(userKey, JSON.stringify(identity));
};

export const clearIdentity = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(tokenKey);
  window.localStorage.removeItem(userKey);
};
