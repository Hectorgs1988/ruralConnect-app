# Guía de Setup para Desarrollo Mobile

## 1. Preparación inicial

### Instalar dependencias globales

```bash
npm install -g expo-cli
npm install -g eas-cli  # Para builds a App Store/Google Play
```

### Crear cuenta Expo (opcional pero recomendado)

```bash
expo login
# O registrarse en https://expo.dev
```

## 2. Setup del proyecto

### Instalar dependencias locales

```bash
cd mobile
npm install
```

### Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.local.example .env.local

# Edita .env.local según tu entorno
# Para desarrollo local: EXPO_PUBLIC_API_URL=http://localhost:3000/api
# Para testing remoto: usa tu IP local (192.168.X.X:3000)
```

## 3. Iniciar el desarrollo

### Opción A: Usar Expo Go (más fácil)

```bash
npm start
```

Luego:
- Presiona `i` para iOS (requiere Mac)
- Presiona `a` para Android
- Escanea el código QR con tu teléfono (descargar app Expo Go primero)

### Opción B: Emulador local

**Android:**
```bash
npm run android
# Requiere: Android Studio o emulador configurado
```

**iOS:**
```bash
npm run ios
# Requiere: Mac con Xcode instalado
```

## 4. Estructura del proyecto

```
mobile/
├── src/
│   ├── screens/           # Pantallas (LoginScreen, HomeScreen, etc)
│   ├── components/        # Componentes reutilizables
│   ├── services/          # API client, servicios
│   ├── context/           # AuthContext, etc
│   ├── types/             # TypeScript interfaces
│   ├── navigation/        # Configuración de navegación
│   └── lib/               # Utilidades
├── App.tsx                # Entry point
├── app.json               # Configuración Expo
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies
```

## 5. Próximos pasos

### Features a implementar

- [ ] Integración completa con API backend
- [ ] Pantalla de Login funcional
- [ ] Pantalla Home con listado de viajes
- [ ] Pantalla de búsqueda/filtrado
- [ ] Mapa con geolocalización
- [ ] Reservas en tiempo real
- [ ] Notificaciones push
- [ ] Perfil de usuario
- [ ] Chat/mensajería

### Testing

```bash
npm test                      # Ejecutar tests
npm run test:coverage         # Con cobertura
```

### Build para distribución

```bash
# iOS (requiere cuenta Apple)
eas build --platform ios

# Android (requiere cuenta Google Play)
eas build --platform android

# Ambas plataformas
eas build
```

## 6. Troubleshooting

### Error: "Cannot find module '@context/AuthContext'"

Asegúrate de que los alias de rutas están configurados correctamente en `tsconfig.json`

### Emulador no se inicia

```bash
# Android: Usa Android Studio para configurar emulador
# iOS: Usa Xcode para seleccionar simulador
```

### Metro bundler lento

```bash
# Limpia cache y reinicia
npm start -- --clear
```

## 7. Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [TypeScript + React Native](https://www.typescriptlang.org/docs/handbook/react.html)

---

¿Preguntas? Consulta los documentos de Expo o React Native.
