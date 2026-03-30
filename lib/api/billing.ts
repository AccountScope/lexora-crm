import type { PoolClient } from "pg";
import { query, withDb } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";
import type {
  TimeEntry,
  TimeEntryTemplate,
  BillingDashboardMetrics,
  InvoiceSummary,
  InvoicePayment,
} from "@/types";
import type {
  BulkTimeEntryInput,
  TimeEntryInput,
  TimeEntryTemplateInput,
  CreateInvoiceInput,
  InvoiceLineItemInput,
} from "@/lib/api/validation";

interface TimeEntryFilters {
  clientId?: string;
  matterId?: string;
  status?: string;
  billable?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface TimeEntrySummary {
  billableHours: number;
  nonBillableHours: number;
  unbilledAmount: number;
}

const buildTimeEntryWhere = (filters: TimeEntryFilters = {}) => {
  const clauses: string[] = ["te.deleted_at IS NULL"];
  const params: any[] = [];

  if (filters.clientId) {
    params.push(filters.clientId);
    clauses.push(`te.client_id = $${params.length}`);
  }
  if (filters.matterId) {
    params.push(filters.matterId);
    clauses.push(`te.matter_id = $${params.length}`);
  }
  if (typeof filters.billable === "boolean") {
    params.push(filters.billable);
    clauses.push(`te.billable = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    clauses.push(`te.status = $${params.length}`);
  }
  if (filters.startDate) {
    params.push(filters.startDate);
    clauses.push(`te.work_date >= $${params.length}`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    clauses.push(`te.work_date <= $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    clauses.push(`(te.description ILIKE $${params.length} OR m.title ILIKE $${params.length})`);
  }

  return {
    clause: clauses.join(" AND "),
    params,
  };
};

export const listTimeEntries = async (filters: TimeEntryFilters = {}) => {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  const { clause, params } = buildTimeEntryWhere(filters);
  const limitIndex = params.length + 1;
  const offsetIndex = params.length + 2;

  const entriesResult = await query<TimeEntry & { total_count: number }>(
    `
    SELECT
      te.id,
      te.work_date as "workDate",
      te.description,
      te.hours::float as hours,
      te.hourly_rate::float as "hourlyRate",
      te.amount::float as amount,
      te.status,
      te.billable,
      te.started_at as "startedAt",
      te.ended_at as "endedAt",
      te.activity_code as "activityCode",
      te.notes,
      te.template_id as "templateId",
      te.invoice_id as "invoiceId",
      json_build_object(
        'id', c.id,
        'legalName', c.legal_name,
        'displayName', c.display_name,
        'status', c.status
      ) as client,
      json_build_object(
        'id', m.id,
        'title', m.title,
        'matterNumber', m.matter_number
      ) as matter,
      json_build_object(
        'id', u.id,
        'name', CONCAT(u.first_name, ' ', u.last_name),
        'email', u.email
      ) as "user",
      COUNT(*) OVER() as total_count
    FROM time_entries te
    INNER JOIN clients c ON c.id = te.client_id
    INNER JOIN matters m ON m.id = te.matter_id
    INNER JOIN users u ON u.id = te.user_id
    WHERE ${clause}
    ORDER BY te.work_date DESC, te.created_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `,
    [...params, limit, offset]
  );

  const summaryResult = await query<TimeEntrySummary>(
    `
    SELECT
      COALESCE(SUM(CASE WHEN te.billable THEN te.hours ELSE 0 END), 0)::float as "billableHours",
      COALESCE(SUM(CASE WHEN te.billable = false THEN te.hours ELSE 0 END), 0)::float as "nonBillableHours",
      COALESCE(SUM(CASE WHEN te.billable AND te.status = 'UNBILLED' THEN te.amount ELSE 0 END), 0)::float as "unbilledAmount"
    FROM time_entries te
    INNER JOIN matters m ON m.id = te.matter_id
    WHERE ${clause}
    `,
    params
  );

  const total = entriesResult.rows[0]?.total_count ?? 0;
  const entries = entriesResult.rows.map(({ total_count, ...row }) => row);

  return {
    entries,
    total,
    summary: summaryResult.rows[0] ?? { billableHours: 0, nonBillableHours: 0, unbilledAmount: 0 },
  };
};

export const listTimeEntryTemplates = async (userId: string): Promise<TimeEntryTemplate[]> => {
  const result = await query<TimeEntryTemplate>(
    `
    SELECT
      id,
      label,
      description,
      default_hours as "defaultHours",
      default_rate as "defaultRate",
      default_billable as "defaultBillable",
      default_activity_code as "defaultActivityCode",
      client_id as "clientId",
      matter_id as "matterId",
      owner_id as "ownerId"
    FROM time_entry_templates
    WHERE owner_id = $1 AND deleted_at IS NULL
    ORDER BY label ASC
    `,
    [userId]
  );
  return result.rows;
};

export const createTimeEntryTemplate = async (input: TimeEntryTemplateInput, ownerId: string) => {
  const insert = await query<TimeEntryTemplate>(
    `
    INSERT INTO time_entry_templates (
      owner_id,
      label,
      description,
      default_hours,
      default_rate,
      default_billable,
      default_activity_code,
      client_id,
      matter_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING
      id,
      label,
      description,
      default_hours as "defaultHours",
      default_rate as "defaultRate",
      default_billable as "defaultBillable",
      default_activity_code as "defaultActivityCode",
      client_id as "clientId",
      matter_id as "matterId",
      owner_id as "ownerId"
    `,
    [
      ownerId,
      input.label,
      input.description ?? null,
      input.defaultHours,
      input.defaultRate,
      input.defaultBillable,
      input.defaultActivityCode ?? null,
      input.clientId ?? null,
      input.matterId ?? null,
    ]
  );
  return insert.rows[0];
};

const resolveBillingRate = async (
  client: PoolClient,
  params: { userId: string; clientId: string; matterId?: string; workDate: string }
) => {
  const rate = await client.query<{ id: string; hourly_rate: number; discount_percent: number }>(
    `
    SELECT id, hourly_rate, COALESCE(discount_percent, 0) as discount_percent
    FROM billing_rates
    WHERE user_id = $1
      AND (client_id IS NULL OR client_id = $2)
      AND ($3::uuid IS NULL OR matter_id = $3)
      AND effective_from <= $4::date
      AND (effective_to IS NULL OR effective_to >= $4::date)
    ORDER BY (CASE WHEN matter_id = $3 THEN 0 ELSE 1 END), (CASE WHEN client_id = $2 THEN 0 ELSE 1 END), effective_from DESC
    LIMIT 1
    `,
    [params.userId, params.clientId, params.matterId ?? null, params.workDate]
  );

  if (!rate.rows[0]) {
    return { hourlyRate: 0, billingRateId: null };
  }
  const record = rate.rows[0];
  const discountedRate = Number(record.hourly_rate) * (1 - Number(record.discount_percent ?? 0) / 100);
  return { hourlyRate: discountedRate, billingRateId: record.id };
};

export const createTimeEntries = async (
  entries: TimeEntryInput[],
  userId: string,
  options?: { batchLabel?: string; organizationId?: string }
): Promise<string[]> => {
  if (!entries.length) {
    throw new ApiError(400, "No entries provided");
  }

  const ids = await withDb(async (client) => {
    let batchId: string | null = null;
    if (entries.length > 1 || options?.batchLabel) {
      const batchInsert = await client.query<{ id: string }>(
        `INSERT INTO time_entry_batches (user_id, label, total_entries) VALUES ($1,$2,$3) RETURNING id`,
        [userId, options?.batchLabel ?? "Bulk entry", entries.length]
      );
      batchId = batchInsert.rows[0].id;
    }

    const createdIds: string[] = [];

    for (const entry of entries) {
      let resolvedRate: { hourlyRate: number; billingRateId: string | null } | null = null;
      if (entry.hourlyRate === undefined || entry.hourlyRate === null) {
        resolvedRate = await resolveBillingRate(client, {
          userId,
          clientId: entry.clientId,
          matterId: entry.matterId,
          workDate: entry.workDate,
        });
      }

      const effectiveRate =
        entry.hourlyRate ?? resolvedRate?.hourlyRate ?? 0;
      const billingRateId = entry.hourlyRate ? null : resolvedRate?.billingRateId ?? null;

      const insert = await client.query<{ id: string }>(
        `
        INSERT INTO time_entries (
          matter_id,
          client_id,
          user_id,
          work_date,
          description,
          hours,
          hourly_rate,
          status,
          billable,
          template_id,
          activity_code,
          started_at,
          ended_at,
          notes,
          billing_rate_id,
          batch_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,'UNBILLED',$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING id
        `,
        [
          entry.matterId,
          entry.clientId,
          userId,
          entry.workDate,
          entry.description,
          entry.hours,
          effectiveRate,
          entry.billable ?? true,
          entry.templateId ?? null,
          entry.activityCode ?? null,
          entry.startedAt ?? null,
          entry.endedAt ?? null,
          entry.notes ?? null,
          billingRateId,
          batchId,
        ]
      );
      createdIds.push(insert.rows[0].id);
    }

    return createdIds;
  });

  return ids;
};

interface InvoiceFilters {
  organizationId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

const normalizePayments = (payments?: any[] | null): InvoicePayment[] =>
  (payments ?? []).map((payment) => ({
    id: payment.id,
    invoiceId: payment.invoiceId ?? payment.invoice_id,
    amount: Number(payment.amount ?? 0),
    paidOn: payment.paidOn ?? payment.paid_on,
    method: payment.method ?? null,
    reference: payment.reference ?? null,
  }));

const mapInvoiceRow = (row: any): InvoiceSummary => {
  const payments = normalizePayments(row.payments);
  const totalAmount = Number(row.totalAmount ?? 0);
  const paidSum = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const realizationRate = totalAmount ? (paidSum / totalAmount) * 100 : 0;

  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    client: row.client,
    matter: row.matter,
    status: row.status,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    subtotalAmount: Number(row.subtotalAmount ?? 0),
    taxAmount: Number(row.taxAmount ?? 0),
    totalAmount,
    balanceDue: Number(row.balanceDue ?? 0),
    realizationRate,
    payments,
  };
};

const fetchInvoiceById = async (invoiceId: string): Promise<InvoiceSummary> => {
  const result = await query(
    `
    SELECT
      i.id,
      i.invoice_number as "invoiceNumber",
      i.status,
      i.issue_date as "issueDate",
      i.due_date as "dueDate",
      i.subtotal_amount as "subtotalAmount",
      i.tax_amount as "taxAmount",
      i.total_amount as "totalAmount",
      i.balance_due as "balanceDue",
      json_build_object(
        'id', c.id,
        'legalName', c.legal_name,
        'displayName', c.display_name,
        'status', c.status
      ) as client,
      CASE WHEN m.id IS NULL THEN NULL ELSE json_build_object(
        'id', m.id,
        'title', m.title,
        'matterNumber', m.matter_number
      ) END as matter,
      COALESCE(
        (
          SELECT json_agg(json_build_object(
            'id', ip.id,
            'invoiceId', ip.invoice_id,
            'amount', ip.amount,
            'paidOn', ip.paid_on,
            'method', ip.method,
            'reference', ip.reference
          ) ORDER BY ip.paid_on DESC)
          FROM invoice_payments ip
          WHERE ip.invoice_id = i.id
        ), '[]'
      ) as payments
    FROM invoices i
    INNER JOIN clients c ON c.id = i.client_id
    LEFT JOIN matters m ON m.id = i.matter_id
    WHERE i.id = $1
    `,
    [invoiceId]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Invoice not found");
  }

  return mapInvoiceRow(result.rows[0]);
};

export const listInvoicesWithMetrics = async (filters: InvoiceFilters = {}) => {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  const invoicesResult = await query(
    `
    SELECT
      i.id,
      i.invoice_number as "invoiceNumber",
      i.status,
      i.issue_date as "issueDate",
      i.due_date as "dueDate",
      i.subtotal_amount as "subtotalAmount",
      i.tax_amount as "taxAmount",
      i.total_amount as "totalAmount",
      i.balance_due as "balanceDue",
      NULL as "realizationRate",
      json_build_object(
        'id', c.id,
        'legalName', c.legal_name,
        'displayName', c.display_name,
        'status', c.status
      ) as client,
      CASE WHEN m.id IS NULL THEN NULL ELSE json_build_object(
        'id', m.id,
        'title', m.title,
        'matterNumber', m.matter_number
      ) END as matter,
      COALESCE(
        (
          SELECT json_agg(json_build_object(
            'id', ip.id,
            'invoiceId', ip.invoice_id,
            'amount', ip.amount,
            'paidOn', ip.paid_on,
            'method', ip.method,
            'reference', ip.reference
          ) ORDER BY ip.paid_on DESC)
          FROM invoice_payments ip
          WHERE ip.invoice_id = i.id
        ), '[]'
      ) as payments,
      COUNT(*) OVER() as total_count
    FROM invoices i
    INNER JOIN clients c ON c.id = i.client_id
    LEFT JOIN matters m ON m.id = i.matter_id
    WHERE i.deleted_at IS NULL
      AND ($1::uuid IS NULL OR i.organization_id = $1)
      AND ($2::text IS NULL OR i.status = $2)
    ORDER BY i.issue_date DESC
    LIMIT $3 OFFSET $4
    `,
    [filters.organizationId ?? null, filters.status ?? null, limit, offset]
  );

  const invoices = invoicesResult.rows.map((row: any) => {
    const { total_count, ...rest } = row;
    return mapInvoiceRow(rest);
  });
  const total = invoicesResult.rows[0]?.total_count ?? 0;

  const [unbilledResult, revenueResult, paymentsResult, totalsResult] = await Promise.all([
    query(
      `
      SELECT
        c.id as client_id,
        COALESCE(c.display_name, c.legal_name) as client_name,
        te.matter_id,
        SUM(te.amount)::float as amount,
        SUM(te.hours)::float as hours
      FROM time_entries te
      INNER JOIN clients c ON c.id = te.client_id
      WHERE te.deleted_at IS NULL
        AND te.billable = true
        AND te.status = 'UNBILLED'
      GROUP BY c.id, c.display_name, c.legal_name, te.matter_id
      ORDER BY amount DESC
      LIMIT 10
      `
    ),
    query(
      `
      SELECT
        to_char(date_trunc('month', i.issue_date), 'YYYY-MM') as month,
        SUM(i.total_amount)::float as total
      FROM invoices i
      WHERE i.issue_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
      GROUP BY 1
      ORDER BY 1
      `
    ),
    query(
      `
      SELECT
        ip.id,
        ip.invoice_id as "invoiceId",
        ip.amount,
        ip.paid_on as "paidOn",
        ip.method,
        ip.reference
      FROM invoice_payments ip
      ORDER BY ip.paid_on DESC
      LIMIT 10
      `
    ),
    query(
      `
      SELECT
        COALESCE(SUM(total_amount), 0)::float as billed,
        COALESCE(SUM(balance_due) FILTER (WHERE status NOT IN ('PAID', 'VOID')), 0)::float as outstanding,
        COALESCE((SELECT SUM(amount) FROM invoice_payments), 0)::float as collected
      FROM invoices
      WHERE deleted_at IS NULL
      `
    ),
  ]);

  const billedAmount = Number(totalsResult.rows[0]?.billed ?? 0);
  const collectedAmount = Number(totalsResult.rows[0]?.collected ?? 0);
  const outstandingTotal = Number(totalsResult.rows[0]?.outstanding ?? 0);
  const realizationRate = billedAmount ? (collectedAmount / billedAmount) * 100 : 0;

  const metrics: BillingDashboardMetrics = {
    outstandingTotal,
    unbilledTimeByClient: unbilledResult.rows.map((row: any) => ({
      clientId: row.client_id,
      clientName: row.client_name,
      matterId: row.matter_id,
      amount: Number(row.amount ?? 0),
      hours: Number(row.hours ?? 0),
    })),
    monthlyRevenue: revenueResult.rows.map((row: any) => ({
      month: row.month,
      total: Number(row.total ?? 0),
    })),
    payments: paymentsResult.rows.map((row: any) => ({
      id: row.id,
      invoiceId: row.invoiceId,
      amount: Number(row.amount ?? 0),
      paidOn: row.paidOn,
      method: row.method,
      reference: row.reference,
    })),
    realizationRate,
    collectedAmount,
    billedAmount,
  };

  return { invoices, total, metrics };
};

const calculateLineAmount = (line: InvoiceLineItemInput) => {
  const base = line.quantity * line.unitPrice;
  const discountPortion = base * ((line.discountPercent ?? 0) / 100);
  const net = base - discountPortion;
  return { base, net, discount: discountPortion };
};

export const createInvoice = async (input: CreateInvoiceInput, userId: string, organizationId?: string) => {
  const lineCalcs = input.lineItems.map((line) => ({ line, ...calculateLineAmount(line) }));
  const lineTotal = lineCalcs.reduce((sum, item) => sum + item.net, 0);
  const invoiceDiscount = lineTotal * ((input.discountPercent ?? 0) / 100);
  const taxableBase = lineTotal - invoiceDiscount;
  const taxAmount = taxableBase * ((input.taxRate ?? 0) / 100);
  const totalAmount = taxableBase + taxAmount;

  const invoiceId = await withDb(async (client) => {
    const invoiceInsert = await client.query<{ id: string }>(
      `
      INSERT INTO invoices (
        organization_id,
        client_id,
        matter_id,
        status,
        issue_date,
        due_date,
        currency_code,
        subtotal_amount,
        tax_amount,
        total_amount,
        balance_due,
        notes,
        issued_by,
        tax_rate,
        discount_amount
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING id
      `,
      [
        organizationId,
        input.clientId,
        input.matterId ?? null,
        input.sendEmail ? "SENT" : "DRAFT",
        input.issueDate,
        input.dueDate ?? null,
        (input.currencyCode ?? "GBP").toUpperCase(),
        lineTotal,
        taxAmount,
        totalAmount,
        totalAmount,
        input.notes ?? null,
        userId,
        input.taxRate ?? 0,
        invoiceDiscount,
      ]
    );
    const createdInvoiceId = invoiceInsert.rows[0].id;

    for (const { line, net, discount } of lineCalcs) {
      await client.query(
        `
        INSERT INTO invoice_line_items (
          invoice_id,
          time_entry_id,
          description,
          quantity,
          unit_price,
          amount,
          discount_percent,
          discount_amount
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          createdInvoiceId,
          line.timeEntryId ?? null,
          line.description,
          line.quantity,
          line.unitPrice,
          net,
          line.discountPercent ?? 0,
          discount,
        ]
      );
      if (line.timeEntryId) {
        await client.query(`UPDATE time_entries SET status = 'INVOICED', invoice_id = $1 WHERE id = $2`, [createdInvoiceId, line.timeEntryId]);
      }
    }

    if (input.sendEmail && input.emailRecipients?.length) {
      await client.query(
        `INSERT INTO invoice_delivery_log (invoice_id, recipient_emails, status, sent_by) VALUES ($1,$2,$3,$4)`,
        [createdInvoiceId, input.emailRecipients, "QUEUED", userId]
      );
      await client.query(`UPDATE invoices SET last_sent_at = NOW(), last_sent_to = $1 WHERE id = $2`, [input.emailRecipients, createdInvoiceId]);
    }

    return createdInvoiceId;
  });

  return fetchInvoiceById(invoiceId);
};
