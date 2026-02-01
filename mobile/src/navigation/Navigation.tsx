import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@context/AuthContext';
import { LoginScreen } from '@screens/LoginScreen';
import { HomeScreen } from '@screens/HomeScreen';
import { ReservasScreen } from '@screens/ReservasScreen';
import { ActivityIndicator, View } from 'react-native';

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    Reservas: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const Navigation: React.FC = () => {
    const { isSignedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {isSignedIn ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen 
                            name="Reservas" 
                            component={ReservasScreen}
                        />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
