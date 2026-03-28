import * as React from "react";
import { Body, Container, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";
import { render } from "@react-email/render";

export type EmailTemplateType =
  | "DEADLINE_REMINDER"
  | "CASE_UPDATE"
  | "DOCUMENT_UPLOADED"
  | "INVOICE_SENT"
  | "NEW_CASE_ASSIGNMENT"
  | "CLIENT_PORTAL_MESSAGE"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGED"
  | "EMAIL_VERIFICATION"
  | "TWO_FACTOR_RECOVERY"
  | "USER_INVITATION";

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

export interface UserInvitationEmailData {
  invitationUrl: string;
  roleName: string;
  invitedBy?: string;
  expiresAt: string;
  customMessage?: string;
}

export interface PasswordResetEmailData {
  firstName?: string;
  resetUrl: string;
  expiresInMinutes: number;
  supportEmail?: string;
}

export interface PasswordChangedEmailData {
  firstName?: string;
  changedAt: string;
  device?: string | null;
  location?: string | null;
  ipAddress?: string | null;
  nextStepsUrl?: string;
}

export interface EmailVerificationData {
  email: string;
  verifyUrl: string;
  expiresAt: string;
}

export interface TwoFactorRecoveryData {
  email: string;
  recoverUrl: string;
  expiresAt: string;
}

export type EmailTemplatePayloadMap = {
  DEADLINE_REMINDER: DeadlineReminderData;
  CASE_UPDATE: CaseUpdateData;
  DOCUMENT_UPLOADED: DocumentUploadedData;
  INVOICE_SENT: InvoiceSentData;
  NEW_CASE_ASSIGNMENT: CaseAssignmentData;
  CLIENT_PORTAL_MESSAGE: ClientPortalMessageData;
  USER_INVITATION: UserInvitationEmailData;
  PASSWORD_RESET: PasswordResetEmailData;
  PASSWORD_CHANGED: PasswordChangedEmailData;
  EMAIL_VERIFICATION: EmailVerificationData;
  TWO_FACTOR_RECOVERY: TwoFactorRecoveryData;
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

const UserInvitationTemplate = (data: UserInvitationEmailData) => (
  <BaseTemplate preview="You're invited to Lexora">
    <Heading as="h2">You've been invited</Heading>
    <Text style={baseStyles.text}>You were invited to join Lexora as <strong>{data.roleName}</strong>{data.invitedBy ? ` by ${data.invitedBy}` : ''}.</Text>
    <Text style={baseStyles.text}>This secure link expires {new Date(data.expiresAt).toLocaleString()}.</Text>
    {data.customMessage ? (
      <Text style={{ ...baseStyles.text, fontStyle: 'italic' }}>“{data.customMessage}”</Text>
    ) : null}
    <Link href={data.invitationUrl} style={{ color: '#2563eb', fontSize: '14px' }}>
      Set up your account ↗
    </Link>
  </BaseTemplate>
);

const PasswordResetTemplate = (data: PasswordResetEmailData) => (
  <BaseTemplate preview="Reset your Lexora password">
    <Heading as="h2">Reset your password</Heading>
    <Text style={baseStyles.text}>
      {data.firstName ? `${data.firstName}, ` : ""}we received a request to reset your Lexora password.
      This link stays valid for {data.expiresInMinutes} minutes.
    </Text>
    <Link href={data.resetUrl} style={{ color: "#2563eb", fontSize: "14px" }}>
      Create a new password ↗
    </Link>
    <Text style={baseStyles.text}>
      Didn't request this? Safely ignore this email, or contact security at {data.supportEmail ?? "security@lexora.app"}.
    </Text>
  </BaseTemplate>
);

const PasswordChangedTemplate = (data: PasswordChangedEmailData) => (
  <BaseTemplate preview="Your Lexora password was changed">
    <Heading as="h2">Password changed</Heading>
    <Text style={baseStyles.text}>
      {data.firstName ? `${data.firstName}, ` : ""}we noticed your Lexora password was updated on {new Date(data.changedAt).toLocaleString()}.
    </Text>
    {(data.device || data.location || data.ipAddress) && (
      <Text style={baseStyles.text}>
        {data.device ? `Device: ${data.device}. ` : ""}
        {data.location ? `Location: ${data.location}. ` : ""}
        {data.ipAddress ? `IP: ${data.ipAddress}.` : ""}
      </Text>
    )}
    {data.nextStepsUrl && (
      <Link href={data.nextStepsUrl} style={{ color: "#2563eb", fontSize: "14px" }}>
        Secure your account
      </Link>
    )}
    <Text style={baseStyles.muted}>If this wasn't you, reset your password immediately.</Text>
  </BaseTemplate>
);

const EmailVerificationTemplate = (data: EmailVerificationData) => (
  <BaseTemplate preview="Verify your Lexora account">
    <Heading as="h2">Confirm your email</Heading>
    <Text style={baseStyles.text}>You're almost set. Click the secure link below to verify {data.email}.</Text>
    <Link href={data.verifyUrl} style={{ color: "#2563eb", fontSize: "14px" }}>
      Verify email address ↗
    </Link>
    <Text style={baseStyles.text}>This link expires {new Date(data.expiresAt).toLocaleString()}.</Text>
  </BaseTemplate>
);

const TwoFactorRecoveryTemplate = (data: TwoFactorRecoveryData) => (
  <BaseTemplate preview="Recover access to Lexora">
    <Heading as="h2">2FA recovery link</Heading>
    <Text style={baseStyles.text}>
      Someone requested a two-factor reset for {data.email}. If this was you, use the link below to regain access.
    </Text>
    <Link href={data.recoverUrl} style={{ color: "#2563eb", fontSize: "14px" }}>
      Disable 2FA temporarily ↗
    </Link>
    <Text style={baseStyles.text}>The link expires {new Date(data.expiresAt).toLocaleString()}.</Text>
    <Text style={baseStyles.muted}>Ignore this email if you still have access — no changes were made.</Text>
  </BaseTemplate>
);

const SUBJECTS: Record<EmailTemplateType, (data: any) => string> = {
  DEADLINE_REMINDER: (data: DeadlineReminderData) => `Reminder: ${data.title} due ${new Date(data.dueDate).toLocaleDateString()}`,
  CASE_UPDATE: (data: CaseUpdateData) => `Case update · ${data.caseTitle}`,
  DOCUMENT_UPLOADED: (data: DocumentUploadedData) => `Document uploaded · ${data.documentTitle}`,
  INVOICE_SENT: (data: InvoiceSentData) => `Invoice ${data.invoiceNumber} sent`,
  NEW_CASE_ASSIGNMENT: (data: CaseAssignmentData) => `Assigned: ${data.caseTitle}`,
  CLIENT_PORTAL_MESSAGE: (data: ClientPortalMessageData) => `Portal message from ${data.clientName}`,
  PASSWORD_RESET: () => "Reset your Lexora password",
  PASSWORD_CHANGED: () => "Your Lexora password was changed",
  EMAIL_VERIFICATION: () => "Verify your Lexora account",
  TWO_FACTOR_RECOVERY: () => "Lexora 2FA recovery link",
  USER_INVITATION: (data: UserInvitationEmailData) => `You're invited to Lexora (${data.roleName})`,
};

const COMPONENTS: Record<EmailTemplateType, (data: any) => JSX.Element> = {
  DEADLINE_REMINDER: DeadlineReminderTemplate,
  CASE_UPDATE: CaseUpdateTemplate,
  DOCUMENT_UPLOADED: DocumentUploadedTemplate,
  INVOICE_SENT: InvoiceSentTemplate,
  NEW_CASE_ASSIGNMENT: CaseAssignmentTemplate,
  CLIENT_PORTAL_MESSAGE: ClientPortalMessageTemplate,
  PASSWORD_RESET: PasswordResetTemplate,
  PASSWORD_CHANGED: PasswordChangedTemplate,
  EMAIL_VERIFICATION: EmailVerificationTemplate,
  TWO_FACTOR_RECOVERY: TwoFactorRecoveryTemplate,
  USER_INVITATION: UserInvitationTemplate,
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
    case "PASSWORD_RESET":
      return `Reset your Lexora password using ${data.resetUrl}. Link expires in ${data.expiresInMinutes} minutes.`;
    case "PASSWORD_CHANGED":
      return `Your Lexora password changed on ${new Date(data.changedAt).toLocaleString()}. If this wasn't you, reset it immediately.`;
    case "EMAIL_VERIFICATION":
      return `Verify your Lexora account by visiting ${data.verifyUrl}. Link expires ${new Date(data.expiresAt).toLocaleString()}.`;
    case "TWO_FACTOR_RECOVERY":
      return `Use ${data.recoverUrl} to recover your Lexora account before ${new Date(data.expiresAt).toLocaleString()}.`;
    case "USER_INVITATION":
      return `You're invited to Lexora as ${data.roleName}. Complete setup at ${data.invitationUrl} before ${new Date(data.expiresAt).toLocaleString()}.`;
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
