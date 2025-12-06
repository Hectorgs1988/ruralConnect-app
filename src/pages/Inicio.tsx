import type { FC } from "react";
import Header from "@/components/Header";
import ActionCard from "@/components/ui/ActionCard";
import Footer from "@/components/Footer";
import { HousePlus, CarFront, Home, CalendarClock } from "lucide-react";


const Inicio: FC = () => {

	return (
		<div className="rc-page">
			<Header />

			<main className="flex-1 rc-shell py-10 space-y-10">
				<h1 className="rc-hero-title">Bienvenido/a a Rural Connect</h1>
				<p className="rc-hero-subtitle">
					Reserva espacios, consulta todas las actividades de la peña,
					comparte coche y planifica tu viaje con otros socios
				</p>

				<div className="grid gap-6 md:grid-cols-3 mb-10">
					<ActionCard
						icon={<HousePlus size={36} className="text-black/90" />}
						title="Reservar Espacio"
						description="Comedor, pistas deportivas..."
						buttonText="Ver Espacios Disponibles"
						href="/ReservarEspacio"
					/>
					<ActionCard
						icon={<CarFront size={36} className="text-black/90" />}
						title="Compartir coche"
						description="Viajes pueblo - ciudad y viceversa"
						buttonText="Ver Viajes Disponibles"
						href="/CompartirCoche"
					/>
					<ActionCard
						icon={<CalendarClock size={36} className="text-black/90" />}
						title="Eventos"
						description="Consulta y apúntate a las actividades de la peña"
						buttonText="Ver Eventos"
						href="/Eventos"
					/>
					<ActionCard
						icon={<Home size={36} className="text-black/90" />}
						title="Rural Connect"
						description="Descubre Rural Connect"
						buttonText="Descubre Rural Connect"
						href="/AsociacionMosquitos"
					/>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default Inicio;
