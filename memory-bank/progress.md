# Progress

## Bajarilgan Ishlar
-   [x] Loyiha strukturasi tahlil qilindi.
-   [x] Memory Bank tizimi joriy etildi.
-   [x] **Litsenziya Tizimi**: Koddan va dependencylardan butunlay olib tashlandi (`WaiterApp` va boshqa joylardan).
-   [x] **Multi-Restoran (Backend)**: `Restaurant` entitysi yangilandi, `AdminRestaurantController` yaratildi.
-   [x] **Cloud Admin Panel**: Dashboard va Restoran yaratish sahifalari ishga tushirildi.
-   [x] **POS Onboarding**: Dasturga kirishda Restoran ID va Key so'rash tizimi yaratildi.
-   [x] **VPS Deploy**: Tizim `213.142.148.35` serveriga joylandi (`halboldi.uz`).
-   [x] **Sinxronizatsiya**: POS va Cloud o'rtasida xavfsiz (`x-access-key`) aloqa o'rnatildi.
-   [x] **Bug Fix**: Admin Panel Dashboard da restoran kaliti ko'rinishi tuzatildi.
-   [x] **Improvement**: Waiter App brauzerda ochilganda "Restoran ID" so'ramasligi tuzatildi.
-   [x] **Stabilizatsiya**: Sync Service endi SQLite xatolariga chidamli (Binding error fixed).
-   [x] **Sync Fixes**: 
    -   Foreign Key xatoliklari (Topological Sort) tuzatildi.
    -   "Fresh Install" da ma'lumotlar yo'qolishi (Data Overwrite) oldini olish uchun Pull-First va Timestamp logikasi qo'shildi.
    -   O'chirilgan ma'lumotlar qaytib kelmasligi uchun **Soft Delete** tizimi qo'shildi.
    -   Dual Admin muammosi bartaraf etildi.
-   [x] **Restoran Ma'lumotlari**: Sozlamalar va boshqa jadvallar sinxronizatsiyasi tiklandi (Cloud Server update).
-   [x] **Server Schema Fixes**:
    -   Missing Tables (`order_items`, `debts`, etc.) created.
    -   Column Types relaxed (UUID -> TEXT, TIMESTAMP -> TEXT) for compatibility.
    -   Foreign Key Constraints removed on Server for robust Sync.
-   [x] **UI Bugs Fixed**: Shift "Already Open" after Sync resolved.
-   [x] **Weighted Products**: Mahsulotlarni kg va dona da sotish imkoniyati qo'shildi (Waiter App + DB).
-   [x] **Windows Distribution**: `dist:win` va `electron-builder` muammolari hal qilindi va `.exe` installer yaratildi.
-   [x] **Table Move/Merge**: Stollar o'rtasida buyurtmalarni ko'chirish va birlashtirish funksiyasi to'liq ishga tushirildi.
-   [x] **UI Polish**: Dialog z-index va Menyu kodini ko'rsatmaslik kabi kichik UI tuzatishlar kiritildi.



## Rejalashtirilgan Ishlar
-   [ ] **Lokalizatsiya**: O'zbek tili tarjimalarini to'ldirish (agar kamchiliklar bo'lsa).
-   [ ] **Monitoring**: Server error loglarini kuzatish va optimallashtirish.
-   [ ] **Backup Tizimi**: VPS da ma'lumotlar bazasini avtomatik rezerv nusxalashni sozlash (kelajakda).

## Ma'lum Muammolar
-   Hozircha jiddiy ma'lum muammolar yo'q. Tizim barqaror ishlamoqda.
