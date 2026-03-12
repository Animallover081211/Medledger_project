export type IdentityRole = "patient" | "doctor";

export type Identity = {
  id: string;
  role: IdentityRole;
};

const storageKey = "medledger.identity";

export const getIdentity = (): Identity | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
};

export const setIdentity = (identity: Identity) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(identity));
};

export const clearIdentity = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
};
