import type { FC } from "react";
import Header from "@/components/Header";
import NavMenu from "@/components/NavMenu";
import ActionCard from "@/components/ui/ActionCard";
import Footer from "@/components/Footer";


const PanelAdmin: FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background text-black">
            <Header />
            <NavMenu />

            <main className="flex-1 px-4 md:px-10 mt-6">
                <h1 className="text-center text-2xl md:text-3xl font-bold mb-2">
                    Panel de administración de la asociación
                </h1>
                <p className="text-center text-sm md:text-base text-muted-foreground mb-8">
                    Gestión integral de la asociación
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center mb-10">
                    <ActionCard
                        icon=""
                        title="Gestión de socios"
                        description="Añadir o modificar socios"
                        buttonText="Acceder"
                        href="/GestionSocio"
                    />
                    <ActionCard
                        icon=""
                        title="Gestión de eventos"
                        description="Añadir o modificar eventos"
                        buttonText="Acceder"
                    />
                    <ActionCard
                        icon=""
                        title="Resumen general"
                        description="Datos generales de la asociación"
                        buttonText="Acceder"
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PanelAdmin;
