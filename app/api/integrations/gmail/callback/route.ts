import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeGmailCode } from "@/lib/integrations/gmail";

/**
 * Gmail OAuth Callback
 * 
 * Called by Google after user authorizes Gmail access
 * 
 * Flow:
 * 1. User clicks "Connect Gmail" in settings
 * 2. Redirected to Google OAuth consent screen
 * 3. User approves
 * 4. Google redirects here with authorization code
 * 5. We exchange code for tokens
 * 6. Store tokens in database
 * 7. Redirect back to settings with success message
 */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle user denial
    if (error === "access_denied") {
      return NextResponse.redirect(
        new URL(
          "/settings/integrations?error=gmail_denied",
          req.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/settings/integrations?error=missing_code",
          req.url
        )
      );
    }

    // Verify state to prevent CSRF
    // In production: validate state matches session
    // For now: just check it exists
    if (!state) {
      return NextResponse.redirect(
        new URL(
          "/settings/integrations?error=invalid_state",
          req.url
        )
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", req.url)
      );
    }

    // Exchange code for tokens
    const redirectUri = `${url.origin}/api/integrations/gmail/callback`;
    const tokens = await exchangeGmailCode(code, redirectUri);

    // Store in database
    const { error: insertError } = await supabase
      .from("email_integrations")
      .upsert(
        {
          user_id: user.id,
          provider: "gmail",
          email_address: tokens.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(tokens.expiry_date).toISOString(),
          enabled: true,
          last_synced_at: null,
          sync_errors: 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,provider,email_address",
        }
      );

    if (insertError) {
      console.error("Failed to store Gmail tokens:", insertError);
      return NextResponse.redirect(
        new URL(
          "/settings/integrations?error=storage_failed",
          req.url
        )
      );
    }

    // Success! Redirect to settings
    return NextResponse.redirect(
      new URL(
        "/settings/integrations?success=gmail_connected",
        req.url
      )
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/settings/integrations?error=callback_failed",
        req.url
      )
    );
  }
}
