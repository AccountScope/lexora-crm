import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrganizationContext } from "@/lib/api/tenant";
import { listDocuments } from "@/lib/api/documents";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const context = await getOrganizationContext(user.id); // SECURITY FIX
    
    const { searchParams } = new URL(request.url);
    const matterId = searchParams.get("matterId") ?? undefined;
    const clientId = searchParams.get("clientId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    
    const data = await listDocuments({ 
      organizationId: context.organizationId, // SECURITY FIX: Enforced by RLS
      matterId: matterId ?? undefined, 
      clientId, 
      search 
    });
    
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
