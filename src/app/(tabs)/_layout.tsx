import { Platform, View } from 'react-native';
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { useTranslation } from 'react-i18next';

// iOS Implementation - Native Tabs
function IOSTabBar() {
  const { t } = useTranslation();
  return (
    <NativeTabs
      tintColor="#3A1AEB"
      screenOptions={{
        headerShown: false,
      }}
    >
      <NativeTabs.Trigger name="wardrobe">
        <Label>{t('tabs.wardrobe')}</Label>
        <Icon sf={{ default: 'tshirt', selected: 'tshirt.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="outfit">
        <Label>{t('tabs.outfit')}</Label>
        <Icon sf="bag" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <Label>{t('tabs.history')}</Label>
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>{t('tabs.profile')}</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// Android Implementation - Custom Modern Tabs
function AndroidTabBar() {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  const tabBarStyle = {
    position: 'absolute' as const,
    bottom: Math.max(bottom, 30),
    backgroundColor: '#ffffff',
    borderRadius: 30,
    borderTopWidth: 0,
    height: 60,
    elevation: 10,
    shadowColor: '#3A1AEB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginLeft: 20,
    marginRight: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
        header: (props) => <Header {...props} />,
        headerShown: true,
        animation: 'fade',
        tabBarActiveTintColor: '#3A1AEB',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle,
        tabBarItemStyle,
        tabBarLabelStyle,
      }}
    >
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-50' : ''}`}>
              <MaterialCommunityIcons name={focused ? "wardrobe" : "wardrobe-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="outfit"
        options={{
          title: t('tabs.outfit'),
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-50' : ''}`}>
              <MaterialIcons name="checkroom" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-50' : ''}`}>
              <MaterialIcons name="history" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-50' : ''}`}>
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

