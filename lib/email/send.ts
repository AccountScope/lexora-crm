import { Resend } from "resend";
import { query, withDb } from "@/lib/api/db";
import { renderEmailTemplate, type EmailTemplateType, type EmailTemplatePayloadMap } from "@/lib/email/templates";
import type { DeadlineRecord } from "@/types";

const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;
const fromAddress = process.env.NOTIFICATIONS_FROM ?? "Lexora <notifications@lexora.app>";

interface SendPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: SendPayload) => {
  if (!resendClient) {
    console.warn(`[email] RESEND_API_KEY missing. Would send to ${to}: ${subject}`);
    return;
  }
  await resendClient.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
    text,
  });
};

interface QueueJobPayload<T extends EmailTemplateType> {
  template: T;
  to: string;
  data: EmailTemplatePayloadMap[T];
  scheduledFor?: Date;
  userId?: string | null;
  deadlineId?: string | null;
}

export const queueEmailJob = async <T extends EmailTemplateType>(payload: QueueJobPayload<T>) => {
  if (!payload.to) return;
  const { subject, html, text } = renderEmailTemplate(payload.template, payload.data);
  await query(
    `INSERT INTO email_queue (
      notification_type,
      to_email,
      subject,
      body,
      payload,
      scheduled_for,
      user_id,
      deadline_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      payload.template,
      payload.to,
      subject,
      html,
      JSON.stringify({ template: payload.template, data: payload.data, text }),
      (payload.scheduledFor ?? new Date()).toISOString(),
      payload.userId ?? null,
      payload.deadlineId ?? null,
    ]
  );
};

export const processEmailQueue = async (limit = 20) => {
  await withDb(async (client) => {
    const jobs = await client.query(
      `SELECT * FROM email_queue
       WHERE status IN ('pending', 'retry')
         AND scheduled_for <= NOW()
       ORDER BY scheduled_for ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [limit]
    );

    for (const job of jobs.rows) {
      const payload = typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload ?? {};
      try {
        await sendEmail({
          to: job.to_email,
          subject: job.subject,
          html: job.body,
          text: payload?.text,
        });
        await client.query(
          `UPDATE email_queue SET status = 'sent', attempts = attempts + 1, sent_at = NOW(), updated_at = NOW(), last_error = NULL WHERE id = $1`,
          [job.id]
        );
        await client.query(
          `INSERT INTO email_logs (queue_id, notification_type, to_email, subject, body, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
          [job.id, job.notification_type, job.to_email, job.subject, job.body, "sent"]
        );
      } catch (error: any) {
        const attempts = Number(job.attempts ?? 0) + 1;
        const status = attempts >= Number(job.max_attempts ?? 5) ? "failed" : "retry";
        const message = error?.message ?? "send_failed";
        await client.query(
          `UPDATE email_queue SET attempts = $2, status = $3, last_error = $4, updated_at = NOW() WHERE id = $1`,
          [job.id, attempts, status, message.slice(0, 250)]
        );
        await client.query(
          `INSERT INTO email_logs (queue_id, notification_type, to_email, subject, body, status, error, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
          [job.id, job.notification_type, job.to_email, job.subject, job.body, status, message]
        );
      }
    }
  });
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const scheduleDeadlineReminderEmails = async (
  deadline: DeadlineRecord,
  options: { rescheduleOnly?: boolean } = {}
) => {
  const email = deadline.assignee?.email;
  if (!email) return;
  if (options.rescheduleOnly) {
    await query(
      `DELETE FROM email_queue WHERE deadline_id = $1 AND notification_type = 'DEADLINE_REMINDER' AND status IN ('pending','retry')`,
      [deadline.id]
    );
  }
  const dueDate = new Date(deadline.dueDate);
  const reminders = (deadline.reminderOffsets?.length ? deadline.reminderOffsets : [7, 3, 1]).map((days) => {
    const scheduled = new Date(dueDate.getTime() - days * DAY_IN_MS);
    return { scheduled, days };
  });
  const now = Date.now();
  await Promise.all(
    reminders
      .filter(({ scheduled }) => scheduled.getTime() > now)
      .map(({ scheduled, days }) =>
        queueEmailJob({
          template: "DEADLINE_REMINDER",
          to: email,
          userId: deadline.assignee?.id,
          deadlineId: deadline.id,
          scheduledFor: scheduled,
          data: {
            title: deadline.title,
            dueDate: deadline.dueDate,
            priority: deadline.priority,
            caseTitle: deadline.case?.title,
            assignedName: deadline.assignee?.name,
            notes: days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} remaining`,
          },
        })
      )
  );
};
