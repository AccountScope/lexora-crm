/**
 * LEDES Format Generator
 * Converts time entries to LEDES 1998B and 2000 formats
 * Required for corporate client billing
 */

import { format } from "date-fns";

export interface TimeEntry {
  id: string;
  date: string;
  lawyerName: string;
  lawyerRate: number;
  hours: number;
  activityCode: string; // UTBMS code
  description: string;
  matterNumber: string;
  invoiceNumber: string;
  lineNumber: number;
}

export interface LEDESConfig {
  format: "1998B" | "2000";
  lawFirmName: string;
  lawFirmTaxId: string;
  clientId: string;
  matterNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
}

/**
 * Generate LEDES 1998B format
 * 
 * Format: Pipe-delimited (|) with specific column order
 * 
 * Columns:
 * 1. INVOICE_DATE
 * 2. INVOICE_NUMBER
 * 3. CLIENT_ID
 * 4. LAW_FIRM_MATTER_ID
 * 5. LINE_ITEM_NUMBER
 * 6. EXP/FEE_INV_ADJ_TYPE
 * 7. LINE_ITEM_NUMBER_OF_UNITS
 * 8. LINE_ITEM_ADJUSTMENT_AMOUNT
 * 9. LINE_ITEM_TOTAL
 * 10. LINE_ITEM_DATE
 * 11. LINE_ITEM_TASK_CODE
 * 12. LINE_ITEM_EXPENSE_CODE
 * 13. LINE_ITEM_ACTIVITY_CODE
 * 14. TIMEKEEPER_ID
 * 15. LINE_ITEM_DESCRIPTION
 * 16. LAW_FIRM_ID
 * 17. LINE_ITEM_UNIT_COST
 * 18. TIMEKEEPER_NAME
 * 19. TIMEKEEPER_CLASSIFICATION
 */
export function generateLEDES1998B(
  entries: TimeEntry[],
  config: LEDESConfig
): string {
  const lines: string[] = [];

  // Header row
  lines.push(
    [
      "INVOICE_DATE",
      "INVOICE_NUMBER",
      "CLIENT_ID",
      "LAW_FIRM_MATTER_ID",
      "LINE_ITEM_NUMBER",
      "EXP/FEE_INV_ADJ_TYPE",
      "LINE_ITEM_NUMBER_OF_UNITS",
      "LINE_ITEM_ADJUSTMENT_AMOUNT",
      "LINE_ITEM_TOTAL",
      "LINE_ITEM_DATE",
      "LINE_ITEM_TASK_CODE",
      "LINE_ITEM_EXPENSE_CODE",
      "LINE_ITEM_ACTIVITY_CODE",
      "TIMEKEEPER_ID",
      "LINE_ITEM_DESCRIPTION",
      "LAW_FIRM_ID",
      "LINE_ITEM_UNIT_COST",
      "TIMEKEEPER_NAME",
      "TIMEKEEPER_CLASSIFICATION",
    ].join("|")
  );

  // Data rows
  for (const entry of entries) {
    const total = entry.hours * entry.lawyerRate;

    lines.push(
      [
        formatDate(config.invoiceDate), // INVOICE_DATE
        config.invoiceNumber, // INVOICE_NUMBER
        config.clientId, // CLIENT_ID
        config.matterNumber, // LAW_FIRM_MATTER_ID
        entry.lineNumber.toString(), // LINE_ITEM_NUMBER
        "F", // EXP/FEE_INV_ADJ_TYPE (F = Fee, E = Expense)
        formatHours(entry.hours), // LINE_ITEM_NUMBER_OF_UNITS
        "0.00", // LINE_ITEM_ADJUSTMENT_AMOUNT
        formatAmount(total), // LINE_ITEM_TOTAL
        formatDate(entry.date), // LINE_ITEM_DATE
        "", // LINE_ITEM_TASK_CODE (optional)
        "", // LINE_ITEM_EXPENSE_CODE (only for expenses)
        entry.activityCode || "", // LINE_ITEM_ACTIVITY_CODE
        "", // TIMEKEEPER_ID (optional)
        cleanDescription(entry.description), // LINE_ITEM_DESCRIPTION
        config.lawFirmTaxId, // LAW_FIRM_ID
        formatAmount(entry.lawyerRate), // LINE_ITEM_UNIT_COST
        entry.lawyerName, // TIMEKEEPER_NAME
        "Partner", // TIMEKEEPER_CLASSIFICATION (Partner, Associate, Paralegal)
      ].join("|")
    );
  }

  return lines.join("\n");
}

/**
 * Generate LEDES 2000 format (XML-based)
 * 
 * More complex format with nested XML structure
 */
export function generateLEDES2000(
  entries: TimeEntry[],
  config: LEDESConfig
): string {
  const totalAmount = entries.reduce(
    (sum, e) => sum + e.hours * e.lawyerRate,
    0
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <InvoiceDate>${formatDate(config.invoiceDate)}</InvoiceDate>
  <InvoiceNumber>${config.invoiceNumber}</InvoiceNumber>
  <BillingPeriodStart>${formatDate(entries[0]?.date || config.invoiceDate)}</BillingPeriodStart>
  <BillingPeriodEnd>${formatDate(entries[entries.length - 1]?.date || config.invoiceDate)}</BillingPeriodEnd>
  <Firm>
    <Name>${escapeXml(config.lawFirmName)}</Name>
    <TaxID>${config.lawFirmTaxId}</TaxID>
  </Firm>
  <Client>
    <ClientID>${config.clientId}</ClientID>
    <MatterNumber>${config.matterNumber}</MatterNumber>
  </Client>
  <Summary>
    <TotalFees>${formatAmount(totalAmount)}</TotalFees>
    <TotalExpenses>0.00</TotalExpenses>
    <TotalAmount>${formatAmount(totalAmount)}</TotalAmount>
  </Summary>
  <LineItems>
${entries
  .map(
    (entry) => `    <LineItem>
      <LineNumber>${entry.lineNumber}</LineNumber>
      <Type>Fee</Type>
      <Date>${formatDate(entry.date)}</Date>
      <Timekeeper>
        <Name>${escapeXml(entry.lawyerName)}</Name>
        <Rate>${formatAmount(entry.lawyerRate)}</Rate>
      </Timekeeper>
      <Hours>${formatHours(entry.hours)}</Hours>
      <ActivityCode>${entry.activityCode || ""}</ActivityCode>
      <Description>${escapeXml(entry.description)}</Description>
      <Amount>${formatAmount(entry.hours * entry.lawyerRate)}</Amount>
    </LineItem>`
  )
  .join("\n")}
  </LineItems>
</Invoice>`;

  return xml;
}

/**
 * Validate LEDES file
 * Returns errors if format is invalid
 */
export function validateLEDES(
  content: string,
  format: "1998B" | "2000"
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (format === "1998B") {
    const lines = content.split("\n").filter((l) => l.trim());

    if (lines.length < 2) {
      errors.push("File must have header and at least one data row");
    }

    // Check header
    const header = lines[0];
    if (!header.includes("INVOICE_DATE|INVOICE_NUMBER")) {
      errors.push("Invalid header format");
    }

    // Check data rows
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split("|");
      if (cols.length !== 19) {
        errors.push(`Line ${i + 1}: Expected 19 columns, got ${cols.length}`);
      }

      // Validate date format
      if (cols[0] && !/^\d{8}$/.test(cols[0])) {
        errors.push(`Line ${i + 1}: Invalid date format (expected YYYYMMDD)`);
      }

      // Validate amounts
      if (cols[8] && !/^\d+\.\d{2}$/.test(cols[8])) {
        errors.push(`Line ${i + 1}: Invalid amount format`);
      }
    }
  } else if (format === "2000") {
    // Basic XML validation
    if (!content.includes("<?xml")) {
      errors.push("Missing XML declaration");
    }
    if (!content.includes("<Invoice>")) {
      errors.push("Missing Invoice root element");
    }
    if (!content.includes("</Invoice>")) {
      errors.push("Unclosed Invoice element");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper functions
 */

function formatDate(dateStr: string): string {
  // LEDES format: YYYYMMDD
  const date = new Date(dateStr);
  return format(date, "yyyyMMdd");
}

function formatAmount(amount: number): string {
  // LEDES format: Always 2 decimal places
  return amount.toFixed(2);
}

function formatHours(hours: number): string {
  // LEDES format: 2 decimal places
  return hours.toFixed(2);
}

function cleanDescription(desc: string): string {
  // Remove pipes and newlines (would break format)
  return desc.replace(/\|/g, ";").replace(/\n/g, " ").trim();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * UTBMS Activity Codes
 * Standard codes for legal billing
 */
export const UTBMS_CODES = {
  // L100 - Legal Research & Analysis
  L110: "Legal Research - Case Law",
  L120: "Legal Research - Statutes",
  L130: "Legal Research - Secondary Sources",
  L140: "Legal Research - Computer",

  // L200 - Case Management & Administration
  L210: "Case Management",
  L220: "Case Strategy",
  L230: "Trial Preparation",

  // L300 - Discovery
  L310: "Document Review",
  L320: "Written Discovery Requests",
  L330: "Written Discovery Responses",
  L340: "Depositions",

  // L400 - Court Appearances
  L410: "Motion Practice",
  L420: "Court Hearings",
  L430: "Trial",
  L440: "Appellate Proceedings",

  // L500 - Negotiations & Settlement
  L510: "Negotiations",
  L520: "Mediation",
  L530: "Settlement Documentation",

  // A - Attorney Time
  A101: "Analysis & Strategy",
  A102: "Client Communication",
  A103: "Document Drafting",
  A104: "Fact Investigation",
  A105: "Legal Research",
};

/**
 * Auto-map description to UTBMS code
 * Uses keywords to suggest appropriate code
 */
export function suggestUTBMSCode(description: string): string {
  const lowerDesc = description.toLowerCase();

  // Court-related
  if (lowerDesc.includes("court") || lowerDesc.includes("hearing")) {
    return "L420";
  }
  if (lowerDesc.includes("trial")) {
    return "L430";
  }
  if (lowerDesc.includes("motion")) {
    return "L410";
  }
  if (lowerDesc.includes("appeal")) {
    return "L440";
  }

  // Discovery
  if (lowerDesc.includes("deposition")) {
    return "L340";
  }
  if (lowerDesc.includes("document review") || lowerDesc.includes("discovery")) {
    return "L310";
  }
  if (lowerDesc.includes("interrogator") || lowerDesc.includes("request")) {
    return "L320";
  }

  // Research
  if (lowerDesc.includes("research")) {
    return "L110";
  }

  // Negotiation
  if (lowerDesc.includes("negotiat") || lowerDesc.includes("settlement")) {
    return "L510";
  }
  if (lowerDesc.includes("mediat")) {
    return "L520";
  }

  // Client communication
  if (lowerDesc.includes("client") || lowerDesc.includes("correspondence")) {
    return "A102";
  }

  // Drafting
  if (lowerDesc.includes("draft") || lowerDesc.includes("review")) {
    return "A103";
  }

  // Default
  return "A101"; // Analysis & Strategy
}
