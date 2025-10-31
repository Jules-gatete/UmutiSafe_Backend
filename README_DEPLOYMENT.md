# UmutiSafe Backend API

RESTful API for UmutiSafe - Medicine Disposal Management System

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/umutisafe-backend.git
cd umutisafe-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Setup database:
```bash
npm run db:migrate
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── scripts/         # Database scripts
│   ├── services/        # Business logic
│   └── server.js        # Entry point
├── uploads/             # File uploads
├── .env                 # Environment variables
└── package.json
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=umutisafe_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## 📚 API Documentation

Full API documentation available at: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require JWT token in header:
```
Authorization: Bearer <your_token>
```

### Main Endpoints

- **Auth**: `/api/auth/*` - User authentication
- **Disposals**: `/api/disposals/*` - Disposal records
- **Pickups**: `/api/pickups/*` - Pickup requests
- **Medicines**: `/api/medicines/*` - Medicine registry
- **CHWs**: `/api/chws/*` - Community health workers
- **Education**: `/api/education/*` - Educational content
- **Admin**: `/api/admin/*` - Admin operations

## 🗄️ Database

### Run Migrations
```bash
npm run db:migrate
```

### Seed Database
```bash
npm run db:seed
```

### Check Database
```bash
npm run db:check
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Test specific endpoint:
```bash
node test-login.js
```

## 🚀 Deployment

### Deploy to Render

1. Create PostgreSQL database on Render
2. Create Web Service pointing to this repo
3. Set environment variables
4. Deploy!

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed instructions.

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

## 📦 NPM Scripts

```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "db:migrate": "node src/scripts/migrate.js",
  "db:seed": "node src/scripts/seed.js",
  "db:check": "node src/scripts/check-tables.js"
}
```

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL + Sequelize ORM
- **Authentication**: JWT
- **Security**: Helmet, CORS
- **File Upload**: Multer
- **Logging**: Morgan

## 👥 User Roles

- **User**: Regular users (medicine disposal)
- **CHW**: Community Health Workers (pickup management)
- **Admin**: System administrators

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Helmet security headers
- CORS protection
- Input validation
- SQL injection prevention (Sequelize)
- XSS protection

## 📊 Database Models

- User
- Medicine
- Disposal
- PickupRequest
- EducationTip
- MedicineImage

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d umutisafe_db
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

## 📄 License

MIT

## 👨‍💻 Author

Your Name

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.
