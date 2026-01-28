import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { apiClient } from '@services/api';

interface Travel {
  id: string;
  title: string;
  description: string;
  date: string;
  origin: string;
  destination: string;
}

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [viajes, setViajes] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadViajes();
  }, []);

  const loadViajes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getViajes();
      setViajes(response.data || []);
    } catch (error) {
      console.error('Error cargando viajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {user?.name}!</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Viajes disponibles</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : viajes.length > 0 ? (
        <FlatList
          data={viajes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.travelCard}>
              <Text style={styles.travelTitle}>{item.title}</Text>
              <Text style={styles.travelDescription}>{item.description}</Text>
              <View style={styles.travelDetails}>
                <Text style={styles.detailText}>De: {item.origin}</Text>
                <Text style={styles.detailText}>Hacia: {item.destination}</Text>
                <Text style={styles.detailText}>Fecha: {new Date(item.date).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.emptyText}>No hay viajes disponibles</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    color: '#333',
  },
  travelCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  travelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  travelDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  travelDetails: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
});
