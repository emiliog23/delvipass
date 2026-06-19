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
  qrDataUrl: string;
  ticketNumber: number;
  inviteUrl: string;
}

export async function sendTicketEmail(data: TicketEmailData) {
  const { to, guestName, eventName, eventDate, eventVenue, qrDataUrl, ticketNumber, inviteUrl } = data;

  const dateStr = new Date(eventDate).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const code = `#${ticketNumber.toString().padStart(4, "0")}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#7c3aed;padding:28px 24px;text-align:center;">
          <p style="margin:0;color:#e9d5ff;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Entrada confirmada</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">${eventName}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 24px;text-align:center;">
          <p style="margin:0 0 4px;color:#666;font-size:13px;">${dateStr}</p>
          <p style="margin:0 0 20px;color:#666;font-size:13px;">${eventVenue}</p>

          <p style="margin:0 0 2px;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Titular</p>
          <p style="margin:0 0 4px;color:#111;font-size:20px;font-weight:700;">${guestName}</p>
          <p style="margin:0 0 24px;color:#aaa;font-size:13px;font-weight:600;">${code}</p>

          <img src="${qrDataUrl}" width="220" height="220"
               style="display:block;margin:0 auto 20px;border-radius:12px;border:1px solid #e5e7eb;"
               alt="Codigo QR de entrada">

          <p style="margin:0 0 8px;color:#555;font-size:13px;line-height:1.6;">
            Mostrá este código QR en la puerta del evento.
          </p>
          <p style="margin:0 0 24px;color:#555;font-size:13px;line-height:1.6;">
            Si lo deseás, podés tomar una captura de pantalla para guardarlo en tu celular.
          </p>

          <a href="${inviteUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">
            Ver entrada online
          </a>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#aaa;font-size:11px;">Esta entrada es personal e intransferible.</p>
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
