export type CommunicationAuthorizationDecision = {
  allowed: boolean;
  reason: string;
  employerCaller: string;
  tenantId: string;
  purpose: string;
  channel: "email" | "sms";
  technology: string;
  jurisdiction: string;
  permissionVersion: string;
  suppressed: boolean;
  evaluatedAt: string;
};

export function evaluateCommunicationAuthorization(input: {
  channel: "email" | "sms";
  smsEnabled?: boolean;
  permissionGranted: boolean;
  withdrawn: boolean;
  suppressed: boolean;
  quietHoursViolation?: boolean;
  employerCaller: string;
  tenantId: string;
  purpose: string;
  technology: string;
  jurisdiction: string;
  permissionVersion: string;
}): CommunicationAuthorizationDecision {
  const evaluatedAt = new Date().toISOString();
  const base = {
    employerCaller: input.employerCaller,
    tenantId: input.tenantId,
    purpose: input.purpose,
    channel: input.channel,
    technology: input.technology,
    jurisdiction: input.jurisdiction,
    permissionVersion: input.permissionVersion,
    suppressed: input.suppressed,
    evaluatedAt,
  };

  if (input.channel === "sms" && !input.smsEnabled) {
    return { ...base, allowed: false, reason: "sms_disabled_until_gate" };
  }
  if (input.withdrawn || input.suppressed) {
    return { ...base, allowed: false, reason: "suppressed_or_withdrawn" };
  }
  if (!input.permissionGranted && input.purpose !== "transactional_application_receipt") {
    return { ...base, allowed: false, reason: "permission_missing" };
  }
  if (input.quietHoursViolation) {
    return { ...base, allowed: false, reason: "quiet_hours" };
  }
  return { ...base, allowed: true, reason: "authorized" };
}
