import "../global.css";
import { Slot } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <StatusBar 
            style={Platform.OS === "ios" ? "dark" : "auto"} 
            backgroundColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
            translucent={Platform.OS === "android"}
          />
          <Slot />
          <Toast />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
