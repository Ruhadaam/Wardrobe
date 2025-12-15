import { Platform, View } from 'react-native';
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../components/Header";

// iOS Implementation - Native Tabs
function IOSTabBar() {
  return (
    <NativeTabs
      tintColor="#06b6d4"
      screenOptions={{
        headerShown: false,
      }}
    >
      <NativeTabs.Trigger name="wardrobe">
        <Label>Wardrobe</Label>
        <Icon sf={{ default: 'tshirt', selected: 'tshirt.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="outfit">
        <Label>Combine</Label>
        <Icon sf="bag" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <Label>History</Label>
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// Android Implementation - Custom Modern Tabs
function AndroidTabBar() {
  const { bottom } = useSafeAreaInsets();

  const tabBarStyle = {
    position: 'absolute' as const,
    bottom: Math.max(bottom, 30),
    backgroundColor: '#0f172a',
    borderRadius: 30,
    borderTopWidth: 0,
    height: 60,
    elevation: 10,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginLeft: 20,
    marginRight: 20,
  };

  const tabBarItemStyle = {
    height: 60,
    paddingVertical: 5,
  };

  const tabBarLabelStyle = {
    fontSize: 10,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  };

  return (
    <Tabs
      screenOptions={{
        header: () => <Header />,
        headerShown: true,
        tabBarActiveTintColor: '#06b6d4',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle,
        tabBarItemStyle,
        tabBarLabelStyle,
      }}
    >
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-800' : ''}`}>
              <MaterialCommunityIcons name={focused ? "wardrobe" : "wardrobe-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="outfit"
        options={{
          title: "Combine",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-800' : ''}`}>
              <MaterialIcons name="checkroom" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-800' : ''}`}>
              <MaterialIcons name="history" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-800' : ''}`}>
              <MaterialIcons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

export default function Layout() {
  if (Platform.OS === 'android') {
    return <AndroidTabBar />;
  }
  return <IOSTabBar />;
}

