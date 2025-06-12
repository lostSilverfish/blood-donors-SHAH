# Production Deployment Guide

## Changes Made for Production Readiness

### 1. CORS Configuration Fixed
- Updated CORS configuration to use environment variables instead of hardcoded localhost
- Added support for multiple production domains
- Added proper HTTP methods and headers configuration

### 2. Database Timestamp Issues Fixed
- Removed problematic `updated_at` TIMESTAMP fields that can cause production errors
- Simplified schema to use only `created_at` timestamps
- Made database configuration environment-based

### 3. Localhost References Removed
- Updated API base URL to use relative paths (`/api`) instead of localhost
- Removed development proxy configuration from package.json
- Made all configuration environment-based

## Production Deployment Steps

### 1. Set Environment Variables

Create a `backend/config.env` file with your production values (use `env.production.template` as reference):

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=blood_donor_registry
DB_PORT=3306

# JWT Configuration (MUST be secure for production)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters
JWT_EXPIRES_IN=7d

# CORS Configuration (Your production domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

### 2. Database Setup

1. Create your production MySQL database
2. Update the database credentials in `config.env`
3. The app will automatically create tables on first run

### 3. Build Frontend

```bash
cd frontend
npm install
npm run build
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Start Production Server

```bash
cd backend
npm start
```

### 6. Create Admin User

```bash
cd backend
node create-admin-user.js
```

## Security Considerations

1. **JWT Secret**: Must be at least 32 characters long and cryptographically secure
2. **Database**: Use strong passwords and restrict access to production database
3. **CORS**: Only allow your actual production domains
4. **Environment Variables**: Never commit production config.env to version control
5. **SSL**: Always use HTTPS in production

## Nginx Configuration (Optional)

If using Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## PM2 Process Manager (Recommended)

Install PM2 for production process management:

```bash
npm install -g pm2
cd backend
pm2 start server.js --name "blood-donor-api"
pm2 startup
pm2 save
```

## Health Check

Your app will be available at:
- Health check: `https://yourdomain.com/health`
- API documentation: `https://yourdomain.com/api`

## Troubleshooting

1. **CORS Errors**: Ensure your domain is in ALLOWED_ORIGINS
2. **Database Connection**: Verify database credentials and network access
3. **404 Errors**: Ensure frontend build files are in `frontend/build/` directory
4. **JWT Errors**: Verify JWT_SECRET is set and secure 