import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export default function CajaPage() {
    const { user } = useAuth();

    return (
        <div className="rc-page">
            <Header />
            <main className="rc-shell flex-1 space-y-4 py-10">
                <h1 className="rc-hero-title">Caja Susinos</h1>
                <p className="text-center text-sm text-muted">
                    Sesión iniciada como {user?.name}
                </p>
            </main>
        </div>
    );
}
