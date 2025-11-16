import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const FROM = process.env.SENDGRID_FROM_EMAIL || "rconnect.rural@gmail.com";

if (!apiKey) {
    console.error("Falta SENDGRID_API_KEY en el .env");
} else {
    sgMail.setApiKey(apiKey);
}

export async function sendTestEmail(to?: string) {
    const toEmail = to || FROM;

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
        console.error("No se puede enviar email de reserva: falta SENDGRID_API_KEY");
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
        console.error("No se puede enviar email de reset: falta SENDGRID_API_KEY");
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
        console.error("No se puede enviar email de evento: falta SENDGRID_API_KEY");
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

export interface TripJoinPassengerEmail {
    to: string;
    name?: string | null;
    origen: string;
    destino: string;
    fecha: Date;
    conductorNombre?: string | null;
    conductorTelefono?: string | null;
}

export async function sendTripJoinPassengerEmail({
    to,
    name,
    origen,
    destino,
    fecha,
    conductorNombre,
    conductorTelefono,
}: TripJoinPassengerEmail) {
    if (!apiKey) {
        console.error("❌ No se puede enviar email de viaje (pasajero): falta SENDGRID_API_KEY");
        return;
    }

    const displayName = name || "";
    const greeting = displayName ? `Hola ${displayName},` : "Hola,";

    const fechaStr = fecha.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
    });

    const conductorLineText =
        conductorNombre || conductorTelefono
            ? `\nConductor: ${conductorNombre || ""}${conductorTelefono ? ` · Teléfono: ${conductorTelefono}` : ""}`
            : "";
    const conductorLineHtml =
        conductorNombre || conductorTelefono
            ? `<p><strong>Conductor:</strong> ${conductorNombre || ""}${conductorTelefono ? ` · Teléfono: ${conductorTelefono}` : ""}</p>`
            : "";

    const msg = {
        to,
        from: FROM,
        subject: `Te has unido al viaje · ${origen} → ${destino}`,
        text: `${greeting} te has unido al viaje ${origen} → ${destino} el ${fechaStr}.${conductorLineText}\n\nSi no puedes asistir, por favor avisa al conductor.\n\n¡Gracias por usar Rural Connect!`,
        html: `
        <h1>Te has unido a un viaje</h1>
        <p>${greeting}</p>
        <p>Te has unido al viaje <strong>${origen} → ${destino}</strong>.</p>
        <p><strong>Fecha y hora:</strong> ${fechaStr}</p>
        ${conductorLineHtml}
        <p>Si no puedes asistir, por favor avisa al conductor.</p>
        <p>¡Gracias por usar Rural Connect!</p>
    `,
    };

    await sgMail.send(msg as any);
}

export interface TripJoinDriverEmail {
    to: string;
    conductorName?: string | null;
    pasajeroNombre?: string | null;
    pasajeroTelefono?: string | null;
    pasajeroEmail: string;
    origen: string;
    destino: string;
    fecha: Date;
}

export async function sendTripJoinDriverEmail({
    to,
    conductorName,
    pasajeroNombre,
    pasajeroTelefono,
    pasajeroEmail,
    origen,
    destino,
    fecha,
}: TripJoinDriverEmail) {
    if (!apiKey) {
        console.error("No se puede enviar email de viaje (conductor): falta SENDGRID_API_KEY");
        return;
    }

    const displayName = conductorName || "";
    const greeting = displayName ? `Hola ${displayName},` : "Hola,";

    const fechaStr = fecha.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
    });

    const pasajeroNombreText = pasajeroNombre || "Un socio";
    const telefonoLineaText = pasajeroTelefono ? ` · Teléfono: ${pasajeroTelefono}` : "";
    const telefonoLineaHtml = pasajeroTelefono ? ` · Teléfono: ${pasajeroTelefono}` : "";

    const msg = {
        to,
        from: FROM,
        subject: `Nuevo pasajero en tu viaje · ${origen} → ${destino}`,
        text: `${greeting} ${pasajeroNombreText} se ha unido a tu viaje ${origen} → ${destino} del ${fechaStr}.\n\nContacto del pasajero: ${pasajeroEmail}${telefonoLineaText}\n\nPor favor, ponte en contacto para coordinar el viaje.\n\nRural Connect`,
        html: `
        <h1>Nuevo pasajero en tu viaje</h1>
        <p>${greeting}</p>
        <p><strong>${pasajeroNombreText}</strong> se ha unido a tu viaje <strong>${origen} → ${destino}</strong>.</p>
        <p><strong>Fecha y hora:</strong> ${fechaStr}</p>
        <p><strong>Contacto del pasajero:</strong> ${pasajeroEmail}${telefonoLineaHtml}</p>
        <p>Por favor, ponte en contacto para coordinar el viaje.</p>
        <p>Rural Connect</p>
    `,
    };

    await sgMail.send(msg as any);
}

export interface TripLeavePassengerEmail {
    to: string;
    name?: string | null;
    origen: string;
    destino: string;
    fecha: Date;
}

export async function sendTripLeavePassengerEmail({
    to,
    name,
    origen,
    destino,
    fecha,
}: TripLeavePassengerEmail) {
    if (!apiKey) {
        console.error("No se puede enviar email de viaje (baja pasajero): falta SENDGRID_API_KEY");
        return;
    }

    const displayName = name || "";
    const greeting = displayName ? `Hola ${displayName},` : "Hola,";

    const fechaStr = fecha.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
    });

    const msg = {
        to,
        from: FROM,
        subject: `Has cancelado tu plaza · ${origen} → ${destino}`,
        text: `${greeting} has cancelado tu plaza en el viaje ${origen} → ${destino} del ${fechaStr}.

Si ha sido un error, puedes volver a unirte al viaje desde Rural Connect.

Rural Connect`,
        html: `
        <h1>Has cancelado tu plaza en un viaje</h1>
        <p>${greeting}</p>
        <p>Has cancelado tu plaza en el viaje <strong>${origen} → ${destino}</strong>.</p>
        <p><strong>Fecha y hora:</strong> ${fechaStr}</p>
        <p>Si ha sido un error, puedes volver a unirte al viaje desde Rural Connect.</p>
        <p>Rural Connect</p>
    `,
    };

    await sgMail.send(msg as any);
}

export interface TripLeaveDriverEmail {
    to: string;
    conductorName?: string | null;
    pasajeroNombre?: string | null;
    pasajeroTelefono?: string | null;
    pasajeroEmail: string;
    origen: string;
    destino: string;
    fecha: Date;
}

export async function sendTripLeaveDriverEmail({
    to,
    conductorName,
    pasajeroNombre,
    pasajeroTelefono,
    pasajeroEmail,
    origen,
    destino,
    fecha,
}: TripLeaveDriverEmail) {
    if (!apiKey) {
        console.error("No se puede enviar email de viaje (baja pasajero al conductor): falta SENDGRID_API_KEY");
        return;
    }

    const displayName = conductorName || "";
    const greeting = displayName ? `Hola ${displayName},` : "Hola,";

    const fechaStr = fecha.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
    });

    const pasajeroNombreText = pasajeroNombre || "Un socio";
    const telefonoLineaText = pasajeroTelefono ? ` · Teléfono: ${pasajeroTelefono}` : "";
    const telefonoLineaHtml = pasajeroTelefono ? ` · Teléfono: ${pasajeroTelefono}` : "";

    const msg = {
        to,
        from: FROM,
        subject: `Un pasajero ha cancelado su plaza · ${origen} → ${destino}`,
        text: `${greeting} ${pasajeroNombreText} ha cancelado su plaza en tu viaje ${origen} → ${destino} del ${fechaStr}.

Contacto del pasajero: ${pasajeroEmail}${telefonoLineaText}

Rural Connect`,
        html: `
        <h1>Un pasajero ha cancelado su plaza</h1>
        <p>${greeting}</p>
        <p><strong>${pasajeroNombreText}</strong> ha cancelado su plaza en tu viaje <strong>${origen} → ${destino}</strong>.</p>
        <p><strong>Fecha y hora:</strong> ${fechaStr}</p>
        <p><strong>Contacto del pasajero:</strong> ${pasajeroEmail}${telefonoLineaHtml}</p>
        <p>Rural Connect</p>
    `,
    };

    await sgMail.send(msg as any);
}

