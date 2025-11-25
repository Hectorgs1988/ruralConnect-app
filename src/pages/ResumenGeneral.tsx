import { useEffect, useState, type FC } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getResumenDashboard, type ResumenStats } from "@/api/dashboard";


const ResumenGeneral: FC = () => {
	const { token } = useAuth();
	const navigate = useNavigate();

	const [stats, setStats] = useState<ResumenStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) {
			setStats(null);
			setError("Debes iniciar sesion como admin.");
			return;
		}

		const fetchResumen = async () => {
			try {
				setLoading(true);
				setError(null);

				const data = await getResumenDashboard(token);
				setStats(data);
			} catch (err: any) {
				setError(err?.message ?? "Error al cargar el resumen general");
				setStats(null);
			} finally {
				setLoading(false);
			}
		};

		void fetchResumen();
	}, [token]);

	return (
		<div className="rc-page">
			<Header />

			<main className="flex-1 rc-shell py-10 space-y-8">
				<Button
					type="button"
					onClick={() => navigate("/PanelAdmin")}
					className="mb-4 text-sm px-3 py-1 rounded-full border border-borderSoft bg-surface hover:bg-surfaceMuted transition-colors"
				>
					← Volver al panel de administración
				</Button>
				<h1 className="rc-hero-title">Resumen general de la asociación</h1>
				<p className="rc-hero-subtitle">
					Visión global de actividades, socios y estadísticas
				</p>

				<section className="rc-shell grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)] gap-6 items-stretch">
					{/* Tarjeta de totales */}
					<section className="rc-card-section flex flex-col">
						<div className="mb-3">
							<h2 className="font-semibold text-sm">Indicadores generales</h2>
							<p className="text-[11px] text-muted mt-1">Visión rápida</p>
						</div>
						<div className="border-t border-borderSoft text-sm mt-2 pt-2 space-y-1.5">
							<p>
								<span className="font-medium">Socios totales:</span>{" "}
								<span className="text-muted">{stats?.sociosTotales ?? "-"}</span>
							</p>
							<p>
								<span className="font-medium">Eventos publicados:</span>{" "}
								<span className="text-muted">{stats?.eventosPublicados ?? "-"}</span>
							</p>
							<p>
								<span className="font-medium">Viajes compartidos:</span>{" "}
								<span className="text-muted">{stats?.viajesCompartidos ?? "-"}</span>
							</p>
							<p>
								<span className="font-medium">Socios activos:</span>{" "}
								<span className="text-muted">{stats?.sociosActivos ?? "-"}</span>
							</p>
							<p>
								<span className="font-medium">Reservas totales:</span>{" "}
								<span className="text-muted">{stats?.reservasTotales ?? "-"}</span>
							</p>
							<p>
								<span className="font-medium">Espacios disponibles:</span>{" "}
								<span className="text-muted">{stats?.espaciosDisponibles ?? "-"}</span>
							</p>
						</div>
					</section>

					{/* Ultimos eventos */}
					<section className="rc-card-section flex flex-col">
						<div className="mb-3">
							<h2 className="font-semibold text-sm">Últimos eventos</h2>
							<p className="text-[11px] text-muted mt-1">Eventos más recientes</p>
						</div>
						<div className="border-t border-borderSoft text-xs mt-2 pt-2 flex-1">
							{stats?.ultimosEventos?.length ? (
								<div className="space-y-2">
									{stats.ultimosEventos.map((ev) => (
										<div
											key={ev.id}
											className="py-1.5 border-b border-borderSoft/60 last:border-b-0"
										>
											<p className="text-xs font-medium text-dark">
												{ev.titulo}
											</p>
											<p className="text-[11px] text-muted">
												{new Date(ev.fecha).toLocaleDateString("es-ES")} · {ev.estado}
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted text-xs mt-2">
									No hay eventos registrados.
								</p>
							)}
						</div>
					</section>

					{/* Ultimos socios */}
					<section className="rc-card-section flex flex-col">
						<div className="mb-3">
							<h2 className="font-semibold text-sm">Últimos socios</h2>
							<p className="text-[11px] text-muted mt-1">Altas más recientes</p>
						</div>
						<div className="border-t border-borderSoft text-xs mt-2 pt-2 flex-1">
							{stats?.ultimosSocios?.length ? (
								<div className="space-y-2">
									{stats.ultimosSocios.map((s) => (
										<div
											key={s.id}
											className="py-1.5 border-b border-borderSoft/60 last:border-b-0"
										>
											<p className="text-xs font-medium text-dark">
												{s.name}
											</p>
											<p className="text-[11px] text-muted break-words">
												{s.email}
											</p>
											<p className="text-[11px] text-muted">
												Rol: {s.role === "ADMIN" ? "Admin" : "Socio"}
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted text-xs mt-2">
									No hay socios registrados.
								</p>
							)}
						</div>
					</section>
				</section>

				{error && (
					<p className="text-center text-error text-sm mb-4">{error}</p>
				)}
				{loading && !error && (
					<p className="text-center text-muted text-sm mb-4">Cargando resumen...</p>
				)}

				{/* Botones inferiores */}
				<div className="flex flex-col md:flex-row flex-wrap gap-3 justify-center mt-6">
					<Button
						type="button"
						variant="secondary"
						className="rc-btn-primary"
						onClick={() => navigate("/GestionSocio")}
					>
						Gestionar socios
					</Button>
					<Button
						type="button"
						variant="secondary"
						className="rc-btn-primary"
						onClick={() => navigate("/GestionEventos")}
					>
						Gestionar eventos
					</Button>
					<Button
						type="button"
						variant="secondary"
						className="rc-btn-primary"
						onClick={() => navigate("/ReservarEspacio")}
					>
						Ver reservas
					</Button>
					<Button
						type="button"
						variant="secondary"
						className="rc-btn-primary"
						onClick={() => navigate("/CompartirCoche")}
					>
						Ver viajes
					</Button>
				</div>
			</main>

			<Footer />
		</div>
	);
};


export default ResumenGeneral;

