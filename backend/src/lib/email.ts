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
