# Silayi Master Backend (سیلائی ماسٹر بیک اینڈ)

A modern, production-grade NestJS REST API and database engine for **Silayi Master** — Bespoke Tailoring Ledger & Measurement Book (درزی کھاتہ اور پیمائش بک).

---

## 🚀 Architectural Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js TypeScript framework)
- **Database**: MongoDB with [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcryptjs`)
- **Validation**: `class-validator` & `class-transformer`
- **Configuration**: `@nestjs/config` with `.env` support
- **Design Pattern**: Domain-Driven Modular Architecture (matching `business-hub-backend`)

---

## 📁 Project Structure

```
silayi-master-backend/
├── src/
│   ├── auth/                # Authentication & Session Management
│   │   ├── dto/             # Signup, Login, ForgotPassword, VerifyCode, ResetPassword DTOs
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── auth.module.ts
│   ├── shops/               # Tailor Shop Profiles & Auto-Increment Counters
│   │   ├── schemas/         # Shop schema (name, urdu_name, phone, prefixes)
│   │   ├── dto/
│   │   ├── shops.controller.ts
│   │   ├── shops.service.ts
│   │   └── shops.module.ts
│   ├── users/               # Tailor / Owner User Accounts & Roles
│   │   ├── schemas/         # User schema with shop ref & password hash
│   │   ├── dto/
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── clients/             # Client Profiles & Khata Records
│   │   ├── schemas/         # Client schema (serial_number, phone, financials)
│   │   ├── dto/
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   └── clients.module.ts
│   ├── measurements/        # Suit Measurement Book & Orders
│   │   ├── schemas/         # Measurement schema (Kameez, Shalwar, slip #, status)
│   │   ├── dto/
│   │   ├── measurements.controller.ts
│   │   ├── measurements.service.ts
│   │   └── measurements.module.ts
│   ├── ledger/              # Client Ledger History & WhatsApp Slip Generator
│   │   ├── ledger.controller.ts
│   │   ├── ledger.service.ts
│   │   └── ledger.module.ts
│   ├── dashboard/           # Tailor Shop Statistics & Live Metrics
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.service.ts
│   │   └── dashboard.module.ts
│   ├── seed/                # Initial Demo Database Seeder
│   │   ├── seed.controller.ts
│   │   ├── seed.service.ts
│   │   └── seed.module.ts
│   ├── common/              # Guards & Decorators (@Public, @CurrentUser, JwtAuthGuard)
│   ├── enums/               # Enums (GarmentType, OrderStatus, PaymentStatus, Role)
│   ├── app.module.ts        # Core application root module
│   └── main.ts              # Entry point with ValidationPipe & CORS
├── .env.example
├── .env
├── package.json
└── tsconfig.json
```

---

## 🛠️ Environment Configuration

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=silayi-master
MONGODB_DB_NAME=silayi_master
PORT=3003
JWT_SECRET=supersecret_jwt_key_silayi_master
```

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Start development server (with hot reload)
npm run start:dev

# 4. Start production server
npm run start:prod
```

Server runs on: **http://localhost:3003** (or configured `PORT`)

---

## 🐳 Docker Deployment (Server)

The backend includes a production-grade multi-stage Docker setup running on port **3003**. See full details in [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md).

### Quick Deployment via Script:
```bash
cp .env.example .env
nano .env
./deploy.sh
```

### Or using Docker Compose:
```bash
# Launch on port 3003 with MongoDB Atlas (cloud database)
docker compose up -d --build

# Or launch with self-hosted MongoDB container:
docker compose -f docker-compose.local-db.yml up -d --build
```

- **Healthcheck Endpoint**: `http://localhost:3003/health`
- **View Logs**: `docker compose logs -f`
- **Stop**: `docker compose down`

---

## 🔑 Demo Credentials

A seed endpoint is provided to instantly populate the database with realistic craftsman tailoring records:

```bash
curl -X POST http://localhost:3003/seed
```

- **Demo Shop**: Al-Karam Tailors (الکرم ٹیلرز)
- **Tailor Name**: Master Muhammad Tariq
- **Email**: `master@silayimaster.com`
- **Phone**: `03001234567`
- **Password**: `password123`

---

## 📡 API Endpoints Reference

### 1. Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | Public | Register new tailor shop & owner account |
| `POST` | `/auth/login` | Public | Login via email or phone + password |
| `POST` | `/auth/forgot-password` | Public | Check email and dispatch 6-digit reset code |
| `POST` | `/auth/verify-code` | Public | Verify 6-digit reset code |
| `POST` | `/auth/reset-password` | Public | Update to new password |
| `GET` | `/auth/me` | Bearer | Get current authenticated tailor profile |

### 2. Dashboard (`/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/dashboard/metrics` | Bearer | Total clients, In Stitching, Ready, Delivered, and revenue totals |

### 3. Clients (`/clients`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/clients` | Bearer | List clients with search by serial #, name, or phone |
| `GET` | `/clients/:id` | Bearer | Get single client profile & default sizes |
| `POST` | `/clients` | Bearer | Add new client |
| `PUT` | `/clients/:id` | Bearer | Update client details |
| `DELETE` | `/clients/:id` | Bearer | Delete client |

### 4. Measurements & Suit Book (`/measurements`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/measurements` | Bearer | Filter by category (`shalwar_kameez`, `kurta_pajama`, `waistcoat`), search, status |
| `GET` | `/measurements/:id` | Bearer | Get full slip details and measurements |
| `POST` | `/measurements` | Bearer | Create measurement order (auto-increments slip # & updates client) |
| `PUT` | `/measurements/:id` | Bearer | Edit measurement dimensions & details |
| `PATCH` | `/measurements/:id/payment` | Bearer | Update payment status (`paid`, `partial`, `unpaid`) |
| `PATCH` | `/measurements/:id/status` | Bearer | Update order status (`in_progress`, `ready`, `delivered`) |
| `DELETE` | `/measurements/:id` | Bearer | Delete measurement |

### 5. Client Ledger (`/ledger`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/ledger/client/:clientId` | Bearer | Full chronological client ledger history (latest on top) |
| `GET` | `/ledger/client/:clientId/whatsapp-summary` | Bearer | Generates bilingual WhatsApp ledger statement & URL |
| `GET` | `/ledger/slip/:measurementId/whatsapp-slip` | Bearer | Generates bilingual WhatsApp single order slip & URL |
| `POST` | `/ledger/client/:clientId/mark-paid` | Bearer | Mark all unpaid slips of client as fully paid |

### 6. Tailor Shop Profile (`/shops`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/shops/my-shop` | Bearer | Get shop details, slip counter, and serial counter |
| `PUT` | `/shops/my-shop` | Bearer | Update shop name, Urdu title, address, phone |
