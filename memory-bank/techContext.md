# Tech Context

## Texnologiyalar
### Backend (Cloud Server)
-   **Language**: TypeScript.
-   **Framework**: NestJS.
-   **Database**: PostgreSQL (Docker container `nadpos_db` v15-alpine).
-   **ORM**: TypeORM.
-   **Real-time**: Socket.io.

### Frontend / Desktop (POS Desktop)
-   **Language**: JavaScript / TypeScript.
-   **Runtime**: Electron (`^33.2.1`).
-   **Framework**: React (Vite).
-   **Local DB**: better-sqlite3 (v2 schema, UUIDs, Soft Delete supported).
-   **HTTP Client**: Axios & Fetch.

### Cloud Admin
-   **Framework**: React (Vite).
-   **Deploy**: Nginx Static Hosting.

## Production Environment (VPS)
-   **Server**: Ubuntu (213.142.148.35).
-   **Domain**: `https://halboldi.uz`.
-   **Web Server**: Nginx (Reverse Proxy + SSL by Let's Encrypt).
-   **Backend Process**: PM2 (`nadpos-cloud`).
-   **Backend Process**: PM2 (`nadpos-cloud`).
-   **Database**: Docker Container.
    -   **Strategy**: "Relaxed Schema" for Sync Compatibility.
    -   **IDs**: Stored as `TEXT` to handle generic/legacy formats (e.g. "0").
    -   **Constraints**: Foreign Keys crippled/removed to prevent Sync 500 errors on orphaned data.

## Rivojlanish Muhiti (Development Setup)
-   **Node.js**: v20+ tavsiya etiladi.
-   **Commands**:
    -   `npm run dev`: Cloud serverni lokal ishga tushirish (agar root da bo'lsa).
    -   `npm run electron:dev`: POS Desktopni development rejimida ishga tushirish.
    -   `npm run build`: Loyihani yig'ish.

## Texnik Cheklovlar
-   **Internet**: POS oflayn ishlay oladi, lekin dastlabki sozlash (`Onboarding`) uchun internet kerak.
-   **OS**: Linux (Arch/Ubuntu), Windows, macOS.
