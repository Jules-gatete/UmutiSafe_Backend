# UmutiSafe Backend API

Node.js backend API for UmutiSafe - Safe Medicine Disposal Platform

## Features

- ✅ **Automatic Table Creation** - Uses Sequelize ORM (like Hibernate) to automatically create database tables
- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control (User, CHW, Admin)
- 💊 **Medicine Management** - FDA registry, search, and ML prediction endpoints
- 🗑️ **Disposal Tracking** - Create, track, and manage medicine disposals
- 🚚 **Pickup Requests** - Request and manage CHW pickups
- 👥 **User Management** - Complete user CRUD operations
- 📊 **Admin Dashboard** - System statistics and reporting
- 📚 **Education Tips** - Health and safety information management
- 📁 **File Upload** - Image upload for medicine identification

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize (auto-creates tables like Hibernate)
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Security**: Helmet, bcryptjs
- **Validation**: express-validator

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup PostgreSQL Database

Create a new PostgreSQL database:
```sql
CREATE DATABASE umutisafe_db;
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=umutisafe_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:5173
```

### 5. Seed Database with Sample Data
```bash
npm run db:seed
```

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start at `http://localhost:5000`

## Database Tables

The following tables are **automatically created** by Sequelize:

- `users` - User accounts (household users, CHWs, admins)
- `medicines` - FDA-approved medicines registry
- `disposals` - Medicine disposal records
- `pickup_requests` - CHW pickup requests
- `education_tips` - Educational content

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Disposals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/disposals` | Get user's disposals |
| POST | `/api/disposals` | Create disposal |
| GET | `/api/disposals/:id` | Get single disposal |
| PUT | `/api/disposals/:id` | Update disposal |
| DELETE | `/api/disposals/:id` | Delete disposal |
| GET | `/api/disposals/stats` | Get disposal statistics |

### Pickup Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pickups` | Get user's pickup requests |
| POST | `/api/pickups` | Create pickup request |
| GET | `/api/pickups/chw` | Get CHW's assigned pickups (CHW only) |
| GET | `/api/pickups/:id` | Get single pickup request |
| PUT | `/api/pickups/:id/status` | Update pickup status (CHW only) |
| PUT | `/api/pickups/:id/cancel` | Cancel pickup request |
| GET | `/api/pickups/chw/stats` | Get CHW statistics |

### Medicines
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medicines` | Get all medicines |
| GET | `/api/medicines/search?q=query` | Search medicines |
| GET | `/api/medicines/:id` | Get single medicine |
| POST | `/api/medicines/predict/text` | Predict from text input |
| POST | `/api/medicines/predict/image` | Predict from image upload |
| POST | `/api/medicines` | Create medicine (Admin only) |
| PUT | `/api/medicines/:id` | Update medicine (Admin only) |
| DELETE | `/api/medicines/:id` | Delete medicine (Admin only) |

### Community Health Workers (CHWs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chws` | Get all CHWs |
| GET | `/api/chws/nearby?sector=Remera` | Get nearby CHWs |
| GET | `/api/chws/:id` | Get single CHW |
| PUT | `/api/chws/availability` | Update availability (CHW only) |

### Education Tips
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/education` | Get all tips |
| GET | `/api/education/:id` | Get single tip |
| POST | `/api/education` | Create tip (Admin only) |
| PUT | `/api/education/:id` | Update tip (Admin only) |
| DELETE | `/api/education/:id` | Delete tip (Admin only) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get system statistics |
| GET | `/api/admin/users` | Get all users |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/disposals` | Get all disposals |
| GET | `/api/admin/pickups` | Get all pickup requests |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |
| GET | `/` | API information |

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

To get a token, login via `/api/auth/login` endpoint.

## Role-Based Access Control

- **User** - Can create disposals, request pickups, view their own data
- **CHW** - Can view and manage assigned pickup requests, update availability
- **Admin** - Full access to all resources, system statistics, user management

## File Upload

Medicine images can be uploaded to `/api/medicines/predict/image`:

```bash
curl -X POST http://localhost:5000/api/medicines/predict/image \
  -F "image=@medicine.jpg"
```

Uploaded files are stored in the `uploads/` directory.

## Error Handling

All errors return a consistent JSON format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

## Development

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/             # Route controllers
│   │   ├── authController.js
│   │   ├── disposalController.js
│   │   ├── pickupController.js
│   │   ├── medicineController.js
│   │   ├── chwController.js
│   │   ├── educationController.js
│   │   └── adminController.js
│   ├── middleware/              # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── upload.js
│   ├── models/                  # Sequelize models (auto-create tables)
│   │   ├── User.js
│   │   ├── Medicine.js
│   │   ├── Disposal.js
│   │   ├── PickupRequest.js
│   │   ├── EducationTip.js
│   │   └── index.js
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js
│   │   ├── disposalRoutes.js
│   │   ├── pickupRoutes.js
│   │   ├── medicineRoutes.js
│   │   ├── chwRoutes.js
│   │   ├── educationRoutes.js
│   │   └── adminRoutes.js
│   ├── scripts/                 # Utility scripts
│   │   └── seed.js
│   └── server.js                # Main application file
├── uploads/                     # Uploaded files
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── .gitignore
├── package.json
└── README.md
