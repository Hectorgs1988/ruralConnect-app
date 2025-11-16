// server/src/services/email.ts
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const FROM = process.env.SENDGRID_FROM_EMAIL || "rconnect.rural@gmail.com";

if (!apiKey) {
    console.error("Falta SENDGRID_API_KEY en el .env");
} else {
    sgMail.setApiKey(apiKey);
}

export async function sendTestEmail(to?: string) {
    const toEmail = to || FROM; // si no pasas destinatario, te lo manda a ti mismo

    const msg = {
        to: toEmail,
        from: FROM,
        subject: "Prueba SendGrid · Rural Connect",
        text: "Este es un email de prueba enviado desde el backend de Rural Connect.",
        html: `
        <h1>Prueba de SendGrid</h1>
        <p>El envío de correo funciona </p>
        <p><strong>Backend:</strong> susinos-app/server (localhost)</p>
    `,
    };

    await sgMail.send(msg);
}


export interface ReservationConfirmationEmail {
    to: string;
    name?: string | null;
    espacioNombre: string;
    inicio: Date;
    fin?: Date | null;
}

export async function sendReservationConfirmationEmail({
    to,
    name,
    espacioNombre,
    inicio,
    fin,
}: ReservationConfirmationEmail) {
    if (!apiKey) {
        console.error("❌ No se puede enviar email de reserva: falta SENDGRID_API_KEY");
        return;
    }

    const inicioStr = inicio.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
    });
    const finStr = fin
        ? fin.toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short",
        })
        : "";
    const textFin = finStr ? ` a ${finStr}` : "";
    const htmlFin = finStr ? `<br/><strong>Hasta:</strong> ${finStr}` : "";

    const displayName = name || "";
    const greeting = displayName ? `Hola ${displayName},` : "Hola,";

    const msg = {
        to,
        from: FROM,
        subject: `Reserva confirmada · ${espacioNombre}`,
        text: `${greeting} tu reserva de ${espacioNombre} está confirmada desde ${inicioStr}${textFin}.`,
        html: `
      <h1>Reserva confirmada</h1>
      <p>${greeting}</p>
      <p>Tu reserva de <strong>${espacioNombre}</strong> está confirmada.</p>
      <p><strong>Desde:</strong> ${inicioStr}${htmlFin}</p>
      <p>¡Gracias por usar Rural Connect!</p>
    `,
    };

    await sgMail.send(msg as any);
}

export interface PasswordResetEmail {
    to: string;
    name?: string | null;
    resetUrl: string;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmail) {
    if (!apiKey) {
        console.error("❌ No se puede enviar email de reset: falta SENDGRID_API_KEY");
        return;
    }

    const displayName = name || "";
    const greeting = displayName ? `Hola ${displayName},` : "Hola,";

    const msg = {
        to,
        from: FROM,
        subject: "Recuperación de contraseña · Rural Connect",
        text: `${greeting} hemos recibido una solicitud para restablecer tu contraseña. Puedes hacerlo en: ${resetUrl}`,
        html: `
      <h1>Recuperación de contraseña</h1>
      <p>${greeting}</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña de Rural Connect.</p>
      <p>Si has sido tú, haz clic en el siguiente enlace:</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">Restablecer contraseña</a></p>
      <p>Si no has solicitado este cambio, puedes ignorar este mensaje.</p>
    `,
    };

    await sgMail.send(msg as any);
}



export interface EventInscriptionEmail {
    to: string;
    name?: string | null;
    titulo: string;
    fecha: Date;
    lugar?: string | null;
    asistentes: number;
}

export async function sendEventInscriptionEmail({
    to,
    name,
    titulo,
    fecha,
    lugar,
    asistentes,
}: EventInscriptionEmail) {
    if (!apiKey) {
        console.error("❌ No se puede enviar email de evento: falta SENDGRID_API_KEY");
        return;
    }

    const displayName = name || "";
    const greeting = displayName ? `Hola ${displayName},` : "Hola,";

    const fechaStr = fecha.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
    });

    const lugarTexto = lugar ? `\nLugar: ${lugar}` : "";
    const lugarHtml = lugar ? `<p><strong>Lugar:</strong> ${lugar}</p>` : "";

    const asistentesTexto = asistentes > 1
        ? `Número de asistentes: ${asistentes}`
        : "Asistente: 1";

    const msg = {
        to,
        from: FROM,
        subject: `Inscripción confirmada · ${titulo}`,
        text: `${greeting} tu inscripción al evento "${titulo}" está confirmada para el ${fechaStr}.${lugarTexto}\n${asistentesTexto}\n\n¡Gracias por participar en Rural Connect!`,
        html: `
      <h1>Inscripción confirmada</h1>
      <p>${greeting}</p>
      <p>Tu inscripción al evento <strong>${titulo}</strong> está confirmada.</p>
      <p><strong>Fecha y hora:</strong> ${fechaStr}</p>
      ${lugarHtml}
      <p>${asistentesTexto}</p>
      <p>¡Gracias por participar en Rural Connect!</p>
    `,
    };

    await sgMail.send(msg as any);
}
