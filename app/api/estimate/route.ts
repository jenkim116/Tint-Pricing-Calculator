import { NextResponse } from "next/server";

/**
 * POST /api/estimate
 * Receives lead info + window/estimate payload. MVP: log only.
 *
 * Integration hooks (uncomment and configure as needed):
 * - Zapier: POST to your Zapier webhook URL with payload
 * - Make (Integromat): POST to Make webhook
 * - Google Sheets: use Google Sheets API or Zapier/Make to append row
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // MVP: log payload for debugging / manual follow-up
    console.log("[estimate] Lead submission:", JSON.stringify(body, null, 2));

    // Optional: persist to DB or file for MVP
    // await db.estimates.create({ data: body });

    // --- Zapier ---
    // const zapierWebhook = process.env.ZAPIER_ESTIMATE_WEBHOOK_URL;
    // if (zapierWebhook) {
    //   await fetch(zapierWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    // }

    // --- Make (Integromat) ---
    // const makeWebhook = process.env.MAKE_ESTIMATE_WEBHOOK_URL;
    // if (makeWebhook) {
    //   await fetch(makeWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    // }

    // --- Google Sheets (e.g. via Zapier/Make or Google Sheets API) ---
    // Append row: [name, email, phone, zip, notes, smsConsent, estimateLow, estimateHigh, windowCount, ...]

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[estimate] Error:", e);
    return NextResponse.json({ ok: false, error: "Submission failed" }, { status: 500 });
  }
}
