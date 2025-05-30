# 🍫 Chocolate Ecommerce Platform

A modern, full-stack e-commerce solution specializing in premium chocolate products with comprehensive product management, shopping cart functionality, and secure payment integration.

![Platform Status](https://img.shields.io/badge/Status-Under%20Development-orange)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black)
![Backend](https://img.shields.io/badge/Backend-ASP.NET%20Core-purple)
![Database](https://img.shields.io/badge/Database-SQL%20Server-red)
![Payment](https://img.shields.io/badge/Payment-Stripe-blue)

## ✨ Features

### 🔐 User Management
- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Customer)
  - Password reset functionality
  - Email verification
  - Social login integration (Google, Facebook)

### 🛍️ Product Management
- **Advanced Product Catalog**
  - Category-based organization (Truffles, Bars, Gift Sets, etc.)
  - Product variants (size, flavor, packaging)
  - High-quality image galleries
  - Stock management with real-time updates
  - Product reviews and ratings
  - Search and filtering capabilities
  - Recommendations engine

### 🛒 Shopping Experience
- **Smart Shopping Cart**
  - Persistent cart across sessions
  - Real-time price calculations
  - Quantity adjustments
  - Save for later functionality
  - Cart abandonment recovery
  - Wishlist management

### 💳 Payment & Checkout
- **Secure Payment Processing**
  - Stripe integration for card payments
  - Multiple payment methods (Credit/Debit, PayPal, Apple Pay)
  - PCI DSS compliant
  - Tax calculation
  - Shipping cost estimation
  - Promo code support

### 📦 Order Management
- **Complete Order Lifecycle**
  - Order tracking system
  - Email notifications
  - Delivery status updates
  - Order history
  - Return and refund processing
  - Invoice generation

### 📊 Admin Dashboard
- **Comprehensive Management Panel**
  - Sales analytics and reporting
  - Inventory management
  - Customer management
  - Order processing
  - Product content management
  - Marketing tools

## 🏗️ Tech Stack

### Frontend
```
Next.js 14        - React framework with SSR/SSG
TypeScript        - Type-safe development
Tailwind CSS      - Utility-first styling
Redux Toolkit     - State management
React Hook Form   - Form handling
Framer Motion     - Animations
```

### Backend
```
ASP.NET Core 8    - Web API framework
Entity Framework  - ORM for database operations
AutoMapper        - Object mapping
FluentValidation  - Input validation
Serilog          - Structured logging
```

### Database & Storage
```
SQL Server        - Primary database
Redis            - Caching layer
Azure Blob       - Image storage
```

### External Services
```
Stripe API       - Payment processing
SendGrid         - Email service
Cloudinary       - Image optimization
```

## 🚀 Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server
- Redis (optional, for caching)

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/chocolate-ecommerce.git
cd chocolate-ecommerce

# Navigate to backend
cd backend

# Restore packages
dotnet restore

# Update database connection string in appsettings.json
# Run migrations
dotnet ef database update

# Start the API
dotnet run
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Update environment variables

# Start development server
npm run dev
```

## 📱 Screenshots

### Homepage
![Homepage](screenshots/homepage.png)
*Modern, responsive homepage with featured products and categories*

### Product Catalog
![Product Catalog](screenshots/catalog.png)
*Advanced filtering and search functionality*

### Shopping Cart
![Shopping Cart](screenshots/cart.png)
*Intuitive cart management with real-time updates*

### Checkout Process
![Checkout](screenshots/checkout.png)
*Secure, multi-step checkout with Stripe integration*

### Admin Dashboard
![Admin Dashboard](screenshots/admin.png)
*Comprehensive admin panel for managing the entire platform*

## 🏛️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Next.js App   │◄──►│  ASP.NET Core   │◄──►│   SQL Server    │
│   (Frontend)    │    │     (API)       │    │   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Stripe API    │    │   SendGrid      │    │     Redis       │
│   (Payments)    │    │   (Email)       │    │   (Caching)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

#### Backend (.NET)
```
ConnectionStrings__DefaultConnection=Server=...;Database=ChocolateStore;...
Stripe__SecretKey=sk_test_...
Stripe__PublishableKey=pk_test_...
SendGrid__ApiKey=SG...
JWT__SecretKey=your-secret-key
JWT__Issuer=ChocolateEcommerce
JWT__Audience=ChocolateEcommerce
```

#### Frontend (Next.js)
```
NEXT_PUBLIC_API_URL=https://localhost:5001/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## 📈 Performance Features

- **Server-Side Rendering** with Next.js for optimal SEO
- **Image Optimization** with automatic WebP conversion
- **Caching Strategy** using Redis for frequently accessed data
- **Database Optimization** with proper indexing and query optimization
- **CDN Integration** for static asset delivery
- **Code Splitting** for reduced bundle sizes

## 🔒 Security Features

- **Authentication** via JWT tokens
- **Authorization** with role-based access control
- **Input Validation** on both client and server
- **SQL Injection Protection** via Entity Framework
- **XSS Protection** with proper sanitization
- **CSRF Protection** implemented
- **HTTPS Enforcement** in production
- **PCI DSS Compliance** through Stripe

## 🧪 Testing

```bash
# Backend tests
cd backend
dotnet test

# Frontend tests
cd frontend
npm run test

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
1. Build frontend: `npm run build`
2. Publish backend: `dotnet publish -c Release`
3. Deploy to your hosting provider

## 📊 Project Status

- ✅ User Authentication System
- ✅ Product Catalog Management
- ✅ Shopping Cart Functionality
- 🚧 Payment Integration (Stripe)
- 🚧 Order Management System
- 📅 Admin Dashboard (Planned)
- 📅 Mobile App (Future)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Project Maintainer:** Your Name
- Email: elieserkibet@gmail.com
- LinkedIn: (https://linkedin.com/in/eliezer-kibet-80217a301/)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/) for the robust backend
- [Stripe](https://stripe.com/) for secure payment processing
- [Tailwind CSS](https://tailwindcss.com/) for beautiful styling

---

⭐ **Star this repository if you found it helpful!**
