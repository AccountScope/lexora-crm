/**
 * Multi-Tenant Organization Context
 * 
 * This module provides tenant isolation utilities to ensure all database
 * queries are scoped to the user's organization.
 * 
 * CRITICAL SECURITY: All API routes MUST use these helpers to prevent
 * data leakage between firms.
 */

import { query } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";

export interface OrganizationContext {
  organizationId: string;
  userId: string;
  role: string;
}

/**
 * Get the organization context for the current authenticated user.
 * This MUST be called at the start of every API route that accesses tenant data.
 * 
 * @param userId - The authenticated user's ID (from requireUser)
 * @returns Organization context with organizationId, userId, and role
 * @throws ApiError if user has no organization assigned
 */
export async function getOrganizationContext(userId: string): Promise<OrganizationContext> {
  const result = await query<{ organization_id: string; role: string }>(
    `
    SELECT 
      organization_id,
      role
    FROM profiles
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  const profile = result.rows[0];

  if (!profile?.organization_id) {
    throw new ApiError(
      403,
      "User is not assigned to an organization. Please contact your administrator."
    );
  }

  return {
    organizationId: profile.organization_id,
    userId,
    role: profile.role || 'member',
  };
}

/**
 * Verify that a user has permission to access a specific organization.
 * Use this when a route accepts an explicit organizationId parameter.
 * 
 * @param userId - The authenticated user's ID
 * @param organizationId - The organization ID being accessed
 * @throws ApiError if user does not belong to that organization
 */
export async function verifyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<void> {
  const result = await query<{ exists: boolean }>(
    `
    SELECT EXISTS(
      SELECT 1 
      FROM profiles 
      WHERE id = $1 AND organization_id = $2
    ) as exists
    `,
    [userId, organizationId]
  );

  if (!result.rows[0]?.exists) {
    throw new ApiError(
      403,
      "You do not have access to this organization."
    );
  }
}

/**
 * Add organization_id filter to WHERE clauses.
 * Helper to ensure consistent tenant filtering.
 * 
 * @param organizationId - The organization ID to filter by
 * @param tableAlias - Optional table alias (e.g., 'm' for 'matters m')
 * @returns SQL WHERE clause fragment and parameter
 */
export function organizationFilter(
  organizationId: string,
  tableAlias?: string
): { clause: string; param: string } {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  return {
    clause: `${prefix}organization_id = $`,
    param: organizationId,
  };
}

/**
 * Ensure a record belongs to the user's organization.
 * Use this for detail/update/delete operations.
 * 
 * @param tableName - The table to check (e.g., 'matters', 'clients')
 * @param recordId - The record ID to verify
 * @param organizationId - The user's organization ID
 * @throws ApiError if record doesn't exist or doesn't belong to organization
 */
export async function verifyRecordOwnership(
  tableName: string,
  recordId: string,
  organizationId: string
): Promise<void> {
  const result = await query<{ exists: boolean }>(
    `
    SELECT EXISTS(
      SELECT 1 
      FROM ${tableName}
      WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
    ) as exists
    `,
    [recordId, organizationId]
  );

  if (!result.rows[0]?.exists) {
    throw new ApiError(
      404,
      `${tableName} not found or you don't have access to it.`
    );
  }
}

/**
 * Check if user has a specific role in their organization.
 * 
 * @param context - Organization context from getOrganizationContext
 * @param allowedRoles - Array of roles that are allowed
 * @throws ApiError if user doesn't have required role
 */
export function requireRole(
  context: OrganizationContext,
  allowedRoles: string[]
): void {
  if (!allowedRoles.includes(context.role)) {
    throw new ApiError(
      403,
      `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
    );
  }
}

/**
 * Check if user is an admin or owner of their organization.
 * 
 * @param context - Organization context from getOrganizationContext
 * @throws ApiError if user is not an admin/owner
 */
export function requireAdmin(context: OrganizationContext): void {
  requireRole(context, ['owner', 'admin']);
}
