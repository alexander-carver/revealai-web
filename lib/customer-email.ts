export function normalizeCustomerEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

export function isRealCustomerEmail(email?: string | null) {
  const normalizedEmail = normalizeCustomerEmail(email);
  return !!normalizedEmail && !normalizedEmail.endsWith("@revealai.device");
}

export function getBillingCustomerEmail(email?: string | null) {
  const normalizedEmail = normalizeCustomerEmail(email);
  return isRealCustomerEmail(normalizedEmail) ? normalizedEmail : null;
}
