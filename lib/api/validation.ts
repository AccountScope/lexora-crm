import { z } from "zod";

export const caseStatusEnum = z.enum(["OPEN", "PENDING", "ON_HOLD", "CLOSED"]);

export const createCaseSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(3),
  matterNumber: z.string().min(3),
  practiceArea: z.string().optional(),
  status: caseStatusEnum.default("OPEN"),
  description: z.string().optional(),
  opensOn: z.string().optional(),
  closesOn: z.string().optional().nullable(),
  leadAttorneyId: z.string().uuid().optional().nullable(),
});

export const updateCaseSchema = createCaseSchema.partial();

export const caseNoteSchema = z.object({
  matterId: z.string().uuid(),
  note: z.string().min(1),
  visibility: z
    .enum(["INTERNAL_ONLY", "FIRM_CONFIDENTIAL", "CLIENT_VISIBLE", "CLIENT_DOWNLOADABLE", "RESTRICTED"])
    .default("FIRM_CONFIDENTIAL"),
});

export const documentUploadSchema = z.object({
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  classification: z
    .enum(["INTERNAL_ONLY", "FIRM_CONFIDENTIAL", "CLIENT_VISIBLE", "CLIENT_DOWNLOADABLE", "RESTRICTED"])
    .default("FIRM_CONFIDENTIAL"),
  documentType: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CaseNoteInput = z.infer<typeof caseNoteSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
