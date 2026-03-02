import { NextResponse } from "next/server";
import { google } from "googleapis";

/**
 * POST /api/estimate
 * Receives lead info + window/estimate payload.
 *
 * Sends to Google Sheet via either:
 * A) GOOGLE_APPS_SCRIPT_WEBHOOK_URL — no service account key (use when org blocks keys)
 * B) GOOGLE_SHEET_ID + GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY — Sheets API
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("[estimate] Lead submission:", JSON.stringify(body, null, 2));

    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    const hasAppsScript = !!appsScriptUrl?.trim();
    const hasSheetsApi = !!(sheetId?.trim() && clientEmail?.trim() && privateKey?.trim());
    if (!hasAppsScript && !hasSheetsApi) {
      console.warn(
        "[estimate] No Google config. Set GOOGLE_APPS_SCRIPT_WEBHOOK_URL or GOOGLE_SHEET_ID + GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY in .env.local and restart the server."
      );
    }

    if (hasAppsScript) {
      const payload = JSON.stringify(body);
      const url = appsScriptUrl!.trim();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        redirect: "manual",
      });
      const rawText = await res.text();
      // 302 from Google usually means the script ran; don't follow (would cause 405) or retry (would duplicate the row).
      if (res.status >= 300 && res.status < 400) {
        let result: { ok?: boolean } = {};
        try {
          result = JSON.parse(rawText);
        } catch {
          /* body may be empty or HTML */
        }
        if (result.ok) {
          console.log("[estimate] Row appended via Apps Script (302).");
          return NextResponse.json({ ok: true });
        }
        console.log("[estimate] Apps Script returned", res.status, "- assuming script ran once.");
        return NextResponse.json({ ok: true });
      }
      let result: { ok?: boolean; error?: string } = {};
      try {
        result = JSON.parse(rawText);
      } catch {
        console.error("[estimate] Apps Script non-JSON response:", res.status, rawText.slice(0, 500));
        const isAuthPage =
          /sign in|accounts\.google|authorize|consent|access denied/i.test(rawText) ||
          rawText.trimStart().toLowerCase().startsWith("<!DOCTYPE") ||
          rawText.includes("<html");
        const errorMessage = isAuthPage
          ? "One-time setup: Open your Apps Script web app URL in a browser (the same URL in .env.local), sign in with the Google account that owns the script, and approve access. Then try submitting again."
          : "Sheet app returned an unexpected response. Check that the web app URL is correct and that the deployment is set to \"Anyone\" (and try redeploying).";
        return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
      }
      if (!res.ok || !result.ok) {
        console.error("[estimate] Apps Script error:", res.status, result);
        const message =
          result.error ||
          (res.status === 401 || res.status === 403
            ? "Sheet app access denied. Redeploy the web app and set \"Who has access\" to Anyone."
            : res.status === 404
              ? "Sheet app URL not found. Check GOOGLE_APPS_SCRIPT_WEBHOOK_URL in .env.local."
              : "Sheet update failed.");
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
      }
      console.log("[estimate] Row appended via Apps Script.");
    } else if (hasSheetsApi) {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail!,
          private_key: (privateKey ?? "").replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      const sheets = google.sheets({ version: "v4", auth });

      const lead = body.lead ?? {};
      const estimate = body.estimate ?? null;
      const windows = Array.isArray(body.windows) ? body.windows : [];
      const row = [
        new Date().toISOString(),
        lead.name ?? "",
        lead.email ?? "",
        lead.phone ?? "",
        lead.zipCode ?? "",
        lead.notes ?? "",
        lead.smsConsent ? "Yes" : "No",
        body.projectType ?? "",
        estimate?.low ?? "",
        estimate?.high ?? "",
        windows.length,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Sheet1!A:K",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] },
      });
      console.log("[estimate] Row appended via Sheets API.");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[estimate] Error:", e);
    return NextResponse.json({ ok: false, error: "Submission failed" }, { status: 500 });
  }
}
