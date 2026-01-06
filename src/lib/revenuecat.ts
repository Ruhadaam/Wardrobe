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

let initializationPromise: Promise<void> | null = null;

export const RevenueCatService = {
    init: async () => {
        if (initializationPromise) return initializationPromise;

        initializationPromise = (async () => {
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
                initializationPromise = null; // Reset on failure so it can be retried
            }
        })();

        return initializationPromise;
    },

    ensureInitialized: async () => {
        if (!initializationPromise) {
            await RevenueCatService.init();
        }
        return initializationPromise;
    },

    getPurchaserInfo: async (): Promise<CustomerInfo | null> => {
        try {
            await RevenueCatService.ensureInitialized();
            const info = await Purchases.getCustomerInfo();
            return info;
        } catch (e) {
            console.error('Error getting purchaser info:', e);
            return null;
        }
    },

    logIn: async (userId: string): Promise<CustomerInfo | null> => {
        try {
            await RevenueCatService.ensureInitialized();
            const { customerInfo } = await Purchases.logIn(userId);
            console.log('RevenueCat user logged in:', userId);
            return customerInfo;
        } catch (e) {
            console.error('Error logging in user to RevenueCat:', e);
            return null;
        }
    },

    logOut: async (): Promise<CustomerInfo | null> => {
        try {
            await RevenueCatService.ensureInitialized();
            const { customerInfo } = await Purchases.logOut();
            console.log('RevenueCat user logged out');
            return customerInfo;
        } catch (e) {
            console.error('Error logging out user from RevenueCat:', e);
            return null;
        }
    },

    getOfferings: async (): Promise<PurchasesOffering | null> => {
        try {
            await RevenueCatService.ensureInitialized();
            console.log('[RevenueCat] Fetching offerings...');
            const offerings = await Purchases.getOfferings();

            console.log('[RevenueCat] Offerings response:', {
                current: offerings.current ? {
                    identifier: offerings.current.identifier,
                    serverDescription: offerings.current.serverDescription,
                    availablePackages: offerings.current.availablePackages?.length || 0
                } : null,
                all: Object.keys(offerings.all || {}),
                currentIdentifier: offerings.currentIdentifier
            });

            if (offerings.current !== null) {
                console.log('[RevenueCat] Current offering found:', offerings.current.identifier);
                if (!offerings.current.availablePackages || offerings.current.availablePackages.length === 0) {
                    console.warn('[RevenueCat] Current offering has no available packages!');
                }
                return offerings.current;
            }

            console.warn('[RevenueCat] No current offering found. Available offerings:', Object.keys(offerings.all || {}));
            if (Object.keys(offerings.all || {}).length > 0) {
                console.log('[RevenueCat] Using first available offering instead');
                const firstOffering = Object.values(offerings.all || {})[0] as PurchasesOffering;
                return firstOffering || null;
            }

            return null;
        } catch (e) {
            console.error('[RevenueCat] Error getting offerings:', e);
            return null;
        }
    },

    purchasePackage: async (pack: PurchasesPackage) => {
        try {
            await RevenueCatService.ensureInitialized();
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
            await RevenueCatService.ensureInitialized();
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (e) {
            console.error('Error restoring purchases:', e);
            throw e;
        }
    },

    isPro: async (customerInfo?: CustomerInfo): Promise<boolean> => {
        try {
            // Check if 'Wardrobe Pro' entitlement is active
            const info = customerInfo || await RevenueCatService.getPurchaserInfo();
            return info?.entitlements.active['Wardrobe Pro'] !== undefined;
        } catch (e) {
            console.error('Error in isPro:', e);
            return false;
        }
    },

    /*isPro: async (): Promise<boolean> => {
return true; // Herkesi Pro yapar
},*/

};
