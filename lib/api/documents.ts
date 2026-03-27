import { query, withDb } from "@/lib/api/db";
import type { CustodyEvent, DocumentVersion, VaultDocument } from "@/types";
import type { DocumentUploadInput } from "@/lib/api/validation";
import { storageAdapter } from "@/lib/storage";
import { getStorageBucket } from "@/lib/storage/config";
import { sha256 } from "@/lib/storage/checksum";
import { ApiError } from "@/lib/api/errors";

interface UploadPayload extends DocumentUploadInput {
  fileName: string;
  buffer: Buffer;
  contentType?: string;
  uploadedBy: string;
}

const getDocumentById = async (id: string): Promise<VaultDocument | undefined> => {
  const result = await query<VaultDocument>(
    `SELECT
      d.id,
      d.matter_id as "matterId",
      d.client_id as "clientId",
      d.title,
      d.document_type as "documentType",
      d.status,
      d.tags,
      d.data_classification as "classification",
      json_build_object(
        'id', dv.id,
        'documentId', dv.document_id,
        'versionNumber', dv.version_number,
        'storageBucket', dv.storage_bucket,
        'storagePath', dv.storage_path,
        'fileSizeBytes', dv.file_size_bytes,
        'mimeType', dv.mime_type,
        'checksum', dv.checksum,
        'uploadedBy', dv.uploaded_by,
        'createdAt', dv.created_at,
        'notes', dv.notes
      ) as "latestVersion"
    FROM documents d
    LEFT JOIN document_versions dv ON dv.id = d.latest_version_id
    WHERE d.id = $1`,
    [id]
  );
  return result.rows[0];
};

export const listDocuments = async (params?: {
  matterId?: string;
  clientId?: string;
  search?: string;
  limit?: number;
}): Promise<VaultDocument[]> => {
  const { matterId, clientId, search } = params ?? {};
  const limit = params?.limit ?? 200;
  const result = await query<VaultDocument>(
    `SELECT
      d.id,
      d.matter_id as "matterId",
      d.client_id as "clientId",
      d.title,
      d.document_type as "documentType",
      d.status,
      d.tags,
      d.data_classification as "classification",
      json_build_object(
        'id', dv.id,
        'documentId', dv.document_id,
        'versionNumber', dv.version_number,
        'storageBucket', dv.storage_bucket,
        'storagePath', dv.storage_path,
        'fileSizeBytes', dv.file_size_bytes,
        'mimeType', dv.mime_type,
        'checksum', dv.checksum,
        'uploadedBy', dv.uploaded_by,
        'createdAt', dv.created_at,
        'notes', dv.notes
      ) as "latestVersion"
    FROM documents d
    LEFT JOIN document_versions dv ON dv.id = d.latest_version_id
    WHERE d.deleted_at IS NULL
      AND ($1::uuid IS NULL OR d.matter_id = $1)
      AND ($2::uuid IS NULL OR d.client_id = $2)
      AND (
        $3::text IS NULL
        OR d.title ILIKE '%' || $3 || '%'
        OR $3 = ANY(COALESCE(d.tags, ARRAY[]::text[]))
      )
    ORDER BY d.updated_at DESC
    LIMIT $4`,
    [matterId ?? null, clientId ?? null, search ?? null, limit]
  );
  return result.rows;
};

export const uploadDocument = async (payload: UploadPayload) => {
  if (!payload.buffer?.length) {
    throw new ApiError(400, "File buffer missing");
  }
  const checksum = sha256(payload.buffer);
  const objectPath = [payload.matterId ?? payload.clientId ?? "global", Date.now(), payload.fileName]
    .filter(Boolean)
    .join("/");

  await storageAdapter.upload(objectPath, payload.buffer, {
    contentType: payload.contentType,
    metadata: {
      matterId: payload.matterId ?? "",
      clientId: payload.clientId ?? "",
      classification: payload.classification,
    },
  });

  const documentId = await withDb(async (client) => {
    const doc = await client.query(
      `INSERT INTO documents (
        matter_id,
        client_id,
        title,
        document_type,
        status,
        tags,
        created_by,
        data_classification
      ) VALUES ($1,$2,$3,$4,'FINAL',$5,$6,$7)
      RETURNING id`,
      [
        payload.matterId ?? null,
        payload.clientId ?? null,
        payload.fileName,
        payload.documentType ?? "FILE",
        payload.tags ?? [],
        payload.uploadedBy,
        payload.classification,
      ]
    );

    const version = await client.query<DocumentVersion>(
      `INSERT INTO document_versions (
        document_id,
        version_number,
        storage_bucket,
        storage_path,
        file_size_bytes,
        mime_type,
        checksum,
        uploaded_by,
        notes,
        available_to_client
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        doc.rows[0].id,
        1,
        getStorageBucket(),
        objectPath,
        payload.buffer.length,
        payload.contentType ?? "application/octet-stream",
        checksum,
        payload.uploadedBy,
        null,
        payload.classification === "CLIENT_VISIBLE" || payload.classification === "CLIENT_DOWNLOADABLE",
      ]
    );

    await client.query(`UPDATE documents SET latest_version_id = $1 WHERE id = $2`, [
      version.rows[0].id,
      doc.rows[0].id,
    ]);

    await client.query(
      `INSERT INTO document_chain_of_custody (
        document_version_id,
        event_type,
        performed_by,
        previous_location,
        new_location,
        hash_verification,
        metadata
      ) VALUES ($1,'UPLOADED',$2,$3,$4,$5,$6)`
    , [
      version.rows[0].id,
      payload.uploadedBy,
      null,
      objectPath,
      checksum,
      { classification: payload.classification, tags: payload.tags ?? [] },
    ]);

    return doc.rows[0].id;
  });

  return getDocumentById(documentId);
};

export const getChainOfCustody = async (documentId: string): Promise<CustodyEvent[]> => {
  const result = await query<CustodyEvent>(
    `SELECT
      coc.id,
      coc.document_version_id as "documentVersionId",
      coc.event_type as "eventType",
      coc.occurred_at as "occurredAt",
      coc.performed_by::text as "performedBy",
      coc.metadata,
      coc.hash_verification as "hashVerification"
    FROM document_chain_of_custody coc
    INNER JOIN document_versions dv ON dv.id = coc.document_version_id
    WHERE dv.document_id = $1
    ORDER BY coc.occurred_at DESC`,
    [documentId]
  );
  return result.rows;
};
