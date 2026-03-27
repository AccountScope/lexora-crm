import { query } from "@/lib/api/db";
import type { ClientPortalCase } from "@/types";
import { ApiError } from "@/lib/api/errors";

export const listClientPortalCases = async (userId: string): Promise<ClientPortalCase[]> => {
  const result = await query(
    `WITH scoped_clients AS (
      SELECT c.id FROM clients c WHERE c.primary_contact_id = $1
    )
    SELECT
      m.id,
      m.client_id as "clientId",
      m.matter_number as "matterNumber",
      m.title,
      m.status,
      COALESCE(m.updated_at, m.created_at) as "lastUpdated",
      (
        SELECT COALESCE(json_agg(row_to_json(doc)), '[]'::json)
        FROM (
          SELECT
            d.id,
            d.client_id as "clientId",
            d.title,
            d.data_classification as classification,
            dv.storage_bucket as "storageBucket",
            dv.storage_path as "storagePath",
            dv.file_size_bytes as "fileSizeBytes",
            dv.mime_type as "mimeType",
            dv.created_at as "createdAt"
          FROM documents d
          LEFT JOIN document_versions dv ON dv.id = d.latest_version_id
          WHERE d.matter_id = m.id
            AND d.data_classification IN ('CLIENT_VISIBLE', 'CLIENT_DOWNLOADABLE')
            AND d.deleted_at IS NULL
        ) doc
      ) as documents,
      (
        SELECT COALESCE(json_agg(row_to_json(event)), '[]'::json)
        FROM (
          SELECT
            d.id,
            d.created_at as "occurredAt",
            d.notes as description,
            'note' as category,
            CONCAT(u.first_name, ' ', u.last_name) as actor
          FROM documents d
          LEFT JOIN users u ON u.id = d.created_by
          WHERE d.matter_id = m.id
            AND d.document_type = 'CASE_NOTE'
            AND d.data_classification IN ('CLIENT_VISIBLE', 'CLIENT_DOWNLOADABLE')
          ORDER BY d.created_at DESC
          LIMIT 20
        ) event
      ) as updates
    FROM matters m
    WHERE m.client_id IN (SELECT id FROM scoped_clients)
    ORDER BY m.updated_at DESC NULLS LAST
    LIMIT 100`,
    [userId]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    clientId: row.clientId,
    title: row.title,
    matterNumber: row.matterNumber,
    status: row.status,
    lastUpdated: row.lastUpdated,
    permittedDocuments: row.documents ?? [],
    updates: row.updates ?? [],
  }));
};

export const listPortalMessages = async (params: {
  matterId: string;
  clientId: string;
}): Promise<
  Array<{ id: string; body: string | null; direction: "inbound" | "outbound"; createdAt: string; authorName?: string }>
> => {
  const result = await query(
    `SELECT
      d.id,
      d.notes as body,
      CASE WHEN d.data_classification IN ('CLIENT_VISIBLE','CLIENT_DOWNLOADABLE') THEN 'outbound' ELSE 'inbound' END as direction,
      d.created_at as "createdAt",
      CONCAT(u.first_name, ' ', u.last_name) as "authorName"
    FROM documents d
    LEFT JOIN users u ON u.id = d.created_by
    WHERE d.matter_id = $1
      AND d.client_id = $2
      AND d.document_type = 'PORTAL_MESSAGE'
      AND d.deleted_at IS NULL
    ORDER BY d.created_at DESC
    LIMIT 200`,
    [params.matterId, params.clientId]
  );
  return result.rows;
};

export const createPortalMessage = async (params: {
  matterId: string;
  clientId: string;
  body: string;
  authorId: string;
  direction: "inbound" | "outbound";
}) => {
  if (!params.body?.trim()) {
    throw new ApiError(400, "Message body required");
  }

  await query(
    `INSERT INTO documents (
      matter_id,
      client_id,
      title,
      document_type,
      status,
      tags,
      created_by,
      data_classification,
      notes
    ) VALUES ($1,$2,$3,'PORTAL_MESSAGE','DRAFT',$4,$5,$6,$7)`,
    [
      params.matterId,
      params.clientId,
      params.body.slice(0, 40),
      ['portal', params.direction],
      params.authorId,
      params.direction === 'outbound' ? 'CLIENT_VISIBLE' : 'RESTRICTED',
      params.body,
    ]
  );

  return listPortalMessages({ matterId: params.matterId, clientId: params.clientId });
};
