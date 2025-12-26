import "../global.css";
import "react-native-reanimated";
import "../i18n"; // Initialize i18n
import { Slot, useRouter, useSegments, Stack, Redirect } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, View } from "react-native";
import Toast from "react-native-toast-message";

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { WardrobeProvider, useWardrobe } from "../providers/WardrobeProvider";

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, loading, isPremium } = useAuth();
  const { initialLoadComplete } = useWardrobe();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    // Wait for auth loading AND wardrobe initial load to complete
    if (loading || !initialLoadComplete) return;

    const initApp = async () => {
      // Initialize RevenueCat
      try {
        const { RevenueCatService } = await import("../lib/revenuecat");
        await RevenueCatService.init();
      } catch (e) {
        console.error("Failed to initialize RevenueCat in layout:", e);
      }

      if (Platform.OS !== 'android' || fontsLoaded || fontError) {
        await SplashScreen.hideAsync();
      }
    };

    initApp();
  }, [fontsLoaded, fontError, loading, initialLoadComplete]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/wardrobe');
    }
  }, [session, loading, segments]);



  // Wait for fonts, auth loading, AND wardrobe initial load
  if ((Platform.OS === 'android' && !fontsLoaded && !fontError) || loading || !initialLoadComplete) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Slot />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <WardrobeProvider>
        <InitialLayout />
      </WardrobeProvider>
    </AuthProvider>
  );
}
