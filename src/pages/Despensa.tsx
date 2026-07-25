import type { FC } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Despensa: FC = () => {
    return (
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-10 space-y-6">
                <h1 className="rc-hero-title">Despensa</h1>
                <p className="rc-hero-subtitle">Próximamente...</p>
            </main>

            <Footer />
        </div>
    );
};

export default Despensa;
