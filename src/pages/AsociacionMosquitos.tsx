import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AsociacionMosquitos = () => {
    return (
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-10">
                <h2 className="rc-hero-title text-center mb-2">Conoce Rural Connect</h2>
                <p className="rc-hero-subtitle text-center mb-8">
                    Historia e información sobre nuestra peña
                </p>

                <section className="rc-card-section max-w-3xl mx-auto space-y-4 text-gray-800 leading-relaxed">
                    <p>
                        La despoblación y el envejecimiento de la población en zonas rurales de España, conocido como la
                        “España vaciada”, plantea importantes retos sociales y de convivencia. En este contexto, las
                        asociaciones recreativas y culturales desempeñan un papel fundamental como motor social,
                        ofreciendo a los vecinos espacios comunes, organización de eventos y talleres. Sin embargo, muchas
                        de estas asociaciones no cuentan con herramientas digitales que faciliten la gestión de sus
                        recursos ni la participación activa de sus socios.
                    </p>
                    <p>
                        Este Trabajo Final de Grado tiene como objetivo proporcionar este tipo de herramientas a una
                        asociación concreta: la asociación Los Mosquitos, situada en un pequeño pueblo de la provincia de
                        Burgos. Se trata de una localidad con unos 110 habitantes, pero cuya asociación cuenta con más de
                        600 socios. Actualmente, la entidad se enfrenta a dificultades para coordinar la reserva de
                        espacios, la planificación de eventos y la inscripción de los socios en las actividades, así como
                        para facilitar la movilidad entre el pueblo y la ciudad. Estos procesos, gestionados de manera
                        manual o informal, generan ineficiencias y limitan la capacidad de la asociación para aprovechar
                        todos los recursos de los que dispone.
                    </p>
                    <p>
                        Con el fin de dar respuesta a estas necesidades, este trabajo propone el desarrollo de una
                        aplicación web denominada Rural Connect, orientada a ofrecer una solución tecnológica accesible,
                        eficiente y sostenible. He elegido este tema ya que considero que cumple por una parte con los
                        requerimientos académicos, y por otro lado por su importancia social, acercando la tecnología a
                        entornos rurales.
                    </p>
                </section>

            </main>
            <Footer />
        </div>
    );
};

export default AsociacionMosquitos;
