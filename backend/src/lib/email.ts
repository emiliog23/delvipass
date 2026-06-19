import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM_EMAIL || "Sistema Entrada <noreply@example.com>";

interface InvitationEmailData {
  to: string;
  guestName: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventDescription?: string;
  inviteUrl: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  const { to, guestName, eventName, eventDate, eventVenue, eventDescription, inviteUrl } = data;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación - ${eventName}</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Estás invitado/a</h1>
    </div>
    <div style="padding: 40px;">
      <p style="font-size: 18px; color: #333;">Hola <strong>${guestName}</strong>,</p>
      <p style="color: #666;">Tenemos el placer de invitarte a:</p>
      <div style="background: #f8f8ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin: 20px 0;">
        <h2 style="color: #333; margin: 0 0 12px 0;">${eventName}</h2>
        ${eventDescription ? `<p style="color: #666; margin: 0 0 12px 0;">${eventDescription}</p>` : ""}
        <p style="color: #555; margin: 4px 0;">📅 <strong>Fecha:</strong> ${eventDate}</p>
        <p style="color: #555; margin: 4px 0;">📍 <strong>Lugar:</strong> ${eventVenue}</p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}"
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 16px 40px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-size: 18px;
                  font-weight: bold;
                  display: inline-block;">
          Ver mi invitación y código QR
        </a>
      </div>
      <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #7c6f00; margin: 0; font-size: 14px;">
          <strong>📱 Instrucciones de acceso:</strong><br>
          Para ingresar al evento, abrí este mail desde tu celular y mostrá tu código QR en la puerta. El código es personal e intransferible.
        </p>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
        Si no podés ver el botón, copiá este link en tu navegador:<br>
        <a href="${inviteUrl}" style="color: #667eea;">${inviteUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_xxxxxxxxxxxx") {
    console.log(`[EMAIL SIMULADO] Para: ${to} | Evento: ${eventName} | Link: ${inviteUrl}`);
    return { id: "simulated", simulated: true };
  }

  const result = await resend.emails.send({ from, to, subject: `Tu invitación para ${eventName}`, html });
  return result;
}

interface TicketEmailData {
  to: string;
  guestName: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventImageUrl?: string | null;
  qrDataUrl: string;
  ticketNumber: number;
  inviteUrl: string;
}

export async function sendTicketEmail(data: TicketEmailData) {
  const { to, guestName, eventName, eventDate, eventVenue, eventImageUrl, qrDataUrl, ticketNumber, inviteUrl } = data;

  const dateStr = new Date(eventDate).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const code = `#${ticketNumber.toString().padStart(4, "0")}`;

  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
  const imageAbsoluteUrl = eventImageUrl
    ? (eventImageUrl.startsWith("http") ? eventImageUrl : `${BACKEND_URL}${eventImageUrl}`)
    : null;

  const headerHtml = imageAbsoluteUrl
    ? `<tr>
        <td style="padding:0;line-height:0;">
          <img src="${imageAbsoluteUrl}" width="520" alt="${eventName}"
               style="display:block;width:100%;max-width:520px;height:auto;border:0;">
        </td>
       </tr>
       <tr>
        <td style="background:#111111;border-bottom:1px solid #2a2a2a;padding:16px 24px 20px;text-align:center;">
          <p style="margin:0 0 6px;color:#888888;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Entrada</p>
          <p style="margin:0;color:#f0f0f0;font-size:20px;font-weight:700;">${eventName}</p>
        </td>
       </tr>`
    : `<tr>
        <td style="background:#111111;border-bottom:1px solid #2a2a2a;padding:28px 24px 22px;text-align:center;">
          <p style="margin:0 0 4px;color:#444444;font-size:22px;">&#127915;</p>
          <p style="margin:0 0 6px;color:#888888;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Entrada</p>
          <p style="margin:0;color:#f0f0f0;font-size:20px;font-weight:700;">${eventName}</p>
        </td>
       </tr>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="max-width:480px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;overflow:hidden;">

      ${headerHtml}

      <!-- Body -->
      <tr><td style="padding:28px 28px 10px;">

        <!-- Guest name -->
        <p style="margin:0 0 20px;color:#ffffff;font-size:22px;font-weight:700;text-align:center;">${guestName}</p>
        <p style="margin:0 0 4px;color:#aaaaaa;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;">${code}</p>

        <!-- Date & Venue -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
          <tr>
            <td width="20" valign="top" style="padding-top:2px;">
              <span style="color:#555555;font-size:14px;">&#128197;</span>
            </td>
            <td style="color:#aaaaaa;font-size:14px;padding-left:8px;">${dateStr}</td>
          </tr>
          <tr><td colspan="2" style="padding:4px 0;"></td></tr>
          <tr>
            <td width="20" valign="top" style="padding-top:2px;">
              <span style="color:#555555;font-size:14px;">&#128205;</span>
            </td>
            <td style="color:#aaaaaa;font-size:14px;padding-left:8px;">${eventVenue}</td>
          </tr>
        </table>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;">
          <tr><td style="background:#2a2a2a;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>

        <!-- QR section -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:16px 0 0;text-align:center;">
              <p style="margin:0 0 12px;color:#555555;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Codigo QR de acceso</p>
              <img src="${qrDataUrl}" width="220" height="220"
                   style="display:block;margin:0 auto 16px;border-radius:8px;"
                   alt="Codigo QR">
            </td>
          </tr>
        </table>

        <!-- Instructions -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#111111;border:1px solid #2a2a2a;border-radius:10px;margin-top:18px;overflow:hidden;">
          <tr>
            <td style="padding:16px;">
              <p style="margin:0 0 6px;color:#999999;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Instrucciones de acceso</p>
              <p style="margin:0 0 8px;color:#777777;font-size:14px;line-height:1.6;">
                Para ingresar al evento, mostra este codigo QR en la puerta. La entrada es personal e intransferible.
              </p>
              <p style="margin:0;color:#555555;font-size:13px;line-height:1.6;">
                Si lo deseas, podes tomar una captura de pantalla para guardarla en tu celular.
              </p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr>
            <td align="center">
              <a href="${inviteUrl}"
                 style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">
                Ver entrada online
              </a>
            </td>
          </tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr>
        <td style="background:#111111;border-top:1px solid #2a2a2a;padding:16px 24px;text-align:center;">
          <p style="margin:0;color:#444444;font-size:11px;">Esta entrada es personal e intransferible.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_xxxxxxxxxxxx") {
    console.log(`[EMAIL TICKET SIMULADO] Para: ${to} | Evento: ${eventName} | Entrada: ${code}`);
    return { id: "simulated" };
  }

  return resend.emails.send({ from, to, subject: `Tu entrada para ${eventName} — ${code}`, html });
}
