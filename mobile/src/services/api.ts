import axios, { AxiosInstance } from 'axios';

// Cambiar esto según tu entorno
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptor para agregar token JWT
        this.client.interceptors.request.use(
            (config) => {
                // Aquí agregarías el token desde AsyncStorage
                // const token = await AsyncStorage.getItem('authToken');
                // if (token) {
                //   config.headers.Authorization = `Bearer ${token}`;
                // }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    // Auth
    async login(email: string, password: string) {
        return this.client.post('/auth/login', { email, password });
    }

    async register(email: string, password: string, name: string) {
        return this.client.post('/auth/register', { email, password, name });
    }

    // Viajes
    async getViajes() {
        return this.client.get('/viajes');
    }

    async createViaje(data: any) {
        return this.client.post('/viajes', data);
    }

    // Eventos
    async getEventos() {
        return this.client.get('/eventos');
    }

    async createEvento(data: any) {
        return this.client.post('/eventos', data);
    }

    // Espacios
    async getEspacios() {
        return this.client.get('/espacios');
    }

    async createEspacio(data: any) {
        return this.client.post('/espacios', data);
    }

    // Reservas
    async getReservas() {
        return this.client.get('/reservas');
    }

    async createReserva(data: any) {
        return this.client.post('/reservas', data);
    }
}

export const apiClient = new ApiClient();
