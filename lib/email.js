import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXTAUTH_URL;

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #bae6fd;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:#0c4a6e;padding:24px 32px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:#f97316;border-radius:10px;padding:6px 16px;">
                <span style="color:white;font-size:16px;font-weight:700;letter-spacing:-0.3px;">slotora</span>
              </td>
            </tr></table>
          </td>
        </tr>
        ${content}
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e0f2fe;background:#f0f9ff;">
            <p style="margin:0;font-size:12px;color:#0369a1;">© 2025 Slotora · Made in the UK · <a href="${BASE_URL}" style="color:#0369a1;">slotora.app</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Vote notification — sent to poll creator when someone votes
export async function sendVoteNotification({ pollTitle, pollId, voterName, creatorEmail, creatorName }) {
  if (!creatorEmail) return;
  const pollUrl = `${BASE_URL}/poll/${pollId}`;
  try {
    await resend.emails.send({
      from: "Slotora <noreply@slotora.app>",
      to: creatorEmail,
      subject: `${voterName} voted on your ora — ${pollTitle}`,
      html: emailWrapper(`
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:13px;color:#0369a1;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">New vote</p>
            <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#0c4a6e;">${voterName} voted on your ora</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #bae6fd;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:12px;color:#0369a1;font-weight:600;text-transform:uppercase;">Ora</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0c4a6e;">${pollTitle}</p>
              </td></tr>
            </table>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Hi ${creatorName}, <strong>${voterName}</strong> has just voted on your ora. Check the results to see the best date so far.</p>
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:#f97316;border-radius:10px;">
                <a href="${pollUrl}" style="display:inline-block;padding:14px 28px;color:white;text-decoration:none;font-weight:600;font-size:15px;">View ora results →</a>
              </td>
            </tr></table>
          </td>
        </tr>
      `),
    });
    console.log("Vote notification sent to", creatorEmail);
  } catch (error) {
    console.error("Failed to send vote notification:", error);
  }
}

// Poll share invite — sent when creator invites someone to vote
export async function sendPollShareInvite({ pollTitle, pollId, recipientEmail, creatorName }) {
  const pollUrl = `${BASE_URL}/poll/${pollId}`;
  try {
    await resend.emails.send({
      from: "Slotora <hello@slotora.app>",
      to: recipientEmail,
      subject: `${creatorName} invited you to vote — ${pollTitle}`,
      html: emailWrapper(`
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:13px;color:#0369a1;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">You're invited</p>
            <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#0c4a6e;">${creatorName} wants your availability</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #bae6fd;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:12px;color:#0369a1;font-weight:600;text-transform:uppercase;">Ora</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0c4a6e;">${pollTitle}</p>
              </td></tr>
            </table>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">It only takes a minute — click the button below to vote on your preferred dates.</p>
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:#f97316;border-radius:10px;">
                <a href="${pollUrl}" style="display:inline-block;padding:14px 28px;color:white;text-decoration:none;font-weight:600;font-size:15px;">Vote now →</a>
              </td>
            </tr></table>
            <p style="margin:24px 0 0;font-size:13px;color:#7dd3fc;">Or copy this link: <a href="${pollUrl}" style="color:#0369a1;">${pollUrl}</a></p>
          </td>
        </tr>
      `),
    });
    console.log("Poll invite sent to", recipientEmail);
  } catch (error) {
    console.error("Failed to send invite:", error);
  }
}