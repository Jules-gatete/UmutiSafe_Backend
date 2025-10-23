# UmutiSafe Backend - Deployment Checklist

## 📋 Pre-Deployment Checklist

### ✅ Development Setup

- [ ] Node.js installed (v14+)
- [ ] PostgreSQL installed (v12+)
- [ ] Database created (`umutisafe_db`)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Database migrated (`npm run db:migrate`)
- [ ] Sample data seeded (`npm run db:seed`)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Health check endpoint works (`/api/health`)

### ✅ Testing

- [ ] All authentication endpoints tested
- [ ] User registration works
- [ ] Login returns valid JWT token
- [ ] Protected routes require authentication
- [ ] Role-based access control works
- [ ] Disposal CRUD operations work
- [ ] Pickup request creation works
- [ ] Medicine search works
- [ ] ML prediction endpoints work
- [ ] File upload works
- [ ] Admin endpoints work
- [ ] CHW endpoints work
- [ ] Education tips endpoints work

### ✅ Frontend Integration

- [ ] Frontend API client configured
- [ ] CORS settings correct
- [ ] Login flow works end-to-end
- [ ] User dashboard displays data
- [ ] CHW dashboard displays data
- [ ] Admin dashboard displays data
- [ ] All forms submit successfully
- [ ] Error handling works
- [ ] Token refresh/expiry handled

### ✅ Security Review

- [ ] JWT secret is strong and unique
- [ ] Passwords are hashed (bcrypt)
- [ ] SQL injection protection (Sequelize)
- [ ] XSS protection (Helmet)
- [ ] CORS configured properly
- [ ] File upload restrictions in place
- [ ] Rate limiting considered
- [ ] Environment variables not committed
- [ ] Sensitive data not logged
- [ ] HTTPS ready (for production)

### ✅ Database

- [ ] All tables created successfully
- [ ] Model associations work
- [ ] Indexes added for performance
- [ ] Backup strategy planned
- [ ] Migration scripts tested
- [ ] Seed data works
- [ ] Database credentials secure

### ✅ Code Quality

- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] Input validation in place
- [ ] Code follows consistent style
- [ ] Comments added where needed
- [ ] No hardcoded values
- [ ] Environment-specific configs

## 🚀 Production Deployment Steps

### 1. Environment Setup

```bash
# Set production environment
NODE_ENV=production

# Use strong JWT secret
JWT_SECRET=<generate-strong-random-secret>

# Configure production database
DB_HOST=<production-db-host>
DB_NAME=<production-db-name>
DB_USER=<production-db-user>
DB_PASSWORD=<strong-password>

# Set production CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Database Setup

```bash
# Create production database
createdb umutisafe_production

# Run migrations
npm run db:migrate

# Optionally seed initial data
npm run db:seed
```

### 3. Server Configuration

**Option A: Traditional Server (VPS/EC2)**

```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start src/server.js --name umutisafe-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Option B: Docker**

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - db
  
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: umutisafe_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Option C: Cloud Platforms**

- **Heroku**: Add `Procfile` with `web: npm start`
- **Railway**: Connect GitHub repo, auto-deploys
- **Render**: Connect repo, configure build command
- **AWS Elastic Beanstalk**: Use Node.js platform
- **Google Cloud Run**: Containerize and deploy

### 4. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.umutisafe.rw;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.umutisafe.rw

# Auto-renewal
sudo certbot renew --dry-run
```

### 6. Monitoring & Logging

**PM2 Monitoring:**
```bash
pm2 logs umutisafe-api
pm2 monit
```

**Log Management:**
- Use Winston or Bunyan for structured logging
- Send logs to CloudWatch, Loggly, or Papertrail
- Set up error alerting (Sentry, Rollbar)

**Performance Monitoring:**
- New Relic
- DataDog
- Application Insights

### 7. Database Backups

**Automated PostgreSQL Backups:**
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres umutisafe_db > backup_$DATE.sql
# Upload to S3 or cloud storage
```

**Cron job:**
```bash
0 2 * * * /path/to/backup-script.sh
```

### 8. Performance Optimization

- [ ] Enable gzip compression (already included)
- [ ] Add Redis for caching
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Enable CDN for static files
- [ ] Implement rate limiting
- [ ] Use connection pooling

### 9. Security Hardening

- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Implement rate limiting
- [ ] Add request size limits
- [ ] Enable CSRF protection
- [ ] Set security headers (Helmet)
- [ ] Regular dependency updates
- [ ] Security audits (`npm audit`)

### 10. CI/CD Pipeline

**GitHub Actions Example:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Deploy to production
        run: |
          # Your deployment commands
```

## 📊 Post-Deployment Verification

- [ ] API health check returns 200
- [ ] Database connection successful
- [ ] All endpoints accessible
- [ ] HTTPS working
- [ ] CORS configured correctly
- [ ] File uploads working
- [ ] Logs being generated
- [ ] Monitoring active
- [ ] Backups running
- [ ] Error tracking active

## 🔧 Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Monitor API performance
- [ ] Check disk space

### Weekly
- [ ] Review security alerts
- [ ] Check backup integrity
- [ ] Update dependencies

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Database optimization
- [ ] Cost analysis

## 🆘 Troubleshooting

### Server won't start
1. Check `.env` file exists and is configured
2. Verify database is running
3. Check port 5000 is available
4. Review error logs

### Database connection fails
1. Verify PostgreSQL is running
2. Check database credentials
3. Ensure database exists
4. Check firewall rules

### 401 Unauthorized errors
1. Check JWT token is being sent
2. Verify token hasn't expired
3. Check JWT_SECRET matches

### CORS errors
1. Verify CORS_ORIGIN in `.env`
2. Check frontend URL matches
3. Ensure credentials included

## 📞 Support Contacts

- **Database Issues**: DBA team
- **Server Issues**: DevOps team
- **Application Issues**: Development team
- **Security Issues**: Security team

## 🎯 Success Metrics

Track these metrics post-deployment:
- API response time (< 200ms average)
- Error rate (< 1%)
- Uptime (> 99.9%)
- Database query time
- Active users
- API requests per minute

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Version**: _____________

**Notes**: _____________

