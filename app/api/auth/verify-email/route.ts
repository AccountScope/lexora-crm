import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import {
  getEmailVerificationStatus,
  resendVerificationEmail,
  upsertEmailVerificationToken,
  verifyEmailToken,
} from "@/lib/auth/email-verification";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const status = await getEmailVerificationStatus(user.id);
    return NextResponse.json({ data: status });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (error) {
      body = {};
    }
    const action = body?.action;
    if (!action) {
      throw new ApiError(400, "Missing action");
    }

    if (action === "verify") {
      const token = body?.token;
      await verifyEmailToken(token);
      return NextResponse.json({ data: { verified: true } });
    }

    const user = await requireUser(request);

    switch (action) {
      case "resend": {
        const result = await resendVerificationEmail(user.id);
        return NextResponse.json({ data: { email: result.email, expiresAt: result.expiresAt } });
      }
      case "issue": {
        const result = await upsertEmailVerificationToken(user.id);
        return NextResponse.json({ data: { email: result.email, expiresAt: result.expiresAt } });
      }
      default:
        throw new ApiError(400, `Unknown action: ${action}`);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
