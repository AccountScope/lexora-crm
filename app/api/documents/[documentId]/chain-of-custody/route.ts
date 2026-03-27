import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getChainOfCustody } from "@/lib/api/documents";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest, context: { params: { documentId: string } }) {
  try {
    await requireUser(request);
    const data = await getChainOfCustody(context.params.documentId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
