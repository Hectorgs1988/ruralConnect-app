import type { FC } from "react";
import Header from "@/components/Header";
import ActionCard from "@/components/ui/ActionCard";
import Footer from "@/components/Footer";
import { Users, Calendar1, ChartColumnBig, HousePlus } from "lucide-react";


const PanelAdmin: FC = () => {
    return (
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-10 space-y-8">
                <h1 className="rc-hero-title">
                    Panel de administración de la asociación
                </h1>
                <p className="rc-hero-subtitle">
                    Gestión integral de la asociación
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center mb-6">
                    <ActionCard
                        icon={<Users size={36} className="text-black/90" />}
                        title="Gestión de socios"
                        description="Añadir o modificar socios"
                        buttonText="Acceder"
                        href="/GestionSocio"
                    />
                    <ActionCard
                        icon={<Calendar1 size={36} className="text-black/90" />}
                        title="Gestión de eventos"
                        description="Añadir o modificar eventos"
                        buttonText="Acceder"
                        href="/GestionEventos"
                    />
                    <ActionCard
                        icon={<HousePlus size={36} className="text-black/90" />}
                        title="Gestión de espacios"
                        description="Añadir o modificar espacios"
                        buttonText="Acceder"
                        href="/GestionEspacios"
                    />
                    <ActionCard
                        icon={<ChartColumnBig size={36} className="text-black/90" />}
                        title="Resumen general"
                        description="Datos generales de la peña"
                        buttonText="Acceder"
                        href="/ResumenGeneral"
                    />

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PanelAdmin;

