# Product Context

## Muammo
Restoranlar uchun mavjud bo'lgan ko'plab POS tizimlari quyidagi muammolarga ega:
-   **Internetga bog'liqlik**: Internet uzilganda ish to'xtab qoladi.
-   **Murakkablik**: O'rganish va ishlatish qiyin bo'lgan interfeyslar.
-   **Sekin ishlash**: Katta hajmdagi buyurtmalar bilan ishlashda sekinlashish.
-   **Ma'lumotlar yaxlitligi**: Bir nechta qurilmalar o'rtasida ma'lumotlarni sinxronlashdagi xatoliklar.

## Yechim
NadPos Restoran quyidagi yechimlarni taklif etadi:
-   **Gibrid Arxitektura**: Lokal ma'lumotlar bazasi (SQLite) oflayn ishlashni ta'minlaydi, bulutli server esa markazlashgan boshqaruvni beradi.
-   **Intuitiv UI**: Ofitsiantlar tez o'rganishi uchun sodda va tushunarli dizayn.
-   **Real vaqt rejimi**: Socket.io orqali barcha qurilmalarda buyurtmalar holatini real vaqtda yangilash.

## Foydalanuvchi Tajribasi (UX) Maqsadlari
-   **Tezlik**: Buyurtma qabul qilish va to'lov jarayonini minimal bosishlar bilan amalga oshirish.
-   **Ishonchlilik**: Tizim har qanday sharoitda (internet bor/yo'q) barqaror ishlashi kerak.
-   **Ko'rinish**: Chiroyli va ko'zni charchatmaydigan "Dark Mode" va zamonaviy elementlar.
