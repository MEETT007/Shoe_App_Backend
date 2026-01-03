# Shoe App Backend

A robust Node.js + Express REST API backend for a Shoe E-commerce application. This service powers the implementation of user management, product catalog, orders, cart calculation, and payment processing.

## 🚀 Features

- **User Authentication**: JWT-based auth with secure password hashing (Bcrypt).
- **Product Management**: CRUD operations for products with image support, categories, and inventory.
- **Order Processing**: Complete order flow (creation, payment status, history).
- **Admin Dashboard API**: specialized endpoints for admin management.
- **Security**:
    - Rate Limiting (express-rate-limit)
    - Data Sanitization (express-mongo-sanitize, xss-clean)
    - Security Headers (Helmet)
    - CORS enabled
- **Production Ready**: Centralized error handling, request logging, and health checks.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas) w/ Mongoose ODM
- **Uploads**: Multer
- **Environment**: Dotenv

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure the following:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
```

## 📦 Installation & Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Locally (Dev)**
    ```bash
    npm run dev
    ```

3.  **Run in Production**
    ```bash
    npm start
    ```

## 📡 API Health Check

`GET /api/health`

```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "..."
}
```

## 🚢 Deployment (Render)

1.  Connect this repository to [Render](https://render.com).
2.  Select **Web Service**.
3.  Set Build Command: `npm install`
4.  Set Start Command: `node server.js`
5.  Add Environment Variables from your `.env` file.

---
*Built with ❤️ for the Shoe App Project.*
