# System Patterns

## Tizim Arxitekturasi
Loyiha **Monorepo** tuzilishiga ega bo'lib, quyidagi asosiy qismlardan iborat:

```mermaid
graph TD
    User((Foydalanuvchi))
    Admin((Admin))
    
    subgraph VPS [VPS Server (213.142.148.35)]
        Nginx[Nginx Proxy]
        CS[Cloud Server (NestJS)]
        PG[PostgreSQL (Docker)]
        CA[Cloud Admin (React/Vite)]
    end
    
    subgraph Restaurant [Restoran]
        POS[POS Desktop (Electron)]
        LDB[SQLite (Local)]
    end
    
    User -->|HTTPS| Nginx
    Admin -->|HTTPS| Nginx
    
    Nginx -->|/api| CS
    Nginx -->|/| CA
    
    CS --> PG
    POS <-->|Sync (REST + x-access-key)| Nginx
    POS <--> LDB
```

### Komponentlar
1.  **Cloud Server (`apps/cloud-server`)**:
    -   **Framework**: NestJS.
    -   **Vazifasi**: API, Auth (`x-access-key`), DB, Socket.io.
    -   **Deploy**: PM2 ostida ishlaydi (`nadpos-cloud`).

2.  **POS Desktop (`apps/pos-desktop`)**:
    -   **Framework**: Electron + React.
    -   **Onboarding**: Birinchi marta ishga tushganda Restoran ID va Access Key so'raydi.
    -   **Sync**: `Settings` jadvalidan credentials olib, har bir so'rovda headerga qo'shadi.

3.  **Cloud Admin (`apps/cloud-admin`)**:
    -   **Vazifasi**: Restoranlarni yaratish va boshqarish.
    -   **Deploy**: Nginx orqali statik fayllar sifatida (`/var/www/halboldi`).

### Xavfsizlik va Autentifikatsiya
-   **POS Auth**: Har bir restoran uchun unikal `uuid` va `access_key` (generate qilinadi).
-   **Verification**: POS serverga `GET /restaurants/:id/verify` orqali murojaat qilib, kalit to'g'riligini tekshiradi.
-   **Sync Security**: Barcha Sync API lari `x-access-key` headerini talab qiladi.

## Ma'lumotlar Oqimi
1.  **Onboarding**: Admin yangi restoran yaratadi -> ID va Key oladi -> POS ga kiritadi -> POS server bilan bog'lanadi.
2.  **Sinxronizatsiya**:
    -   **Push**: POS dagi o'zgarishlar (`is_synced=0`) serverga yuboriladi.
    -   **Pull**: Serverdagi so'nggi o'zgarishlar (`last_pulled_at` dan keyingi) POS ga yuklanadi.
    -   **Logic**: Dastur ishga tushganda **AVVAL PULL**, keyin PUSH bajariladi.
    -   **Deletions**: O'chirishlar **Soft Delete** (`deleted_at`) orqali amalga oshiriladi va sinxronizatsiya qilinadi.

