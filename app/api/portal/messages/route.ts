import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { createPortalMessage, listPortalMessages } from "@/lib/api/portal";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const matterId = searchParams.get("matterId");
    const clientId = searchParams.get("clientId");
    if (!matterId || !clientId) {
      throw new Error("matterId and clientId required");
    }
    const data = await listPortalMessages({ matterId, clientId });
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { matterId, clientId, message, direction } = body ?? {};
    if (!matterId || !clientId || !message) {
      throw new Error("matterId, clientId, and message required");
    }
    const data = await createPortalMessage({
      matterId,
      clientId,
      body: message,
      authorId: user.id,
      direction: direction === "outbound" ? "outbound" : "inbound",
    });
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
