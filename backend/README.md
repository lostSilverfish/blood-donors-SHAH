# Blood Donor Management System (Simplified)

A streamlined blood donor management system designed for administrators to efficiently manage donor records and track donation history.

## ✨ What Changed

### 🎯 Simplified Approach

- **Admin-only system**: No user registration, only administrators manage donors
- **Essential fields only**: Streamlined to Name, Contact, Blood Group, Last/Next Donation dates
- **Focused functionality**: Direct donor management without unnecessary complexity

### 🗄️ Database Schema (Updated)

#### Users Table

```sql
- id (Primary Key)
- username
- email
- password (hashed)
- role ('admin' only)
- created_at
- updated_at
```

#### Donors Table (Simplified)

```sql
- id (Primary Key)
- donor_name (Full Name)
- blood_type (A+, A-, B+, B-, AB+, AB-, O+, O-)
- contact_number (Unique)
- date_of_last_donation
- next_donation_date (Auto-calculated: last + 3 months)
- is_active (Boolean)
- created_at
- updated_at
```

#### Donation History Table

```sql
- id (Primary Key)
- donor_id (Foreign Key)
- donation_date
- blood_units (Default: 1.0)
- donation_center
- notes
- created_at
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- MySQL (v8.0+)
- npm or yarn

### 1. Database Setup

```bash
# Run database restructuring
cd backend
node restructure-database.js

# Generate dummy data (100 donors with donation history)
node generate-simplified-dummy-data.js

# Set admin password
node reset-admin-password.js
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

## 👤 Admin Access

### Login Credentials

```
Username: admin
Password: Admin123!
```

### Access URLs

- **Frontend**: http://localhost:3000
- **Admin Login**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin
- **Backend API**: http://localhost:5000

## 📋 System Features

### Admin Dashboard

- ✅ View all donors with pagination and filtering
- ✅ Add new donors (Name, Blood Type, Contact, Last Donation)
- ✅ Edit existing donor information
- ✅ View donor details and donation history
- ✅ Deactivate/reactivate donors
- ✅ Record new donations
- ✅ Search by name, blood type, contact
- ✅ Filter by blood type and status
- ✅ Dashboard statistics and analytics

### Public Features

- ✅ Landing page with blood type finder
- ✅ Search donors by blood type (public access)
- ✅ View individual donor details
- ✅ Blood type compatibility information

## 🔧 API Endpoints

### Authentication (Admin Only)

```
POST /api/auth/login          # Admin login
GET  /api/auth/me             # Get current admin user
```

### Donor Management

```
GET    /api/donors                    # Get all donors (paginated)
GET    /api/donors/:id               # Get single donor
GET    /api/donors/blood-type/:type  # Get donors by blood type
POST   /api/donors                   # Create new donor (admin)
PUT    /api/donors/:id               # Update donor (admin)
DELETE /api/donors/:id               # Deactivate donor (admin)
POST   /api/donors/:id/donation      # Record donation (admin)
```

## 📊 Sample Data

The system includes 100 sample donors with:

- ✅ Realistic Pakistani names
- ✅ Various blood types distributed naturally
- ✅ Pakistani mobile numbers (+92300xxxxxxx)
- ✅ Donation history (1-3 donations per donor)
- ✅ Different donation centers
- ✅ 95% active, 5% inactive donors

## 🔐 Security Features

- **Admin-only authentication**: No public user registration
- **JWT tokens**: Secure API authentication
- **Role-based access**: Admin permissions required for modifications
- **Input validation**: Comprehensive validation with Joi
- **Rate limiting**: API rate limiting for security
- **Password hashing**: Bcrypt with salt rounds

## 🛠️ Development Scripts

```bash
# Database management
node restructure-database.js          # Reset and restructure database
node generate-simplified-dummy-data.js # Generate 100 sample donors
node reset-admin-password.js          # Reset admin password

# Server management
npm start                             # Production server
npm run dev                          # Development server with auto-reload
```

## 📝 Notes

### Removed Features

- ❌ User registration system
- ❌ User dashboard
- ❌ Donor self-registration
- ❌ Complex donor fields (age, weight, email, address, medical conditions)
- ❌ User authentication for donors

### System Philosophy

This simplified system focuses on what's actually needed for blood donor management:

1. **Admin-controlled**: Administrators manage all donor data
2. **Essential data only**: Only collect what's necessary for blood donation tracking
3. **Public access**: Anyone can search for donors by blood type
4. **Simple workflow**: Add donor → Record donations → Track availability

## 🎯 Use Cases

### Primary Workflow

1. **Admin logs in** to the dashboard
2. **Adds new donors** with basic information
3. **Records donations** when they occur
4. **Public users** can search for available donors
5. **System tracks** next donation eligibility automatically

### Perfect For

- ✅ Hospital blood banks
- ✅ Blood donation drives
- ✅ Community blood centers
- ✅ NGO blood donation programs
- ✅ Simple donor management needs

## 🔄 Donation Cycle

- **Donation recorded** → Last donation date updated
- **Next donation calculated** → Automatically set to +3 months
- **Eligibility tracking** → System shows who can donate when
- **History maintained** → Complete donation record keeping

This simplified system provides everything needed for effective blood donor management without unnecessary complexity.
