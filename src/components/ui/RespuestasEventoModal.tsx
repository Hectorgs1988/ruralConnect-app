import { useEffect, useMemo, useState, type FC } from "react";
import Button from "./button";
import { getEventoRespuestasAdmin, type ApiEventoRespuestasAdmin } from "@/api/eventos";
import { useAuth } from "@/context/AuthContext";

interface RespuestasEventoModalProps {
    eventId: string;
    eventTitle: string;
    onClose: () => void;
}

const formatRespuesta = (respuesta: {
    valorTexto: string | null;
    valorNumero: number | null;
    valorBooleano: boolean | null;
    valorOpcion: string | null;
}) => {
    if (respuesta.valorTexto !== null) return respuesta.valorTexto;
    if (respuesta.valorNumero !== null) return String(respuesta.valorNumero);
    if (respuesta.valorBooleano !== null) return respuesta.valorBooleano ? "Si" : "No";
    if (respuesta.valorOpcion !== null) return respuesta.valorOpcion;
    return "-";
};

const RespuestasEventoModal: FC<RespuestasEventoModalProps> = ({ eventId, eventTitle, onClose }) => {
    const { token } = useAuth();
    const [data, setData] = useState<ApiEventoRespuestasAdmin | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError("Debes iniciar sesion como admin.");
            setLoading(false);
            return;
        }

        let alive = true;
        setLoading(true);
        setError(null);

        void getEventoRespuestasAdmin(eventId, token)
            .then((res) => {
                if (!alive) return;
                setData(res);
            })
            .catch((err: any) => {
                if (!alive) return;
                setError(err?.message ?? "No se han podido cargar las respuestas del evento.");
            })
            .finally(() => {
                if (!alive) return;
                setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, [eventId, token]);

    const preguntas = useMemo(() => data?.evento.preguntas ?? [], [data]);

    return (
        <div className="rc-modal-overlay" onClick={onClose}>
            <div
                className="rc-modal-panel max-w-5xl"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-4 pr-8">
                    <h2 className="rc-modal-title">Respuestas del evento</h2>
                    <p className="rc-modal-subtitle">{eventTitle}</p>
                </div>

                {loading && <p className="text-sm text-muted">Cargando respuestas...</p>}
                {!loading && error && <p className="text-sm text-error">{error}</p>}

                {!loading && !error && data && (
                    <div className="space-y-4">
                        {preguntas.length === 0 ? (
                            <p className="text-sm text-muted">Este evento no tiene preguntas configuradas.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-borderSoft text-[11px] uppercase tracking-wide text-muted">
                                            <th className="py-2 px-3">Socio</th>
                                            <th className="py-2 px-3">Asistentes</th>
                                            {preguntas.map((pregunta) => (
                                                <th key={pregunta.id} className="py-2 px-3 min-w-[200px]">
                                                    {pregunta.texto}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.inscripciones.length === 0 && (
                                            <tr>
                                                <td colSpan={2 + preguntas.length} className="py-4 px-3 text-center text-muted">
                                                    Todavia no hay inscripciones en este evento.
                                                </td>
                                            </tr>
                                        )}
                                        {data.inscripciones.map((inscripcion) => {
                                            const respuestaMap = new Map(
                                                inscripcion.respuestas.map((r) => [r.preguntaId, r])
                                            );

                                            return (
                                                <tr
                                                    key={inscripcion.userId}
                                                    className="border-b border-borderSoft/60 last:border-0"
                                                >
                                                    <td className="py-2 px-3 whitespace-nowrap font-medium">
                                                        {inscripcion.name}
                                                    </td>
                                                    <td className="py-2 px-3 whitespace-nowrap">
                                                        {inscripcion.asistentes}
                                                    </td>
                                                    {preguntas.map((pregunta) => {
                                                        const respuesta = respuestaMap.get(pregunta.id);
                                                        return (
                                                            <td key={`${inscripcion.userId}-${pregunta.id}`} className="py-2 px-3 align-top">
                                                                {respuesta ? formatRespuesta(respuesta) : "-"}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                <div className="rc-modal-footer mt-5">
                    <Button type="button" onClick={onClose} className="rc-btn-secondary">
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RespuestasEventoModal;
