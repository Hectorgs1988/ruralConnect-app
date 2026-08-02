import { type ChangeEvent, type FC, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/button';
import {
    createProductoDespensa,
    deleteProductoDespensa,
    listComprasDespensaAdmin,
    listProductosDespensa,
    updateProductoDespensa,
} from '@/api/despensa';
import { useAuth } from '@/context/AuthContext';
import type { CompraDespensaAdmin, ProductoDespensa } from '@/types/ProductoDespensa';

const initialForm = {
    nombre: '',
    descripcion: '',
    precioEuros: '',
    unidadesDisponibles: '',
};

const formatEuro = (amountInCents: number) =>
    new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(amountInCents / 100);

const GestionDespensa: FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [productos, setProductos] = useState<ProductoDespensa[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(initialForm);
    const [compras, setCompras] = useState<CompraDespensaAdmin[]>([]);

    const loadProductos = async () => {
        if (!token) {
            setProductos([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await listProductosDespensa(token);
            setProductos(data);
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo cargar la despensa');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadProductos();
    }, [token]);

    useEffect(() => {
        if (!token) {
            setCompras([]);
            return;
        }

        const loadCompras = async () => {
            try {
                const data = await listComprasDespensaAdmin(token);
                setCompras(data);
            } catch {
                setCompras([]);
            }
        };

        void loadCompras();
    }, [token]);

    const filteredProductos = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return productos;

        return productos.filter((producto) =>
            producto.nombre.toLowerCase().includes(term)
            || (producto.descripcion ?? '').toLowerCase().includes(term)
        );
    }, [productos, search]);

    const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setEditingId(null);
        setForm(initialForm);
    };

    const startEdit = (producto: ProductoDespensa) => {
        setEditingId(producto.id);
        setForm({
            nombre: producto.nombre,
            descripcion: producto.descripcion ?? '',
            precioEuros: (producto.precioCentimos / 100).toFixed(2),
            unidadesDisponibles: String(producto.unidadesDisponibles),
        });
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async () => {
        if (!token) return;

        const precio = Math.round(Number(form.precioEuros.replace(',', '.')) * 100);
        const unidades = Number(form.unidadesDisponibles);

        if (!form.nombre.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        if (!Number.isFinite(precio) || precio < 0) {
            setError('Introduce un precio válido');
            return;
        }

        if (!Number.isInteger(unidades) || unidades < 0) {
            setError('Introduce un número de unidades válido');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const payload = {
                nombre: form.nombre.trim(),
                descripcion: form.descripcion.trim() || null,
                precioCentimos: precio,
                unidadesDisponibles: unidades,
            };

            if (editingId) {
                await updateProductoDespensa(editingId, payload, token);
                setSuccess('Producto actualizado correctamente');
            } else {
                await createProductoDespensa(payload, token);
                setSuccess('Producto añadido correctamente');
            }

            resetForm();
            await loadProductos();
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo guardar el producto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (producto: ProductoDespensa) => {
        if (!token) return;

        const confirmed = window.confirm(`¿Eliminar ${producto.nombre} de la despensa?`);
        if (!confirmed) return;

        try {
            setError(null);
            setSuccess(null);
            await deleteProductoDespensa(producto.id, token);
            setSuccess('Producto eliminado correctamente');
            if (editingId === producto.id) resetForm();
            await loadProductos();
        } catch (err: any) {
            setError(err?.message ?? 'No se pudo eliminar el producto');
        }
    };

    return (
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-10 space-y-8 mb-10">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/PanelAdmin')}
                    className="self-start"
                >
                    ← Volver al panel de administración
                </Button>

                <div>
                    <h1 className="rc-hero-title">Gestión de despensa</h1>
                    <p className="rc-hero-subtitle">
                        Alta, edición y control del stock y precios de los productos.
                    </p>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr,1.7fr]">
                    <section className="rc-card-section space-y-4 h-fit">
                        <div>
                            <h2 className="text-xl font-semibold text-dark">
                                {editingId ? 'Editar producto' : 'Nuevo producto'}
                            </h2>
                            <p className="text-sm text-muted mt-1">
                                Define nombre, precio y stock inicial o actualizado.
                            </p>
                        </div>

                        {error && <p className="text-sm text-error">{error}</p>}
                        {success && <p className="text-sm text-emerald-700">{success}</p>}

                        <div className="space-y-3">
                            <input
                                name="nombre"
                                value={form.nombre}
                                onChange={handleFormChange}
                                placeholder="Nombre del producto"
                                className="w-full rounded-2xl border border-borderSoft bg-surface px-4 py-3 text-sm text-dark outline-none focus:ring-2 focus:ring-primaryStrong/40"
                            />
                            <textarea
                                name="descripcion"
                                value={form.descripcion}
                                onChange={handleFormChange}
                                placeholder="Descripción breve"
                                rows={4}
                                className="w-full rounded-2xl border border-borderSoft bg-surface px-4 py-3 text-sm text-dark outline-none focus:ring-2 focus:ring-primaryStrong/40"
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                                <input
                                    name="precioEuros"
                                    value={form.precioEuros}
                                    onChange={handleFormChange}
                                    placeholder="Precio en euros"
                                    inputMode="decimal"
                                    className="w-full rounded-2xl border border-borderSoft bg-surface px-4 py-3 text-sm text-dark outline-none focus:ring-2 focus:ring-primaryStrong/40"
                                />
                                <input
                                    name="unidadesDisponibles"
                                    value={form.unidadesDisponibles}
                                    onChange={handleFormChange}
                                    placeholder="Unidades disponibles"
                                    inputMode="numeric"
                                    className="w-full rounded-2xl border border-borderSoft bg-surface px-4 py-3 text-sm text-dark outline-none focus:ring-2 focus:ring-primaryStrong/40"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
                                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Añadir producto'}
                            </Button>
                            <Button type="button" variant="secondary" onClick={resetForm}>
                                Limpiar
                            </Button>
                        </div>
                    </section>

                    <section className="rc-card-section space-y-4 overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-dark">Catálogo actual</h2>
                                <p className="text-sm text-muted mt-1">
                                    Busca, revisa y ajusta rápidamente la despensa.
                                </p>
                            </div>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar producto"
                                className="w-full md:w-72 rounded-full border border-borderSoft bg-surface px-4 py-2 text-sm text-dark outline-none focus:ring-2 focus:ring-primaryStrong/40"
                            />
                        </div>

                        {loading ? (
                            <p className="text-sm text-muted">Cargando productos...</p>
                        ) : filteredProductos.length === 0 ? (
                            <p className="text-sm text-muted">No hay productos que coincidan con la búsqueda.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-borderSoft text-[11px] uppercase tracking-wide text-muted">
                                            <th className="py-3 px-3">Producto</th>
                                            <th className="py-3 px-3">Precio</th>
                                            <th className="py-3 px-3">Stock</th>
                                            <th className="py-3 px-3">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProductos.map((producto) => (
                                            <tr key={producto.id} className="border-b border-borderSoft/70 align-top">
                                                <td className="py-3 px-3 min-w-56">
                                                    <p className="font-semibold text-dark">{producto.nombre}</p>
                                                    <p className="text-muted mt-1">{producto.descripcion || 'Sin descripción'}</p>
                                                </td>
                                                <td className="py-3 px-3 font-medium text-dark">{formatEuro(producto.precioCentimos)}</td>
                                                <td className="py-3 px-3 text-dark">{producto.unidadesDisponibles}</td>
                                                <td className="py-3 px-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button type="button" variant="secondary" onClick={() => startEdit(producto)}>
                                                            Editar
                                                        </Button>
                                                        <Button type="button" variant="error" onClick={() => void handleDelete(producto)}>
                                                            Eliminar
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                <section className="rc-card-section space-y-4 overflow-hidden">
                    <div>
                        <h2 className="text-xl font-semibold text-dark">Últimas compras registradas</h2>
                        <p className="text-sm text-muted mt-1">
                            Seguimiento rápido de pedidos, importe y socio que realizó la compra.
                        </p>
                    </div>

                    {compras.length === 0 ? (
                        <p className="text-sm text-muted">Todavía no se han registrado compras.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-borderSoft text-[11px] uppercase tracking-wide text-muted">
                                        <th className="py-3 px-3">Fecha</th>
                                        <th className="py-3 px-3">Socio</th>
                                        <th className="py-3 px-3">Productos</th>
                                        <th className="py-3 px-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {compras.map((compra) => (
                                        <tr key={compra.id} className="border-b border-borderSoft/70 align-top">
                                            <td className="py-3 px-3 whitespace-nowrap text-dark">
                                                {new Date(compra.createdAt).toLocaleString('es-ES')}
                                            </td>
                                            <td className="py-3 px-3 min-w-56">
                                                <p className="font-semibold text-dark">{compra.User.name}</p>
                                                <p className="text-muted mt-1">{compra.User.email}</p>
                                            </td>
                                            <td className="py-3 px-3 min-w-72">
                                                <div className="space-y-1">
                                                    {compra.items.map((item) => (
                                                        <p key={item.id} className="text-dark">
                                                            {item.nombreProducto} x {item.cantidad}
                                                        </p>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 font-medium text-dark">
                                                {formatEuro(compra.totalCentimos)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default GestionDespensa;