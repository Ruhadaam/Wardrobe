import "../global.css";
import "react-native-reanimated";
import "../i18n"; // Initialize i18n
import { Slot, useRouter, useSegments, Stack, Redirect } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, View } from "react-native";
import Toast from "react-native-toast-message";
import mobileAds from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { WardrobeProvider, useWardrobe } from "../providers/WardrobeProvider";
import { supabase } from "../lib/supabase";
import { ONBOARDING_COMPLETE_KEY } from "./(auth)/onboarding";

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, loading, isPremium } = useAuth();
  const { initialLoadComplete } = useWardrobe();
  const segments = useSegments();
  const router = useRouter();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        setHasCompletedOnboarding(value === 'true');
      } catch (e) {
        console.error('Error checking onboarding status:', e);
        setHasCompletedOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

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

      // Initialize AdMob
      try {
        await mobileAds().initialize();
      } catch (e) {
        console.error("Failed to initialize AdMob:", e);
      }

      if (Platform.OS !== 'android' || fontsLoaded || fontError) {
        await SplashScreen.hideAsync();
      }
    };

    initApp();
  }, [fontsLoaded, fontError, loading, initialLoadComplete]);

  useEffect(() => {
    if (loading || hasCompletedOnboarding === null) return;

    // Listen for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[Layout] Password recovery event, navigating to reset-password');
        router.push('/(auth)/reset-password');
      }
    });

    const inAuthGroup = segments[0] === '(auth)';
    const isResetPassword = segments[1] === 'reset-password';
    const isOnboarding = segments[1] === 'onboarding';
    const isRegister = segments[1] === 'register';
    const isLogin = segments[1] === 'login';

    // If onboarding not completed and not already on onboarding/register/login screen
    if (!hasCompletedOnboarding && !isOnboarding && !isRegister && !isLogin) {
      router.replace('/(auth)/onboarding');
    } else if (!session && !inAuthGroup && hasCompletedOnboarding) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup && !isResetPassword) {
      router.replace('/(tabs)/wardrobe');
    }

    return () => subscription.unsubscribe();
  }, [session, loading, segments, hasCompletedOnboarding]);



  // Wait for fonts, auth loading, onboarding check, AND wardrobe initial load
  if ((Platform.OS === 'android' && !fontsLoaded && !fontError) || loading || !initialLoadComplete || hasCompletedOnboarding === null) {
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
