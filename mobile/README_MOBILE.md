# Susinos Mobile App

Aplicación móvil (iOS/Android) para Susinos construida con React Native y Expo.

## Requisitos

- Node.js >= 18
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Para iOS: Mac con Xcode instalado
- Para Android: Android Studio o emulador

## Instalación

```bash
cd mobile
npm install
```

## Configuración

1. Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Actualiza la variable `EXPO_PUBLIC_API_URL` según tu entorno

## Desarrollo

### Iniciar el servidor de desarrollo

```bash
npm start
```

Esto abrirá Expo Go. Puedes:
- Presionar `i` para abrir en simulador iOS
- Presionar `a` para abrir en emulador Android
- Escanear el código QR con Expo Go en tu teléfono

### Scripts disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Compila y ejecuta en Android
- `npm run ios` - Compila y ejecuta en iOS
- `npm run web` - Ejecuta en navegador

## Estructura del proyecto

```
src/
├── screens/          # Pantallas principales
├── components/       # Componentes reutilizables
├── services/         # Servicios (API calls)
├── context/          # Context API (Auth, etc)
├── types/            # TypeScript types
├── navigation/       # Configuración de navegación
└── lib/              # Utilidades y helpers
```

## Testing

```bash
# Ejecutar tests
npm test

# Con cobertura
npm run test:coverage
```

## Build

### Para iOS (requiere Mac)

```bash
# Build local
npx expo prebuild --clean
npx eas build --platform ios --local

# O para App Store
npx eas build --platform ios
```

### Para Android

```bash
# Build local
npx expo prebuild --clean
npx eas build --platform android --local

# O para Google Play
npx eas build --platform android
```

## Contribución

Asegúrate de:
1. Seguir el estilo de código existente
2. Escribir tipos TypeScript para todo
3. Documentar funciones complejas
4. Hacer commits descriptivos

## Links útiles

- [Documentación de Expo](https://docs.expo.dev)
- [Documentación de React Native](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
