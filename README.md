# Splendor - Car Wash Booking Platform

Splendor is a premium, real-time car wash booking system. It contains a mobile-first client reservation widget and a live synchronization admin control dashboard.

---

## 🚀 Key Features

1. **Exclusion Constraints (Double-Booking Prevention):** Enforced strictly at the PostgreSQL engine level using `EXCLUDE USING gist` on the `bookings` table. If multiple users attempt to checkout the same slot concurrently, PostgreSQL allows exactly one and blocks others with error code `23P01`.
2. **WebSocket Integration:** Using `Socket.io`, all updates (created bookings, admin rescheduling, drag-and-drops) instantly broadcast to active admin dashboards without page reloads.
3. **Dynamic Service Matrix:** Custom price/duration combinations matching car category (Sedan, SUV/Jeep, Minivan) dynamically calculating duration and calendar block sizes.
4. **CRM Logs:** Track customer lifetime values (LTV), visit frequencies, and detailed order history logs.

---

## 🛠️ Tech Stack

* **Frontend:** Nuxt 3 (Vue 3), Tailwind CSS, Pinia, Socket.io-client, Lucide Icons.
* **Backend:** Node.js (Express), TypeScript, Drizzle ORM, node-postgres, Socket.io.
* **Database:** PostgreSQL (with `btree_gist` extension).

---

## 📦 Project Setup

### 1. Database Initialization
Ensure you have a running PostgreSQL instance. Connect to your database server and execute the initialization script:
```bash
# Run this SQL file on your local database to set up extensions, tables, indices, and constraints
psql -U postgres -d your_db_name -f backend/src/database/schema.sql
```

### 2. Backend Setup
1. Open the `/backend` directory.
2. Review configuration in `.env` (it is pre-configured with default values for local testing).
3. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
4. Seed database with initial vehicle types, washing boxes, services, and prices:
   ```bash
   npm run db:seed
   ```
5. Launch API and WebSocket server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:4000`.*

### 3. Frontend Setup
1. Open the `/frontend` directory.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```
   *The Nuxt frontend will run on `http://localhost:3000`.*

---

## 🧪 Testing Constraints

### Parallel Concurrency Validation
To confirm PostgreSQL intercepts overlapping reservations, run the pre-configured concurrency simulation script inside the backend folder:
```bash
cd backend
npm run dev    # (Make sure backend is configured)
npx tsx src/database/test_concurrency.ts
```
This script runs two simultaneous insertions targeting the exact same Box and Time block, verifying that one is successful and the other fails with a clean constraint rejection.
