import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
    LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Replace with your actual RevenueCat API keys
const API_KEYS = {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
};

export const RevenueCatService = {
    init: async () => {
        try {
            const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

            if (!apiKey) {
                console.warn('RevenueCat API key is missing for platform:', Platform.OS);
                return;
            }

            // Explicitly set log handler to avoid "customLogHandler is not a function" crash
            if (__DEV__) {
                Purchases.setLogHandler((level, message) => {
                    console.log(`[RevenueCat][${level}] ${message}`);
                });
                await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            }

            await Purchases.configure({ apiKey });

            console.log('RevenueCat initialized successfully');
        } catch (e) {
            console.error('Error initializing RevenueCat:', e);
        }
    },

    getPurchaserInfo: async (): Promise<CustomerInfo | null> => {
        try {
            const info = await Purchases.getCustomerInfo();
            return info;
        } catch (e) {
            console.error('Error getting purchaser info:', e);
            return null;
        }
    },

    getOfferings: async (): Promise<PurchasesOffering | null> => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null) {
                return offerings.current;
            }
            return null;
        } catch (e) {
            console.error('Error getting offerings:', e);
            return null;
        }
    },

    purchasePackage: async (pack: PurchasesPackage) => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            return customerInfo;
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('Error purchasing package:', e);
            }
            throw e;
        }
    },

    restorePurchases: async () => {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (e) {
            console.error('Error restoring purchases:', e);
            throw e;
        }
    },

    isPro: async (customerInfo?: CustomerInfo): Promise<boolean> => {
        // Check if 'pro' entitlement is active
        // TODO: Replace 'pro' with your actual Entitlement ID from RevenueCat
        const info = customerInfo || await RevenueCatService.getPurchaserInfo();
        return info?.entitlements.active['pro'] !== undefined;
    }
};
