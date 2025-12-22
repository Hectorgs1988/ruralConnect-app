// src/components/ui/EventModal.tsx
import type { FC } from "react";
import { useState, useEffect } from "react";
import Button from "./button";
import Input from "./input";
import { useAuth } from "@/context/AuthContext";
import { joinEvento, leaveEvento } from "@/api/eventos";

interface EventModalProps {
	onClose: () => void;
	onUpdate?: () => void;
	event: {
		id?: string;
		title: string;
		date: string;
		location: string;
		apuntados?: number;
		aforo?: number | null;
		isJoined?: boolean;
		misAsistentes?: number;
	};
}

type CountValidationMessages = {
	empty: string;
	invalid: string;
};

const getAuthOrEventError = (
	token: string | null | undefined,
	eventId?: string
): string | null => {
	if (!token) {
		return "Debes iniciar sesión para apuntarte a un evento.";
	}
	if (!eventId) {
		return "No se ha podido identificar el evento.";
	}
	return null;
};

const getEffectiveName = (inputName: string, userName?: string | null): string => {
	return (inputName || userName || "").trim();
};

const validateAndParseCount = (
	rawCount: string,
	messages: CountValidationMessages
): { count: number | null; error: string | null } => {
	const trimmed = rawCount.trim();
	if (!trimmed) {
		return { count: null, error: messages.empty };
	}
	const value = Number(trimmed);
	if (!Number.isFinite(value) || value < 1) {
		return { count: null, error: messages.invalid };
	}
	return { count: value, error: null };
};

const EventModal: FC<EventModalProps> = ({ onClose, onUpdate, event }) => {
	const [name, setName] = useState("");
	const [peopleCount, setPeopleCount] = useState(
		event.misAsistentes ? String(event.misAsistentes) : ""
	);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [, setConfirmStep] = useState(false);
	const [showConfirmJoin, setShowConfirmJoin] = useState(false);
	const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
	const [showConfirmLeave, setShowConfirmLeave] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const { token, user } = useAuth();

	const parsedPeopleCount = Number(peopleCount || "0");
	const isJoined = event.isJoined ?? false;

	useEffect(() => {
		if (user?.name) {
			setName(user.name);
		}
	}, [user]);

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault();
			setError(null);
	
			const authError = getAuthOrEventError(token, event.id);
			if (authError) {
				setError(authError);
				return;
			}
	
			if (isJoined) {
				const { error } = validateAndParseCount(peopleCount, {
					empty: "Indica el número de asistentes.",
					invalid: "El número de asistentes debe ser al menos 1.",
				});
	
				if (error) {
					setError(error);
					setConfirmStep(false);
					return;
				}
	
				setConfirmStep(false);
				setShowConfirmUpdate(true);
				return;
			}
	
			// Si no está inscrito, necesita número y, si no hay nombre en el campo,
			// usaremos el nombre del usuario logueado si existe.
			const effectiveName = getEffectiveName(name, user?.name);
			if (!effectiveName) {
				setError("Rellena tu nombre y el número de asistentes.");
				setConfirmStep(false);
				return;
			}
	
			const { error } = validateAndParseCount(peopleCount, {
				empty: "Rellena tu nombre y el número de asistentes.",
				invalid: "El número de asistentes debe ser al menos 1.",
			});
	
			if (error) {
				setError(error);
				setConfirmStep(false);
				return;
			}
	
			// Mostrar modal de confirmación en lugar de mensaje dentro del mismo modal
			setConfirmStep(false);
			setShowConfirmJoin(true);
		};

		const handleConfirmJoin = async () => {
			if (!token || !event.id) return;
	
			const { count, error } = validateAndParseCount(peopleCount, {
				empty: "El número de asistentes debe ser al menos 1.",
				invalid: "El número de asistentes debe ser al menos 1.",
			});
	
			if (error || count === null) {
				setError(error ?? "El número de asistentes debe ser al menos 1.");
				setShowConfirmJoin(false);
				return;
			}
	
			try {
				setSubmitting(true);
				await joinEvento(event.id, { asistentes: count }, token);
				if (onUpdate) onUpdate();
				setShowConfirmJoin(false);
				onClose();
			} catch (err: any) {
				setError(err?.message ?? "Error al apuntarte al evento");
				setShowConfirmJoin(false);
			} finally {
				setSubmitting(false);
			}
		};

	const handleLeave = async () => {
		if (!token || !event.id) return;

		try {
			setSubmitting(true);
			setError(null);
			await leaveEvento(event.id, token);
			if (onUpdate) onUpdate();
			onClose();
		} catch (err: any) {
			setError(err?.message ?? "Error al salirte del evento");
		} finally {
			setSubmitting(false);
		}
	};

		const handleConfirmUpdate = async () => {
			if (!token || !event.id) return;
	
			const { count, error } = validateAndParseCount(peopleCount, {
				empty: "El número de asistentes debe ser al menos 1.",
				invalid: "El número de asistentes debe ser al menos 1.",
			});
	
			if (error || count === null) {
				setError(error ?? "El número de asistentes debe ser al menos 1.");
				setShowConfirmUpdate(false);
				return;
			}
	
			try {
				setSubmitting(true);
				await joinEvento(event.id, { asistentes: count }, token);
				if (onUpdate) onUpdate();
				setIsEditing(false);
				setConfirmStep(false);
				setError(null);
				setShowConfirmUpdate(false);
				onClose();
			} catch (err: any) {
				setError(err?.message ?? "Error al actualizar el evento");
				setShowConfirmUpdate(false);
			} finally {
				setSubmitting(false);
			}
		};

	const handleClose = () => {
		if (submitting) return;
		onClose();
	};

	return (
		<>
			<div
				className="rc-modal-overlay"
				onClick={handleClose}
			>
				<div
					className="rc-modal-panel max-w-md"
					role="dialog"
					aria-modal="true"
					aria-labelledby="event-modal-title"
					aria-describedby="event-modal-description"
					onClick={(e) => e.stopPropagation()}
				>
					<button
						onClick={handleClose}
						className="absolute top-3 right-3 md:top-4 md:right-4 text-muted hover:text-dark text-xl font-semibold z-10"
						aria-label="Cerrar"
					>
						✕
					</button>

					<div className="mb-4 pr-8">
						<h2 id="event-modal-title" className="rc-modal-title">{event.title}</h2>
						<p
							id="event-modal-description"
							className="rc-modal-subtitle"
						>
							{event.date} · {event.location}
						</p>
					</div>

					{/* Información de asistencia */}
					<div className="mb-4 p-3 bg-soft rounded-lg border border-borderSoft">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted">Personas apuntadas:</span>
							<span className="font-semibold text-dark">
								{event.apuntados ?? 0}
								{event.aforo && ` / ${event.aforo}`}
							</span>
						</div>
						{isJoined && event.misAsistentes && (
							<div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-borderSoft">
								<span className="text-muted">Tus asistentes:</span>
								<span className="font-semibold text-dark">
									{event.misAsistentes}
								</span>
							</div>
						)}
					</div>

					{isJoined ? (
						// Usuario ya inscrito - Mostrar opción de editar o salirse
						<div className="space-y-3 md:space-y-4">
							{error && (
								<p className="text-sm text-error mb-1">
									{error}
								</p>
							)}

							{!isEditing ? (
								// Modo visualización
								<>
									<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
										<p className="text-sm text-green-800">
											✓ Ya estás inscrito en este evento con{" "}
											<span className="font-semibold">{event.misAsistentes}</span>{" "}
											asistente{event.misAsistentes && event.misAsistentes > 1 ? "s" : ""}.
										</p>
									</div>

									<div className="rc-modal-footer justify-end">
										<Button
											type="button"
											onClick={() => setIsEditing(true)}
											className="flex-1 sm:flex-initial rc-btn-primary"
											disabled={submitting}
										>
											Modificar asistentes
										</Button>
										<Button
											type="button"
											onClick={() => setShowConfirmLeave(true)}
											className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white"
											disabled={submitting}
										>
											{submitting ? "Saliendo..." : "Desapuntarme"}
										</Button>
									</div>
								</>
							) : (
								// Modo edición
								<form onSubmit={handleSubmit}>
									<label className="text-sm text-dark block mb-1">
										Número de asistentes
									</label>
									<Input
										type="number"
										min={1}
										placeholder="Número de asistentes"
										value={peopleCount}
										onChange={(e) => {
											setPeopleCount(e.target.value);
											setConfirmStep(false);
										}}
									/>

									<div className="rc-modal-footer">
										<Button
											type="button"
											onClick={() => {
												setIsEditing(false);
												setPeopleCount(String(event.misAsistentes || 1));
												setConfirmStep(false);
												setError(null);
											}}
											className="flex-1 sm:flex-initial rc-btn-secondary"
											disabled={submitting}
										>
											Cancelar
										</Button>
										<Button
											type="submit"
											className="flex-1 sm:flex-initial rc-btn-primary"
											disabled={submitting}
										>
											{submitting ? "Actualizando..." : "Actualizar"}
										</Button>
									</div>
								</form>
							)}
						</div>
					) : (
						// Usuario no inscrito - Mostrar formulario de inscripción
						<form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>
							{error && (
								<p className="text-sm text-error mb-1">
									{error}
								</p>
							)}

							<label className="text-sm text-dark block mb-1">Nombre</label>
							<Input
								placeholder="Tu nombre"
								value={name}
								disabled={!!user?.name}
								readOnly={!!user?.name}
								onChange={(e) => {
									setName(e.target.value);
									setConfirmStep(false);
								}}
							/>

							<label className="text-sm text-dark block mb-1">Número de asistentes</label>
							<Input
								type="number"
								min={1}
								placeholder="Número de asistentes"
								value={peopleCount}
								onChange={(e) => {
									setPeopleCount(e.target.value);
									setConfirmStep(false);
								}}
							/>

							<div className="rc-modal-footer">
								<Button
									type="button"
									onClick={handleClose}
									className="flex-1 sm:flex-initial rc-btn-secondary"
									disabled={submitting}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									className="flex-1 sm:flex-initial rc-btn-primary"
									disabled={submitting}
								>
									{submitting ? "Apuntando..." : "Apuntarme"}
								</Button>
							</div>
						</form>
					)}
				</div>
			</div>

			{/* Modal de confirmación de asistencia para nuevos apuntes */}
			{!isJoined && showConfirmJoin && (
				<div
					className="rc-modal-overlay z-50"
					onClick={() => setShowConfirmJoin(false)}
				>
					<div
						className="rc-modal-panel max-w-sm"
						role="dialog"
						aria-modal="true"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="rc-modal-title mb-2 text-base md:text-lg">
							Confirmar asistencia
						</h3>
						<p className="text-sm text-dark mb-4">
							Confirma que quieres apuntarte al evento con{" "}
							<span className="font-semibold">
								{parsedPeopleCount} asistente
								{parsedPeopleCount > 1 ? "s" : ""}
							</span>
							.
						</p>
						<div className="rc-modal-footer">
							<Button
								type="button"
								onClick={() => setShowConfirmJoin(false)}
								className="flex-1 sm:flex-initial rc-btn-secondary"
								disabled={submitting}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								onClick={handleConfirmJoin}
								className="flex-1 sm:flex-initial rc-btn-primary"
								disabled={submitting}
							>
								{submitting ? "Apuntando..." : "Confirmar asistencia"}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Modal de confirmación de asistencias para actualizar asistentes */}
			{isJoined && showConfirmUpdate && (
				<div
					className="rc-modal-overlay z-50"
					onClick={() => setShowConfirmUpdate(false)}
				>
					<div
						className="rc-modal-panel max-w-sm"
						role="dialog"
						aria-modal="true"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="rc-modal-title mb-2 text-base md:text-lg">
							Confirmar cambio
						</h3>
						<p className="text-sm text-dark mb-4">
							Confirma que quieres actualizar a{" "}
							<span className="font-semibold">
								{parsedPeopleCount} asistente
								{parsedPeopleCount > 1 ? "s" : ""}
							</span>
							.
						</p>
						<div className="rc-modal-footer">
							<Button
								type="button"
								onClick={() => setShowConfirmUpdate(false)}
								className="flex-1 sm:flex-initial rc-btn-secondary"
								disabled={submitting}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								onClick={handleConfirmUpdate}
								className="flex-1 sm:flex-initial rc-btn-primary"
								disabled={submitting}
							>
								{submitting ? "Actualizando..." : "Confirmar cambio"}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Modal de confirmación para desapuntarse del evento */}
			{isJoined && showConfirmLeave && (
				<div
					className="rc-modal-overlay z-50"
					onClick={() => setShowConfirmLeave(false)}
				>
					<div
						className="rc-modal-panel max-w-sm"
						role="dialog"
						aria-modal="true"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="rc-modal-title mb-2 text-base md:text-lg">
							Confirmar baja
						</h3>
						<p className="text-sm text-dark mb-4">
							¿Seguro que quieres desapuntarte de este evento?
						</p>
						<div className="rc-modal-footer">
							<Button
								type="button"
								onClick={() => setShowConfirmLeave(false)}
								className="flex-1 sm:flex-initial rc-btn-secondary"
								disabled={submitting}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								onClick={handleLeave}
								className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white"
								disabled={submitting}
							>
								{submitting ? "Saliendo..." : "Sí, desapuntarme"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default EventModal;
