# TestFlight'ta Abonelikler Görünmüyor - Kontrol Listesi

## Önemli Notlar

TestFlight'ta aboneliklerin görünmesi için aşağıdaki kontrolleri yapın:

### 1. App Store Connect Kontrolleri

✅ **In-App Purchase Ürünleri Durumu**
- App Store Connect > Uygulamanız > In-App Purchases bölümüne gidin
- Tüm abonelik ürünlerinizin durumunun **"Ready to Submit"** veya daha ileri bir aşamada olması gerekir
- Ürünler "Draft" durumundaysa, TestFlight'ta görünmezler
- Ürünlerin **"Approved"** durumunda olması en iyisidir

✅ **Bundle ID Eşleşmesi**
- RevenueCat dashboard'unda kullanılan Bundle ID ile App Store Connect'teki Bundle ID'nin aynı olduğundan emin olun
- Bundle ID: `com.ruhadam.Ornatus`

✅ **App Store Connect API Credentials** (Opsiyonel ama önerilir)
- RevenueCat dashboard > Settings > App Store Connect API bölümünden API credentials'ları ekleyin
- Bu, RevenueCat'in ürün durumlarını doğrulamasına yardımcı olur

### 2. RevenueCat Dashboard Kontrolleri

✅ **Offerings Konfigürasyonu**
- RevenueCat dashboard > Offerings bölümüne gidin
- "default" offering'in aktif olduğundan emin olun
- Offering içinde paketlerin ($rc_annual, $rc_monthly) doğru şekilde eşleştirildiğinden emin olun

✅ **Products Konfigürasyonu**
- RevenueCat dashboard > Products bölümüne gidin
- Tüm ürünlerin App Store Connect'teki Product ID'leri ile eşleştiğinden emin olun
- Ürünlerin "Active" durumunda olduğundan emin olun

✅ **Entitlements**
- "Wardrobe Pro" entitlement'ının doğru şekilde konfigüre edildiğinden emin olun
- Entitlement'ın ürünlerle eşleştirildiğinden emin olun

### 3. TestFlight Test Kontrolleri

✅ **Sandbox Hesabı**
- TestFlight'ta test ederken, cihazın Ayarlar > App Store bölümünden **Sandbox hesabı ile çıkış yapın**
- Uygulamayı açtıktan sonra satın alma yaparken Sandbox hesabı ile giriş yapmanız istenecektir
- **Önemli**: TestFlight build'lerinde de Sandbox hesapları kullanılır (production değil)

✅ **Build Type**
- TestFlight build'inin **production build** olduğundan emin olun (development build değil)
- EAS Build ile `--profile production` veya production profile kullanın

✅ **Environment Variables**
- Production build'de `EXPO_PUBLIC_REVENUECAT_IOS_KEY` environment variable'ının doğru şekilde set edildiğinden emin olun
- Production API key kullanıldığından emin olun (sandbox key değil)

### 4. Debug Adımları

TestFlight'ta test ederken, Xcode Console veya device logs'ları kontrol edin:

1. Cihazı Mac'e bağlayın
2. Xcode > Window > Devices and Simulators
3. Cihazı seçin ve "Open Console" butonuna tıklayın
4. Uygulamayı açın ve paywall ekranına gidin
5. Log'larda şu mesajları arayın:
   - `[RevenueCat] Fetching offerings...`
   - `[RevenueCat] Offerings response:`
   - `[RevenueCat] Package:` mesajları (paket detayları için)

### 5. Yaygın Sorunlar ve Çözümleri

**Sorun**: Packages görünmüyor
- **Çözüm**: App Store Connect'te ürünlerin "Ready to Submit" veya "Approved" durumunda olduğundan emin olun

**Sorun**: "No packages available" hatası
- **Çözüm**: RevenueCat dashboard'unda offerings ve products konfigürasyonunu kontrol edin

**Sorun**: Sandbox hesabı çalışmıyor
- **Çözüm**: Cihazın Ayarlar > App Store bölümünden Sandbox hesabı ile çıkış yapın, uygulamayı açın ve satın alma yaparken Sandbox hesabı ile giriş yapın

**Sorun**: Production build'de farklı davranış
- **Çözüm**: Environment variable'ların doğru şekilde set edildiğinden ve production API key kullanıldığından emin olun

## Kod Değişiklikleri

Koda aşağıdaki iyileştirmeler eklendi:

1. **Retry Mekanizması**: `getOfferings` fonksiyonuna otomatik retry mekanizması eklendi (2 kez tekrar deneme)
2. **Daha İyi Logging**: Production ortamında da warning ve error logları gösteriliyor
3. **Detaylı Package Logging**: Her paket için detaylı bilgiler loglanıyor (debug için)

Bu değişiklikler TestFlight'ta sorunları tespit etmenize yardımcı olacaktır.

