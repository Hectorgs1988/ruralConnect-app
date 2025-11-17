import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavMenu from '@/components/NavMenu';

const AsociacionMosquitos = () => {
    return (
        <div className="min-h-screen bg-background text-black flex flex-col">
            <Header />
            <NavMenu />

            <main className="flex-grow container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-center mb-2">Conoce Rural Connect</h2>
                <p className="text-center text-gray-700 mb-8">
                    Historia e información sobre nuestra peña
                </p>
                <div>
                    
                </div>
                
            </main>
            <Footer />
        </div>
    );
};

export default AsociacionMosquitos;
