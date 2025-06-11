# BloodConnect Frontend

A modern React.js frontend for the BloodConnect blood donor registry system.

## Features

- **Landing Page**: Hero section with blood type selection and featured donors
- **User Authentication**: Registration and login with validation
- **User Dashboard**: Profile management and donation tracking
- **Admin Dashboard**: Complete donor management system
- **Donor Browsing**: Filter and search donors by blood type
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Notifications**: Toast notifications for user feedback

## Technology Stack

- **React.js 18** - Frontend framework
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **Axios** - HTTP client for API calls
- **React Toastify** - Notification system

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on port 3000

## Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (optional):**
   Create a `.env` file if you need to customize the API base URL:
   ```
   REACT_APP_API_URL=http://localhost:3000/api
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

   The application will open at `http://localhost:3001`

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── components/
│   │   ├── Navbar.js           # Navigation component
│   │   └── ProtectedRoute.js   # Route protection
│   ├── contexts/
│   │   └── AuthContext.js      # Authentication state
│   ├── pages/
│   │   ├── LandingPage.js      # Home page
│   │   ├── DonorsByBloodType.js # Donor listing
│   │   ├── Login.js            # Login page
│   │   ├── Register.js         # Registration page
│   │   ├── UserDashboard.js    # User dashboard
│   │   └── AdminDashboard.js   # Admin dashboard
│   ├── services/
│   │   └── api.js              # API service layer
│   ├── App.js                  # Main app component
│   ├── index.js               # App entry point
│   └── index.css              # Global styles
├── tailwind.config.js
├── package.json
└── README.md
```

## Available Pages

### Public Pages
- **/** - Landing page with blood type selection
- **/donors/blood-type/:bloodType** - Browse donors by blood type
- **/login** - User authentication
- **/register** - User registration

### Protected Pages
- **/dashboard** - User dashboard (requires authentication)
- **/admin** - Admin dashboard (requires admin role)

## Key Features

### User Registration
- Two-step registration process
- Account details and donor information
- Form validation and error handling
- Blood type selection

### User Dashboard
- Profile management with edit functionality
- Donation eligibility status
- Last donation tracking
- Record new donations
- Impact statistics

### Admin Dashboard
- Complete donor CRUD operations
- Advanced filtering and search
- Pagination for large datasets
- Donor statistics overview
- Bulk operations

### Donor Browsing
- Filter by blood type
- Search by name or contact
- Availability status indicators
- Responsive grid layout

## Styling

The application uses Tailwind CSS with a custom color scheme:

- **Primary Color**: Blood Red (#DC2626)
- **Design System**: Cards, buttons, forms with consistent spacing
- **Responsive**: Mobile-first approach
- **Accessibility**: Focus states and proper contrast

## API Integration

The frontend communicates with the backend API through:

- **Axios interceptors** for authentication
- **Error handling** with user-friendly messages
- **Loading states** for better UX
- **Pagination** for large datasets

## Authentication

- **JWT-based** authentication
- **Role-based** access control (user/admin)
- **Protected routes** with automatic redirects
- **Session persistence** with localStorage

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:3000/api` | Backend API base URL |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Use meaningful component and variable names
3. Add proper error handling
4. Test responsive design
5. Update documentation as needed

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Ensure backend is running on port 3000
   - Check CORS configuration
   - Verify API endpoints

2. **Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify Tailwind CSS configuration

3. **Authentication Issues**
   - Clear localStorage
   - Check JWT token format
   - Verify API endpoints

## License

This project is part of the BloodConnect system for educational purposes. 