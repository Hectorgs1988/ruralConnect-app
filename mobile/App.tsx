import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@context/AuthContext';
import { Navigation } from '@navigation/Navigation';

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </>
  );
}
