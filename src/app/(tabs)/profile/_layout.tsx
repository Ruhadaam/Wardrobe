import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="account-info" />
            <Stack.Screen name="wardrobe-data" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="support" />
            <Stack.Screen name="privacy-policy" />
            <Stack.Screen name="language" />
        </Stack>
    );
}
