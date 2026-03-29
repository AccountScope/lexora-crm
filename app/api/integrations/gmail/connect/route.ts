import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailAuthUrl } from "@/lib/integrations/gmail";

/**
 * Initiate Gmail OAuth Flow
 * 
 * GET /api/integrations/gmail/connect
 * 
 * Returns: { authUrl: "https://accounts.google.com/o/oauth2/v2/auth?..." }
 * 
 * Frontend redirects user to authUrl
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate OAuth URL
    const url = new URL(req.url);
    const redirectUri = `${url.origin}/api/integrations/gmail/callback`;
    
    // Generate state token (in production: store in session)
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString("base64");

    const authUrl = getGmailAuthUrl(redirectUri, state);

    return NextResponse.json({
      authUrl,
      provider: "gmail",
    });
  } catch (error) {
    console.error("Gmail connect error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
