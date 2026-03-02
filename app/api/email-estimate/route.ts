import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, pdfBase64 } = body as { email?: string; pdfBase64?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return NextResponse.json({ error: "PDF content is required." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Email service is not configured. Add RESEND_API_KEY to your .env.local file (get a free API key at https://resend.com). Restart the dev server after adding it. You can use the Download PDF button in the meantime.",
        },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);
    const from = process.env.ESTIMATE_EMAIL_FROM || "Vizta Tint <onboarding@resend.dev>";
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const { error } = await resend.emails.send({
      from,
      to: [trimmed],
      subject: "Your Window Film Estimate – Vizta Tint of North Jersey",
      html: `
        <p>Please find your window film estimate attached.</p>
        <p>If you have questions or would like to schedule an assessment, reply to this email or contact us:</p>
        <p>Phone: <a href="tel:973-313-5313">973-313-5313</a><br/>
        Email: <a href="mailto:nj@viztatint.com">nj@viztatint.com</a><br/>
        Web: <a href="https://www.viztatintnj.com">www.viztatintnj.com</a></p>
        <p>— Vizta Tint of North Jersey</p>
      `,
      attachments: [
        {
          filename: "vizta-tint-estimate.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[email-estimate] Resend error:", error);
      const msg = error.message || "";
      const isDomainLimit =
        /only send.*to your own|verify a domain|verify your domain/i.test(msg);
      const userMessage = isDomainLimit
        ? "With Resend's free tier, you can only send to your Resend account email until you verify a domain at resend.com/domains and set ESTIMATE_EMAIL_FROM to use that domain. Use the Download PDF button to share the estimate instead."
        : msg || "Failed to send email.";
      return NextResponse.json({ error: userMessage }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[email-estimate]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
