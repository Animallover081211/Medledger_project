export type IdentityRole = "patient" | "doctor" | "hospital" | "pharmacy" | "regulator";

const ROLE_PREFIX: Record<IdentityRole, string> = {
  patient: "patient",
  doctor: "gpdoctor",
  hospital: "hospitaldr",
  pharmacy: "pharmacy",
  regulator: "regulator",
};

const randomSuffix = () => {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return value.replace(/-/g, "").slice(0, 8).toLowerCase();
};

export const generateIdentityId = (role: IdentityRole) => {
  return `${ROLE_PREFIX[role]}-${randomSuffix()}`;
};
