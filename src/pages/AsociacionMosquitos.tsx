import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AsociacionMosquitos = () => {
    const bullets = [
        'Reserva de espacios comunes de la asociación',
        'Gestión de eventos e inscripciones de socios',
        'Publicación y consulta de viajes compartidos',
        'Acceso diferenciado por roles (administrador / socio)',
    ];

    return (
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-10">
                <header className="text-center mb-10">
                    <h2 className="rc-hero-title text-center mb-2">Conoce Rural Connect</h2>
                    <p className="rc-hero-subtitle text-center">
                        Tecnología al servicio de las asociaciones rurales
                    </p>
                </header>

                <section className="rc-card-section max-w-4xl mx-auto space-y-6 text-gray-800 leading-relaxed">
                    {/* Bloque 1 */}
                    <article className="bg-white/70 rounded-2xl shadow-sm border border-black/5 p-6">
                        <h3 className="text-lg font-semibold mb-2">El reto</h3>
                        <p>
                            La despoblación y el envejecimiento de la población en zonas rurales de España,
                            conocido como la “España vaciada”, plantean retos sociales y de convivencia.
                            En este contexto, las asociaciones recreativas y culturales desempeñan un papel
                            fundamental como motor social, organizando actividades, eventos y espacios comunes.
                        </p>
                        <p className="mt-3">
                            Sin embargo, muchas entidades siguen gestionando estos procesos de forma manual
                            o informal, lo que genera ineficiencias y dificulta la participación activa de los socios.
                        </p>
                    </article>

                    {/* Bloque 2 */}
                    <article className="bg-white/70 rounded-2xl shadow-sm border border-black/5 p-6">
                        <h3 className="text-lg font-semibold mb-2">Un caso real</h3>
                        <p>
                            Este Trabajo Final de Grado se apoya en un caso concreto: la asociación{' '}
                            <strong>Los Mosquitos</strong>, situada en un pequeño municipio de la provincia de Burgos.
                            Se trata de una localidad de alrededor de <strong>110 habitantes</strong>, pero la asociación
                            cuenta con <strong>más de 600 socios</strong>. Esta diferencia entre población y tamaño de la
                            asociación incrementa la complejidad de la gestión diaria.
                        </p>
                        <p className="mt-3">
                            La reserva de espacios, la planificación de eventos y la coordinación de actividades
                            requieren coordinación, trazabilidad y acceso a la información en tiempo real.
                        </p>
                    </article>

                    {/* Bloque 3 */}
                    <article className="bg-white/70 rounded-2xl shadow-sm border border-black/5 p-6">
                        <h3 className="text-lg font-semibold mb-2">¿Qué es Rural Connect?</h3>
                        <p>
                            <strong>Rural Connect</strong> es una aplicación web orientada a facilitar la gestión y la
                            participación en asociaciones rurales. Centraliza tareas habituales en un entorno accesible,
                            eficiente y sostenible, reduciendo errores y mejorando la organización.
                        </p>

                        <div className="mt-4 rounded-xl bg-black/5 p-4">
                            <p className="font-medium mb-2">Principales funcionalidades:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                {bullets.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </article>

                    {/* Bloque 4 */}
                    <article className="bg-white/70 rounded-2xl shadow-sm border border-black/5 p-6">
                        <h3 className="text-lg font-semibold mb-2">Propósito del proyecto</h3>
                        <p>
                            El objetivo del proyecto es aportar una herramienta tecnológica que responda a necesidades
                            reales en entornos rurales, reforzando la vida comunitaria y simplificando la gestión de la
                            asociación. Este enfoque permite cumplir los requisitos académicos del TFG y, al mismo tiempo,
                            contribuir a un impacto social positivo.
                        </p>
                        <p className="mt-3 text-sm text-gray-600">
                            *Esta sección está pensada como una página institucional configurable, para que cada asociación
                            pueda reflejar su identidad, historia y propósito.*
                        </p>
                    </article>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default AsociacionMosquitos;
