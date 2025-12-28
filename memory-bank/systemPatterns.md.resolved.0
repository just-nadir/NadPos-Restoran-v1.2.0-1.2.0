# System Patterns

## Tizim Arxitekturasi
Loyiha **Monorepo** tuzilishiga ega bo'lib, quyidagi asosiy qismlardan iborat:

```mermaid
graph TD
    A[Cloud Server] -->|REST API & Socket.io| B(POS Desktop)
    A -->|REST API| C(Cloud Admin)
    D[PostgreSQL] --> A
    E[SQLite] -.-> B
```

### Komponentlar
1.  **Cloud Server (`apps/cloud-server`)**:
    -   **Framework**: NestJS.
    -   **Vazifasi**: Markaziy mantiq, ma'lumotlar bazasi bilan ishlash, autentifikatsiya.
    -   **Aloqa**: REST API va WebSockets (Socket.io).

2.  **POS Desktop (`apps/pos-desktop`)**:
    -   **Framework**: Electron + React (Vite).
    -   **Vazifasi**: Restoran ichidagi savdo jarayonlarini boshqarish.
    -   **Xususiyati**: Oflayn ishlash imkoniyati (SQLite lokal bazasi).

3.  **Cloud Admin (`apps/cloud-admin`)**:
    -   **Vazifasi**: Tizim ma'murlari va restoran egalari uchun boshqaruv paneli.

### Asosiy Dizayn Patternlari
-   **Repository Pattern**: Ma'lumotlar bazasi bilan ishlashni abstraksiya qilish (TypeORM).
-   **Dependency Injection**: NestJS da servislarni boshqarish uchun.
-   **Component-Based Architecture**: React da UI ni modullarga ajratish.
-   **Event-Driven Architecture**: Socket.io orqali real vaqtda yangilanishlar.

## Ma'lumotlar Oqimi
1.  **Buyurtma Yaratish**: POS Desktop -> Local DB -> Cloud Server.
2.  **Sinxronizatsiya**: Internet paydo bo'lganda, lokal o'zgarishlar bulutga yuboriladi va bulutdan yangi ma'lumotlar olinadi.
