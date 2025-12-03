# G Mart - PayPal Full Project (Ready for Render)

This package contains a full frontend + Node.js backend with PayPal integration, admin panel, invoices and user auth.

## Key features
- Product CRUD (admin)
- User register/login (JWT)
- PayPal Checkout (create order, capture)
- Invoice PDF generation and email to customer
- Admin orders list and invoice download
- Seed script to create demo admin user (admin@gmart.com / Admin@123)

## Quick local setup
1. Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MongoDB URI, PayPal credentials, email settings, FRONTEND_URL
node seed_admin.js
npm run dev
```
2. Frontend
- You can open frontend/index.html directly in browser for testing, or host the frontend on static host.

## Deploy to Render
1. Create a GitHub repo and push the project.
2. On Render, create a new Web Service and connect to the repo (backend directory). Start command: `npm start`.
3. Set environment variables in Render from `.env.example` (PAYPAL_CLIENT_ID, PAYPAL_SECRET, MONGODB_URI, JWT_SECRET, etc.).
4. Deploy.

## PayPal
- Create app in https://developer.paypal.com -> get CLIENT ID and SECRET
- Use SANDBOX for testing (PAYPAL_ENV=sandbox) and replace FRONTEND payPal client id in frontend files where noted.

## Notes
- Replace `REPLACE_WITH_YOUR_PAYPAL_CLIENT_ID` in frontend files with your PayPal client ID
- Emails require real SMTP credentials to send invoices
- Use HTTPS in production

