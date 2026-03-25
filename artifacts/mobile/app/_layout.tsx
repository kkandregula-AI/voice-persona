import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Head } from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VoiceProvider } from "@/context/VoiceContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <VoiceProvider>
                <Head>
                  <title>Voice Persona AI</title>
                  <meta name="description" content="Transform any text into speech that mirrors your unique vocal style using AI." />
                  <meta name="application-name" content="Voice Persona AI" />
                  <meta name="apple-mobile-web-app-capable" content="yes" />
                  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                  <meta name="apple-mobile-web-app-title" content="VoiceAI" />
                  <meta name="mobile-web-app-capable" content="yes" />
                  <meta name="theme-color" content="#050508" />
                  <meta name="msapplication-TileColor" content="#050508" />
                  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                  <meta property="og:title" content="Voice Persona AI" />
                  <meta property="og:description" content="Transform any text into speech that mirrors your unique vocal style. Record, choose a mode, generate." />
                  <meta property="og:type" content="website" />
                </Head>
                <RootLayoutNav />
              </VoiceProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
