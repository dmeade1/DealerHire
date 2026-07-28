/** Full dealership role taxonomy — all families must be deeply validated before live beta. */

export type RoleFamily = {
  department: string;
  jobFamily: string;
  compensationPatterns: string[];
  exampleTitle: string;
  validationStatus: "pending" | "in_progress" | "accepted";
};

export const ROLE_CATALOG: RoleFamily[] = [
  { department: "fixed_operations", jobFamily: "technician", compensationPatterns: ["hour", "flat_rate"], exampleTitle: "Automotive Technician", validationStatus: "in_progress" },
  { department: "service", jobFamily: "service_advisor", compensationPatterns: ["hour", "commission"], exampleTitle: "Service Advisor", validationStatus: "pending" },
  { department: "parts", jobFamily: "parts_specialist", compensationPatterns: ["hour"], exampleTitle: "Parts Specialist", validationStatus: "pending" },
  { department: "sales", jobFamily: "sales_consultant", compensationPatterns: ["draw", "commission"], exampleTitle: "Sales Consultant", validationStatus: "pending" },
  { department: "fi", jobFamily: "fi_manager", compensationPatterns: ["month", "commission"], exampleTitle: "F&I Manager", validationStatus: "pending" },
  { department: "administration", jobFamily: "office_admin", compensationPatterns: ["hour", "year"], exampleTitle: "Office Administrator", validationStatus: "pending" },
  { department: "leadership", jobFamily: "general_manager", compensationPatterns: ["year", "bonus"], exampleTitle: "General Manager", validationStatus: "pending" },
  { department: "service", jobFamily: "porter", compensationPatterns: ["hour"], exampleTitle: "Porter", validationStatus: "pending" },
  { department: "service", jobFamily: "detailer", compensationPatterns: ["hour", "flat_rate"], exampleTitle: "Detailer", validationStatus: "pending" },
  { department: "sales", jobFamily: "bdc", compensationPatterns: ["hour", "commission"], exampleTitle: "BDC Representative", validationStatus: "pending" },
];

export function allRolesAccepted(catalog = ROLE_CATALOG): boolean {
  return catalog.every((r) => r.validationStatus === "accepted");
}

export function betaBlockedReason(catalog = ROLE_CATALOG): string | null {
  if (allRolesAccepted(catalog)) return null;
  const pending = catalog.filter((r) => r.validationStatus !== "accepted").map((r) => r.jobFamily);
  return `Beta blocked: incomplete role acceptance for ${pending.join(", ")}`;
}
