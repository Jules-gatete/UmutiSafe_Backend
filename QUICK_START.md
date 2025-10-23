# UmutiSafe Backend - Quick Start Guide

Get the backend up and running in 5 minutes!

## Prerequisites

Make sure you have installed:
- ✅ Node.js (v14 or higher) - [Download](https://nodejs.org/)
- ✅ PostgreSQL (v12 or higher) - [Download](https://www.postgresql.org/download/)

## Step-by-Step Setup

### 1. Install PostgreSQL

**Windows:**
- Download PostgreSQL installer from official website
- Run installer and follow the wizard
- Remember the password you set for the `postgres` user
- PostgreSQL will run on port 5432 by default

**Mac (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

Open PostgreSQL command line (psql) or use pgAdmin:

```sql
CREATE DATABASE umutisafe_db;
```

Or using command line:
```bash
# Windows (Command Prompt)
psql -U postgres -c "CREATE DATABASE umutisafe_db;"

# Mac/Linux
sudo -u postgres psql -c "CREATE DATABASE umutisafe_db;"
```

### 3. Install Node.js Dependencies

Navigate to the backend folder and install packages:

```bash
cd backend
npm install
```

This will install all required packages including:
- Express.js (web framework)
- Sequelize (ORM - auto-creates tables)
- PostgreSQL driver
- JWT for authentication
- And more...

### 4. Configure Environment Variables

The `.env` file is already created with default values. Update if needed:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=umutisafe_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
```

**Important:** Change `DB_PASSWORD` to match your PostgreSQL password!

### 5. Run Database Migrations

This will automatically create all database tables:

```bash
npm run db:migrate
```

You should see:
```
✅ Database connection established successfully.
✅ Database synchronized successfully.
```

### 6. Seed Sample Data (Optional but Recommended)

Load sample data including test users, medicines, and more:

```bash
npm run db:seed
```

This creates:
- 5 test users (1 regular user, 3 CHWs, 1 admin)
- 6 medicines
- Sample disposals and pickup requests
- Education tips

### 7. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
✅ Database connection established successfully.
✅ Database synchronized successfully.
🚀 Server running in development mode on port 5000
📍 API URL: http://localhost:5000
🏥 Health check: http://localhost:5000/api/health
```

### 8. Test the API

Open your browser and visit:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "success": true,
  "message": "UmutiSafe API is running",
  "timestamp": "2024-10-14T..."
}
```

## Test Credentials

After seeding, use these credentials to test:

**Regular User:**
- Email: `jean.baptiste@email.com`
- Password: `password123`

**Community Health Worker:**
- Email: `marie.claire@email.com`
- Password: `password123`

**Admin:**
- Email: `admin@umutisafe.gov.rw`
- Password: `admin123`

## Testing with Postman

1. Import the `postman_collection.json` file into Postman
2. Use the "Login" request to get a JWT token
3. Copy the token from the response
4. Set it in the collection variable `token`
5. Now you can test all protected endpoints!

## Common Issues & Solutions

### Issue: "Unable to connect to database"

**Solution:**
- Make sure PostgreSQL is running
- Check your database credentials in `.env`
- Verify the database exists: `psql -U postgres -l`

### Issue: "Port 5000 already in use"

**Solution:**
- Change the PORT in `.env` file to another port (e.g., 5001)
- Or stop the process using port 5000

### Issue: "Module not found"

**Solution:**
- Delete `node_modules` folder
- Run `npm install` again

### Issue: Tables not created

**Solution:**
- Run `npm run db:migrate` again
- Check PostgreSQL logs for errors
- Ensure your database user has CREATE TABLE permissions

## Database Tables Created

The following tables are automatically created:

1. **users** - User accounts (household users, CHWs, admins)
2. **medicines** - FDA-approved medicines registry
3. **disposals** - Medicine disposal records
4. **pickup_requests** - CHW pickup requests
5. **education_tips** - Educational content

## Next Steps

1. **Connect Frontend:**
   - Update frontend API base URL to `http://localhost:5000/api`
   - Test login and other features

2. **Explore API:**
   - Read `API_DOCUMENTATION.md` for all endpoints
   - Use Postman collection for testing

3. **Customize:**
   - Add more medicines to the registry
   - Create additional users
   - Modify models as needed

## Useful Commands

```bash
# Install dependencies
npm install

# Run migrations (create tables)
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev

# Start production server
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, error handling, uploads
│   ├── models/          # Database models (auto-create tables)
│   ├── routes/          # API routes
│   ├── scripts/         # Migration and seed scripts
│   └── server.js        # Main application
├── uploads/             # Uploaded files
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify PostgreSQL is running
3. Ensure all environment variables are correct
4. Check that the database exists and is accessible

## Production Deployment

Before deploying to production:

1. Change `NODE_ENV` to `production`
2. Use a strong `JWT_SECRET`
3. Use environment-specific database credentials
4. Enable HTTPS
5. Set up proper CORS origins
6. Consider adding rate limiting
7. Set up database backups

---

**You're all set! 🎉**

The backend is now running and ready to integrate with the frontend.

