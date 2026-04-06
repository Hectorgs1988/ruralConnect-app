import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    FlatList,
    Modal,
    Alert,
} from 'react-native';

// Colores de la web
const COLORS = {
    primary: '#fce500',
    primaryStrong: '#F4C400',
    background: '#f5f2e9',
    surface: '#FFFFFF',
    dark: '#1b1b1b',
    muted: '#6B7280',
    borderSoft: '#F3E8C9',
    success: '#10B981',
};

interface Espacio {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: string;
    capacidad: number;
    precio: number;
    imagen?: string;
}

interface Reserva {
    espacioId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
}

const ESPACIOS_MOCK: Espacio[] = [
    {
        id: '1',
        nombre: 'Salón Principal',
        descripcion: 'Salón grande para eventos y reuniones',
        tipo: 'Salón',
        capacidad: 100,
        precio: 50,
    },
    {
        id: '2',
        nombre: 'Cancha de Tenis',
        descripcion: 'Cancha de tenis con iluminación',
        tipo: 'Deporte',
        capacidad: 4,
        precio: 30,
    },
    {
        id: '3',
        nombre: 'Zona de Barbacoa',
        descripcion: 'Área externa con barbacoa y mesas',
        tipo: 'Exterior',
        capacidad: 50,
        precio: 40,
    },
    {
        id: '4',
        nombre: 'Sala de Conferencias',
        descripcion: 'Sala con proyector y sonido',
        tipo: 'Conferencia',
        capacidad: 30,
        precio: 25,
    },
];

interface EspacioCardProps {
    espacio: Espacio;
    onReservar: (espacio: Espacio) => void;
}

const EspacioCard: React.FC<EspacioCardProps> = ({ espacio, onReservar }) => (
    <TouchableOpacity
        style={styles.espacioCard}
        onPress={() => onReservar(espacio)}
        activeOpacity={0.8}
    >
        <View style={styles.espacioHeader}>
            <View style={styles.espacioInfo}>
                <Text style={styles.espacioNombre}>{espacio.nombre}</Text>
                <Text style={styles.espacioTipo}>{espacio.tipo}</Text>
            </View>
            <Text style={styles.espacioPrecio}>€{espacio.precio}</Text>
        </View>

        <Text style={styles.espacioDescripcion}>{espacio.descripcion}</Text>

        <View style={styles.espacioDetails}>
            <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Capacidad</Text>
                <Text style={styles.detailValue}>{espacio.capacidad} personas</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Disponible</Text>
                <Text style={[styles.detailValue, { color: COLORS.success }]}>Sí</Text>
            </View>
        </View>

        <TouchableOpacity
            style={styles.reservarButton}
            onPress={() => onReservar(espacio)}
            activeOpacity={0.8}
        >
            <Text style={styles.reservarButtonText}>Reservar</Text>
        </TouchableOpacity>
    </TouchableOpacity>
);

interface ReservasScreenProps {}

export const ReservasScreen: React.FC<ReservasScreenProps> = () => {
    const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [reserva, setReserva] = useState<Reserva>({
        espacioId: '',
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: '10:00',
        horaFin: '11:00',
    });

    const handleReservar = (espacio: Espacio) => {
        setSelectedEspacio(espacio);
        setReserva({
            ...reserva,
            espacioId: espacio.id,
        });
        setShowModal(true);
    };

    const handleConfirmarReserva = () => {
        Alert.alert(
            'Éxito',
            `Reserva confirmada para ${selectedEspacio?.nombre}\n${reserva.fecha} ${reserva.horaInicio} - ${reserva.horaFin}`,
            [
                {
                    text: 'Aceptar',
                    onPress: () => {
                        setShowModal(false);
                        setSelectedEspacio(null);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {}} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reservar Espacio</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Espacios Disponibles</Text>
                <Text style={styles.subtitle}>
                    Selecciona un espacio y elige la fecha y hora de tu reserva
                </Text>

                <View style={styles.list}>
                    {ESPACIOS_MOCK.map((espacio) => (
                        <EspacioCard key={espacio.id} espacio={espacio} onReservar={handleReservar} />
                    ))}
                </View>
            </ScrollView>

            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Confirmar Reserva</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={styles.modalCloseButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.infoGroup}>
                                <Text style={styles.infoLabel}>Espacio</Text>
                                <Text style={styles.infoValue}>{selectedEspacio?.nombre}</Text>
                            </View>

                            <View style={styles.infoGroup}>
                                <Text style={styles.infoLabel}>Fecha</Text>
                                <Text style={styles.infoValue}>{reserva.fecha}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoGroup}>
                                    <Text style={styles.infoLabel}>Hora Inicio</Text>
                                    <Text style={styles.infoValue}>{reserva.horaInicio}</Text>
                                </View>
                                <View style={styles.infoGroup}>
                                    <Text style={styles.infoLabel}>Hora Fin</Text>
                                    <Text style={styles.infoValue}>{reserva.horaFin}</Text>
                                </View>
                            </View>

                            <View style={styles.infoGroup}>
                                <Text style={styles.infoLabel}>Precio</Text>
                                <Text style={[styles.infoValue, styles.priceValue]}>
                                    ${selectedEspacio?.precio}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmarReserva}
                            >
                                <Text style={styles.confirmButtonText}>Confirmar Reserva</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 20,
    },
    list: {
        gap: 16,
    },
    espacioCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.borderSoft,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    espacioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    espacioInfo: {
        flex: 1,
    },
    espacioNombre: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 4,
    },
    espacioTipo: {
        fontSize: 12,
        color: COLORS.muted,
        backgroundColor: COLORS.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    espacioPrecio: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.primary,
    },
    espacioDescripcion: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 12,
        lineHeight: 20,
    },
    espacioDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderSoft,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.muted,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dark,
    },
    reservarButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    reservarButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderSoft,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.dark,
    },
    modalCloseButton: {
        fontSize: 24,
        color: COLORS.muted,
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    infoGroup: {
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.muted,
        marginBottom: 4,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.dark,
        fontWeight: '600',
        backgroundColor: COLORS.background,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 6,
    },
    priceValue: {
        color: COLORS.primary,
        fontSize: 18,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderSoft,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.muted,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.muted,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
    },
});
