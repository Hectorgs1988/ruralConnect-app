import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay token al montar
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          // Aquí deberías validar el token con el backend
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }
      } catch (e) {
        console.error('Error al restaurar sesión:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Conectar con backend real
      // const response = await apiClient.login(email, password);
      // const { token, user } = response.data;
      // await AsyncStorage.setItem('authToken', token);
      // await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      // Mock login - acepta cualquier email/password para testing
      if (email && password) {
        const mockUser: AuthUser = {
          id: '1',
          email: email,
          name: email.split('@')[0] || 'Usuario Test',
          role: 'user'
        };
        await AsyncStorage.setItem('userData', JSON.stringify(mockUser));
        setUser(mockUser);
      } else {
        throw new Error('Email y contraseña son requeridos');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // const response = await apiClient.register(email, password, name);
      // const { token, user } = response.data;
      // await AsyncStorage.setItem('authToken', token);
      // await AsyncStorage.setItem('userData', JSON.stringify(user));
      // setUser(user);
    } catch (error) {
      console.error('Error en register:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn: !!user,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
