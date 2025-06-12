# Production Environment Variables Template

## 📋 Environment Setup for Production Deployment

This template provides all the environment variables needed to deploy the Blood Donor Registry application in a production environment.

### 🔧 Backend Environment Variables

Create a `backend/config.env` file with the following variables:

```bash
# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# Port number for the application (default: 3000)
PORT=3000

# Environment mode (production/development)
NODE_ENV=production

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Database host (IP address or domain name of your MySQL server)
DB_HOST=your-database-host.com
# Example: DB_HOST=192.168.1.100
# Example: DB_HOST=mysql.yourcompany.com

# Database username
DB_USER=your_database_user
# Example: DB_USER=blood_donor_app

# Database password (use a strong password)
DB_PASSWORD=your_secure_database_password
# Example: DB_PASSWORD=SecureP@ssw0rd2024!

# Database name
DB_NAME=blood_donor_registry

# Database port (default MySQL port: 3306)
DB_PORT=3306

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================

# JWT Secret Key (MUST be at least 32 characters, use a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
# Example: JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0

# JWT Token expiration time
JWT_EXPIRES_IN=7d

# =============================================================================
# OPTIONAL FRONTEND CONFIGURATION
# =============================================================================

# If you want to serve frontend from a different domain/port, uncomment and set:
# REACT_APP_API_URL=http://your-server-ip:3000/api
```

### 🌐 Frontend Environment Variables (Optional)

If you need to configure the frontend API URL, create a `frontend/.env.production` file:

```bash
# =============================================================================
# FRONTEND CONFIGURATION
# =============================================================================

# API Base URL (only needed if API is on different server/port)
# Leave empty to use relative URLs (recommended for same-server deployment)
REACT_APP_API_URL=/api

# If API is on different server, use:
# REACT_APP_API_URL=http://your-api-server-ip:3000/api
```

### 🔒 Security Best Practices

#### Database Security
- **Strong passwords**: Use at least 12 characters with mixed case, numbers, and symbols
- **Dedicated user**: Create a specific database user for the application (don't use root)
- **Network access**: Restrict database access to only the application server IP
- **Regular backups**: Set up automated database backups

#### JWT Security
- **Strong secret**: Use a cryptographically secure random string (minimum 32 characters)
- **Regular rotation**: Consider rotating JWT secrets periodically
- **Secure storage**: Never commit the actual JWT secret to version control

#### Network Security
- **Firewall**: Configure Windows Firewall to only allow necessary ports
- **VPN**: Consider using VPN for external access instead of opening to internet
- **HTTPS**: For external access, use SSL certificates and HTTPS

### 🚀 Quick Setup Commands

```bash
# 1. Copy and configure environment file
cp env.production.template backend/config.env
# Edit backend/config.env with your actual values

# 2. Build frontend
cd frontend
npm install
npm run build

# 3. Install backend dependencies
cd ../backend
npm install

# 4. Start production server
npm start
```

### 📊 Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port number |
| `NODE_ENV` | No | development | Environment mode |
| `DB_HOST` | Yes | localhost | Database server address |
| `DB_USER` | Yes | root | Database username |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_NAME` | No | blood_donor_registry | Database name |
| `DB_PORT` | No | 3306 | Database port |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | 7d | Token expiration time |
| `REACT_APP_API_URL` | No | /api | Frontend API base URL |

### ⚠️ Important Notes

1. **Never commit** actual environment files to version control
2. **Database initialization** is automatic - tables will be created on first run
3. **Admin user creation** - Run `node create-admin-user.js` after first startup
4. **Network access** - Server listens on all interfaces (0.0.0.0) for network access
5. **CORS disabled** - Configured for internal network use

### 🧪 Verification Steps

After setting up environment variables:

1. **Health check**: `http://your-server-ip:3000/health`
2. **API docs**: `http://your-server-ip:3000/api`
3. **Main app**: `http://your-server-ip:3000`
4. **Network test**: `http://your-server-ip:3000/network-test`

### 📞 Support

- See `NETWORK_ACCESS_GUIDE.md` for network configuration
- See `FRONTEND_TROUBLESHOOTING.md` for frontend issues
- See `PRODUCTION_DEPLOY.md` for complete deployment guide 