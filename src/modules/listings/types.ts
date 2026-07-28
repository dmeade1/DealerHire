import { z } from "zod";

export const Departments = [
  "fixed_operations",
  "service",
  "parts",
  "sales",
  "fi",
  "administration",
  "leadership",
] as const;

export const JobFamilies = [
  "technician",
  "service_advisor",
  "parts_specialist",
  "sales_consultant",
  "fi_manager",
  "office_admin",
  "general_manager",
  "porter",
  "detailer",
  "bdc",
] as const;

export const ListingPayloadSchema = z.object({
  title: z.string().min(3).max(120),
  department: z.enum(Departments),
  jobFamily: z.enum(JobFamilies),
  description: z.string().min(20),
  schedule: z.string().min(1),
  locationType: z.enum(["onsite"]).default("onsite"),
  mustHaveSkills: z.array(z.string()).default([]),
  trainableSkills: z.array(z.string()).default([]),
  credentials: z.array(z.string()).default([]),
  locale: z.literal("en").default("en"),
});

export type ListingPayload = z.infer<typeof ListingPayloadSchema>;

export const PaySchema = z.object({
  payMinCents: z.number().int().positive(),
  payMaxCents: z.number().int().positive(),
  payUnit: z.enum(["hour", "week", "month", "year", "flat_rate"]),
  compensationStructure: z.record(z.unknown()).default({}),
}).refine((p) => p.payMaxCents >= p.payMinCents, {
  message: "payMaxCents must be >= payMinCents",
});

export const RequirementInputSchema = z.object({
  label: z.string().min(1),
  essentialFunction: z.string().min(1),
  businessNecessity: z.string().min(1),
  acceptableEquivalents: z.array(z.string()).default([]),
  accommodationNotes: z.string().optional(),
  proxyReviewed: z.boolean(),
});
