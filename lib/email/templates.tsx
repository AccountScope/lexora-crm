import * as React from "react";
import { Body, Container, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";
import { render } from "@react-email/render";

export type EmailTemplateType =
  | "DEADLINE_REMINDER"
  | "CASE_UPDATE"
  | "DOCUMENT_UPLOADED"
  | "INVOICE_SENT"
  | "NEW_CASE_ASSIGNMENT"
  | "CLIENT_PORTAL_MESSAGE";

export interface DeadlineReminderData {
  title: string;
  dueDate: string;
  priority: string;
  caseTitle?: string;
  assignedName?: string;
  link?: string;
  notes?: string;
}

export interface CaseUpdateData {
  caseTitle: string;
  update: string;
  actor?: string;
  occurredAt?: string;
  link?: string;
}

export interface DocumentUploadedData {
  caseTitle?: string;
  documentTitle: string;
  uploadedBy: string;
  link?: string;
}

export interface InvoiceSentData {
  invoiceNumber: string;
  amount: string;
  dueDate?: string;
  clientName?: string;
  link?: string;
}

export interface CaseAssignmentData {
  caseTitle: string;
  role: string;
  assignedBy?: string;
  link?: string;
}

export interface ClientPortalMessageData {
  clientName: string;
  preview: string;
  link?: string;
}

export type EmailTemplatePayloadMap = {
  DEADLINE_REMINDER: DeadlineReminderData;
  CASE_UPDATE: CaseUpdateData;
  DOCUMENT_UPLOADED: DocumentUploadedData;
  INVOICE_SENT: InvoiceSentData;
  NEW_CASE_ASSIGNMENT: CaseAssignmentData;
  CLIENT_PORTAL_MESSAGE: ClientPortalMessageData;
};

const baseStyles = {
  container: {
    margin: "0 auto",
    padding: "24px",
    maxWidth: "560px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
  },
  text: {
    fontSize: "14px",
    lineHeight: "20px",
    color: "#1f2933",
    margin: "0 0 12px 0",
  },
  muted: {
    color: "#64748b",
    fontSize: "12px",
  },
};

const BaseTemplate = ({ preview, children }: { preview: string; children: React.ReactNode }) => (
  <Html>
    <Preview>{preview}</Preview>
    <Body style={{ backgroundColor: "#f4f5f7", fontFamily: "Inter, Arial, sans-serif", padding: "32px" }}>
      <Container style={baseStyles.container}>
        {children}
        <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
        <Text style={baseStyles.muted}>Powered by Lexora — enterprise legal CRM.</Text>
      </Container>
    </Body>
  </Html>
);

const DeadlineReminderTemplate = (data: DeadlineReminderData) => (
  <BaseTemplate preview={`Reminder: ${data.title}`}>
    <Heading as="h2">Upcoming deadline</Heading>
    <Text style={baseStyles.text}>
      <strong>{data.title}</strong>
      {data.caseTitle ? ` (${data.caseTitle})` : null}
    </Text>
    <Text style={baseStyles.text}>Due: {new Date(data.dueDate).toLocaleString()}</Text>
    <Text style={baseStyles.text}>Priority: {data.priority}</Text>
    {data.notes && <Text style={baseStyles.text}>{data.notes}</Text>}
    {data.link && (
      <Link href={data.link} style={{ color: "#2563eb", fontSize: "14px" }}>
        View deadline details ↗
      </Link>
    )}
  </BaseTemplate>
);

const CaseUpdateTemplate = (data: CaseUpdateData) => (
  <BaseTemplate preview={`Case update: ${data.caseTitle}`}>
    <Heading as="h2">{data.caseTitle}</Heading>
    <Text style={baseStyles.text}>{data.update}</Text>
    {data.actor && <Text style={baseStyles.text}>Updated by {data.actor}</Text>}
    {data.occurredAt && <Text style={baseStyles.text}>When: {new Date(data.occurredAt).toLocaleString()}</Text>}
    {data.link && (
      <Link href={data.link} style={{ color: "#2563eb", fontSize: "14px" }}>
        Open case timeline
      </Link>
    )}
  </BaseTemplate>
);

const DocumentUploadedTemplate = (data: DocumentUploadedData) => (
  <BaseTemplate preview={`Document uploaded: ${data.documentTitle}`}>
    <Heading as="h2">New document available</Heading>
    <Text style={baseStyles.text}>
      <strong>{data.documentTitle}</strong> uploaded by {data.uploadedBy}
    </Text>
    {data.caseTitle && <Text style={baseStyles.text}>Case: {data.caseTitle}</Text>}
    {data.link && (
      <Link href={data.link} style={{ color: "#2563eb", fontSize: "14px" }}>
        Review document ↗
      </Link>
    )}
  </BaseTemplate>
);

const InvoiceSentTemplate = (data: InvoiceSentData) => (
  <BaseTemplate preview={`Invoice ${data.invoiceNumber} ready`}>
    <Heading as="h2">Invoice sent</Heading>
    <Text style={baseStyles.text}>Invoice {data.invoiceNumber} for {data.amount}</Text>
    {data.clientName && <Text style={baseStyles.text}>Client: {data.clientName}</Text>}
    {data.dueDate && <Text style={baseStyles.text}>Due: {new Date(data.dueDate).toLocaleDateString()}</Text>}
    {data.link && (
      <Link href={data.link} style={{ color: "#2563eb", fontSize: "14px" }}>
        View invoice
      </Link>
    )}
  </BaseTemplate>
);

const CaseAssignmentTemplate = (data: CaseAssignmentData) => (
  <BaseTemplate preview={`Assigned to ${data.caseTitle}`}>
    <Heading as="h2">You were assigned</Heading>
    <Text style={baseStyles.text}>
      {data.assignedBy ? `${data.assignedBy} assigned you` : "You were assigned"} to <strong>{data.caseTitle}</strong> as {data.role}.
    </Text>
    {data.link && (
      <Link href={data.link} style={{ color: "#2563eb", fontSize: "14px" }}>
        Open matter dashboard
      </Link>
    )}
  </BaseTemplate>
);

const ClientPortalMessageTemplate = (data: ClientPortalMessageData) => (
  <BaseTemplate preview={`Portal message from ${data.clientName}`}>
    <Heading as="h2">Client portal message</Heading>
    <Text style={baseStyles.text}>
      {data.clientName} wrote:
    </Text>
    <Text style={{ ...baseStyles.text, fontStyle: "italic" }}>“{data.preview}”</Text>
    {data.link && (
      <Link href={data.link} style={{ color: "#2563eb", fontSize: "14px" }}>
        Reply in portal
      </Link>
    )}
  </BaseTemplate>
);

const SUBJECTS: Record<EmailTemplateType, (data: any) => string> = {
  DEADLINE_REMINDER: (data: DeadlineReminderData) => `Reminder: ${data.title} due ${new Date(data.dueDate).toLocaleDateString()}`,
  CASE_UPDATE: (data: CaseUpdateData) => `Case update · ${data.caseTitle}`,
  DOCUMENT_UPLOADED: (data: DocumentUploadedData) => `Document uploaded · ${data.documentTitle}`,
  INVOICE_SENT: (data: InvoiceSentData) => `Invoice ${data.invoiceNumber} sent`,
  NEW_CASE_ASSIGNMENT: (data: CaseAssignmentData) => `Assigned: ${data.caseTitle}`,
  CLIENT_PORTAL_MESSAGE: (data: ClientPortalMessageData) => `Portal message from ${data.clientName}`,
};

const COMPONENTS: Record<EmailTemplateType, (data: any) => JSX.Element> = {
  DEADLINE_REMINDER: DeadlineReminderTemplate,
  CASE_UPDATE: CaseUpdateTemplate,
  DOCUMENT_UPLOADED: DocumentUploadedTemplate,
  INVOICE_SENT: InvoiceSentTemplate,
  NEW_CASE_ASSIGNMENT: CaseAssignmentTemplate,
  CLIENT_PORTAL_MESSAGE: ClientPortalMessageTemplate,
};

const textBody = (template: EmailTemplateType, data: any) => {
  switch (template) {
    case "DEADLINE_REMINDER":
      return `Reminder: ${data.title} is due ${new Date(data.dueDate).toLocaleString()}${data.caseTitle ? ' for ' + data.caseTitle : ''}.`;
    case "CASE_UPDATE":
      return `${data.caseTitle}: ${data.update}`;
    case "DOCUMENT_UPLOADED":
      return `New document uploaded: ${data.documentTitle} by ${data.uploadedBy}.`;
    case "INVOICE_SENT":
      return `Invoice ${data.invoiceNumber} sent for ${data.amount}.`;
    case "NEW_CASE_ASSIGNMENT":
      return `You were assigned to ${data.caseTitle} as ${data.role}.`;
    case "CLIENT_PORTAL_MESSAGE":
      return `New portal message from ${data.clientName}: ${data.preview}`;
    default:
      return "Lexora notification";
  }
};

export const renderEmailTemplate = <T extends EmailTemplateType>(template: T, data: EmailTemplatePayloadMap[T]) => {
  const subject = SUBJECTS[template](data);
  const Component = COMPONENTS[template];
  const html = render(<Component {...data} />);
  return { subject, html, text: textBody(template, data) };
};
