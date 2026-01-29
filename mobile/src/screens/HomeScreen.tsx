import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '@context/AuthContext';

// Colores de la web
const COLORS = {
  primary: '#fce500',
  primaryStrong: '#F4C400',
  background: '#f5f2e9',
  surface: '#FFFFFF',
  dark: '#1b1b1b',
  muted: '#6B7280',
};

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, subtitle, icon, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.cardContent}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    <TouchableOpacity style={styles.cardButton} onPress={onPress}>
      <Text style={styles.cardButtonText}>Ver {title}</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name || 'Usuario'}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Bienvenido/a a Rural Connect</Text>
        <Text style={styles.subtitle}>
          Reserva espacios, consulta todas las actividades de la peña, comparte coche y planifica
          tu viaje con otros socios
        </Text>

        <View style={styles.cardsContainer}>
          <ActionCard
            icon="🏠"
            title="Reservar Espacio"
            subtitle="Comedor, pistas deportivas..."
            onPress={() => console.log('Reservar Espacio')}
          />

          <ActionCard
            icon="🚗"
            title="Compartir coche"
            subtitle="Viajes pueblo - ciudad y viceversa"
            onPress={() => console.log('Compartir coche')}
          />

          <ActionCard
            icon="📅"
            title="Eventos"
            subtitle="Consulta y apúntate a las actividades de la peña"
            onPress={() => console.log('Eventos')}
          />

          <ActionCard
            icon="🏡"
            title="Rural Connect"
            subtitle="Descubre Rural Connect"
            onPress={() => console.log('Rural Connect')}
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.dark,
    opacity: 0.8,
  },
  cardButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
});
