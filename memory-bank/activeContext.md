# Active Context

## Joriy Fokus
Hozirda asosiy e'tibor tizimning barqarorligini ta'minlash, VPS serverda ishlashini nazorat qilish va yuzaga kelishi mumkin bo'lgan kichik xatoliklarni tuzatishga qaratilgan. "Memory Bank" tizimi endi loyihaning haqiqiy holatini aks ettirishi kerak.

## So'nggi O'zgarishlar
-   **License Functionality Removed**: `apps/license-manager` va barcha litsenziya tekshiruvlari olib tashlandi.
-   **Multi-Restoran Tizimi**: `Restaurant` entitysiga `access_key` qo'shildi, Serverda identifikatsiya qilish va POS uchun `Onboarding` jarayoni yaratildi.
-   **Cloud Admin Panel**: Restoranlarni yaratish, ID va Access Key olish uchun Dashboard va yangi sahifalar qo'shildi. `https://halboldi.uz` da ishga tushirildi.
-   **VPS Deploy**: `cloud-server` va `cloud-admin` VPS ga (`213.142.148.35`) muvaffaqiyatli joylandi. Nginx proxy va SSL sozlandi.
-   **Xatoliklar Tuzatildi**:
    -   `WaiterApp` dagi eski litsenziya kodi olib tashlandi.
    -   `SyncService` va POS ulanishi `https://halboldi.uz/api` ga o'tkazildi.
    -   Admin Dashboard API manzili to'g'irlandi.
    -   **Fix**: Admin Dashboard restoranlar ro'yxatida `key` ko'rinmaslik muammosi hal qilindi (`licenseKey` -> `accessKey`).
    -   **Waiter App**: Brauzerda ochilganda Onboarding ekranini avtomatik o'tkazib yuborish qo'shildi (`window.electron` tekshiruvi).
-   **Hotfix 500 Error**:
    -   **Issue**: `synchronize: false` prevented schema updates; `synchronize: true` failed due to `NULL` names.
    -   **Fix**: Manually deleted invalid `NULL` records and forced schema migration.
-   **Sync Logic Overhaul**:
    -   **Foreign Key Fix**: `sync_service.cjs` da jadvallarni yuklash tartibi (Topological Sort) to'g'irlandi.
    -   **Data Overwrite Protection**: Lokal baza "fresh install" bo'lganda serverdagi ma'lumotni ezib yubormasligi uchun **Pull First** (Avval yuklab olish, keyin jo'natish) logikasi qo'shildi.
    -   **Admin Consolidation**: Agar serverdan Admin kelsa va lokalda Default Admin bo'lsa, lokal admin avtomatik o'chiriladi.
-   **Soft Delete**: `products`, `tables`, `users`, `customers` jadvallari uchun **Soft Delete** (`deleted_at`) tizimi joriy qilindi. Bu "o'chirilgan ma'lumotlarning qaytib qolishi" muammosini hal qildi.
-   **Cloud Server Sync**: `settings`, `kitchens`, `shifts`, `sms_templates` jadvallari `pull` ro'yxatiga qo'shildi (Server update talab qilinadi).
-   **Database**: Default ma'lumotlar (Admin, Kitchens) endi eski sana (2000-yil) bilan yaratiladi, toki serverdagi yangi ma'lumot ustunlik qilsin.
-   **CRITICAL FIX: Server Schema Relaxation**:
    -   **Issue**: Push 500 Error caused by strict UUID types (`"0"` vs UUID) and Timestamp formats (`"01:17 AM"` vs ISO).
    -   **Fix**: Relaxed Server DB schema on VPS:
        -   Converted `start_time`, `end_time` in `tables`/`shifts` to `TEXT`.
        -   Converted ID columns (`waiter_id`, `hall_id`, `customer_id`, etc.) to `TEXT` to accept `"0"` or legacy IDs.
        -   **Dropped Foreign Key Constraints** on server to allow syncing of data even if referenced entities are missing or have mismatching IDs. This ensures robust synchronization.
    -   **Missing Tables Created**: `order_items`, `debt_history`, `customer_debts`, `cancelled_orders`, `sms_logs` were manually created on VPS.
    -   **UI Fix**: "Shift Already Open" error fixed by forcing `checkShift()` on Login in `GlobalContext`.
    -   **Weighted Products Support**: 
        -   Added `unit_type` ('item' | 'kg') to `products` table.
        -   Implemented **Weight Input Modal** in Waiter App for 'kg' products.
        -   Updated `useCart` to handle float quantities.
    -   **Windows Build Success**: 
        -   Resolved `winCodeSign`/`7zip` issues using **Local Cache** (`.builder-cache`) and **Clean Reinstall**.
        -   Successfully generated `NadPOS Restoran Setup 2.0.0.exe` using `electron-builder` with custom environment variables.
    -   **Stolni Ko'chirish/Birlashtirish (Move/Merge Table)**:
        -   **Backend**: `orderController.moveTable` funksiyasi yaratildi. Bu funksiya buyurtmalarni bir stoldan boshqasiga ko'chiradi (agar bo'sh bo'lsa) yoki birlashtiradi (agar band bo'lsa).
        -   **UI**: `MoveTableModal` komponenti yaratildi va `OrderSummary` ga qo'shildi. Band stollar uchun "Stolni ko'chirish" tugmasi qo'shildi.
    -   **UI/UX Fixes**:
        -   **Dialog Z-Index**: `Dialog` komponenti `createPortal` yordamida `body` ga ko'chirildi, bu `TablesGrid` sarlavhasi ostida qolib ketish muammosini hal qildi.
        -   **DialogFooter**: `src/components/ui/dialog.jsx` ga `DialogFooter` eksporti qo'shildi.
        -   **Menu Modal**: Mahsulotlar ro'yxatidan va qidiruvdan mahsulot kodi ("Kod yo'q") olib tashlandi, faqat nomi va narxi qoldirildi.
    -   **Shift Modal**: Smenani yopish/ochish oynasiga "X" (yopish) tugmasi va "Bekor qilish" tugmasi qo'shildi. Bu notog'ri bosilishlarning oldini oladi.
    -   **Shift Logic**: Smenani yopishdan oldin faol stollar bor-yo'qligi tekshiriladi. Agar ochiq stollar bo'lsa, tizim smenani yopishga ruxsat bermaydi.
    -   **Modal Z-Index Fixes**: `PaymentModal`, `MenuModal` va `ShiftModal` ham `createPortal` yordamida `body` ga ko'chirildi. Bu barcha modallarning `TablesGrid` ustida to'g'ri ko'rinishini ta'minlaydi.
    -   **Payment Redesign**: To'lov oynasi qayta ishlandi (Numpad, Inline Inputs, Auto-calc). Split to'lov birlashtirildi.




## Keyingi Qadamlar
1.  **Monitoring**: Tizimning VPS dagi ishlashini kuzatish.
2.  **Lokalizatsiya**: O'zbek tili tarjimalarini tekshirish va to'ldirish.
3.  **Hujjatlashtirish**: `memory-bank` fayllarini doimiy yangilab borish.

## Faol Qarorlar
-   **Cloud-First Sync**: POS endi o'zini tanitish (`verify`) va sinxronizatsiya uchun `access_key` headeridan foydalanadi.
-   **Production URL**: Barcha so'rovlar `https://halboldi.uz/api` orqali Nginx proxyga yo'naltiriladi.
-   **Barcha hujjatlar O'zbek tilida** yuritiladi.
