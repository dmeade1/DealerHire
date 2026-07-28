export type TrackerPolicy = {
  version: string;
  thirdPartyScriptsAllowed: boolean;
  serverEventAllowlist: string[];
  honorGpc: boolean;
  fingerprintingAllowed: boolean;
  stripApplicationTokens: boolean;
};

export const DEFAULT_TRACKER_POLICY: TrackerPolicy = {
  version: "2026-07-28.1",
  thirdPartyScriptsAllowed: false,
  serverEventAllowlist: [
    "page_view",
    "application_started",
    "application_accepted",
    "resume_pending_upload",
  ],
  honorGpc: true,
  fingerprintingAllowed: false,
  stripApplicationTokens: true,
};

export function assertPageAllowsThirdPartyScripts(pageKind: string, policy: TrackerPolicy): void {
  const sensitive = ["application", "rights", "accommodation"];
  if (sensitive.includes(pageKind) && policy.thirdPartyScriptsAllowed) {
    throw new Error("third-party scripts forbidden on application/rights/accommodation pages");
  }
}

export function filterServerEvent(
  eventName: string,
  payload: Record<string, unknown>,
  policy: TrackerPolicy,
  gpcEnabled: boolean,
): Record<string, unknown> | null {
  if (!policy.serverEventAllowlist.includes(eventName)) return null;
  if (policy.honorGpc && gpcEnabled) {
    return { eventName, bucket: "unattributed" };
  }
  const clean = { ...payload };
  if (policy.stripApplicationTokens) {
    delete clean.applicationToken;
    delete clean.magicCapability;
  }
  if (policy.fingerprintingAllowed) {
    throw new Error("fingerprinting must remain disabled");
  }
  return { eventName, ...clean };
}
