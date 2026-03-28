export interface WaiverTemplateInput {
  clientName: string;
  conflictedParties: string[];
  conflictSummary: string;
  caseType?: string;
  requestedByName?: string;
  riskLevel?: "high" | "medium" | "low";
  mitigationSteps?: string[];
}

export const generateWaiverTemplate = ({
  clientName,
  conflictedParties,
  conflictSummary,
  caseType,
  requestedByName,
  riskLevel = "medium",
  mitigationSteps = [
    "Assign independent counsel to oversee adverse work",
    "Segregate sensitive information and limit access on a need-to-know basis",
    "Document the client's consent in the matter workspace",
  ],
}: WaiverTemplateInput) => {
  const parties = conflictedParties.length ? conflictedParties.join(", ") : "the conflicted parties listed above";
  const author = requestedByName ?? "Lexora Conflicts Team";

  return `Re: Conflict of Interest Waiver – ${caseType ?? "Matter"}

Dear ${clientName},

This letter confirms that our firm has identified a potential conflict of interest involving ${parties}. ${conflictSummary}

We believe the risk level associated with this matter is ${riskLevel.toUpperCase()} and have implemented the following safeguards to protect your interests:
${mitigationSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

Please review this notice carefully. If you are comfortable proceeding, sign and return this letter acknowledging:
• You understand the nature of the disclosed conflict and the parties involved.
• You consent to ${author.replace(/\.$/, "")} continuing to represent you despite this potential conflict.
• You may revoke this consent at any time, and alternative counsel can be recommended if needed.

______________________________        ______________________________
Client Name                               Date

Sincerely,
${author}`;
};
