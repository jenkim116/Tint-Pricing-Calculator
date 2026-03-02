/**
 * Google Apps Script — paste this into your Google Sheet.
 *
 * 1. Open your Sheet → Extensions → Apps Script.
 * 2. Replace any code in Code.gs with this script.
 * 3. Deploy: Deploy → New deployment → Type: Web app.
 *    - Description: "Lead form webhook"
 *    - Execute as: Me
 *    - Who has access: Anyone (so your Next.js app can POST)
 * 4. Authorize when prompted, then copy the Web app URL.
 * 5. In your app, set env: GOOGLE_APPS_SCRIPT_WEBHOOK_URL=<that URL>
 *
 * 6. One-time: Open that exact URL in your browser. Sign in with the Google
 *    account that owns the script and approve access. After that, server
 *    POSTs from your app will work. If you skip this, you may get "unexpected
 *    response" until the script is authorized once.
 *
 * If you get "Sheet update failed": ensure "Who has access" is set to "Anyone".
 * Redeploy after changing it.
 *
 * Your Sheet will receive a header row and then one row per submission.
 * Columns: Timestamp, Name, Email, Phone, Zip, Notes, SMS Consent, Project Type, Estimate Low, Estimate High, Window Count
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, message: "Use POST" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};

    const lead = body.lead || {};
    const estimate = body.estimate || null;
    const windows = Array.isArray(body.windows) ? body.windows : [];

    const row = [
      new Date().toISOString(),
      lead.name || "",
      lead.email || "",
      lead.phone || "",
      lead.zipCode || "",
      lead.notes || "",
      lead.smsConsent ? "Yes" : "No",
      body.projectType || "",
      estimate && estimate.low != null ? estimate.low : "",
      estimate && estimate.high != null ? estimate.high : "",
      windows.length,
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.toString() })
    )
      .setMimeType(ContentService.MimeType.JSON);
  }
}
