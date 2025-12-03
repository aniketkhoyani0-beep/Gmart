import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// MongoDB
mongoose.connect(process.env.MONGODB_URI).then(()=>console.log('Mongo connected')).catch(err=>console.error(err));

// Schemas
const userSchema = new mongoose.Schema({ name: String, email: {type:String, unique:true}, password: String, role:{type:String,default:'user'} });
const productSchema = new mongoose.Schema({ name:String, description:String, price:Number }); // price in cents
const orderSchema = new mongoose.Schema({ stripeSessionId:String, paypalOrderId:String, customerEmail:String, items:Array, amount_total:Number, currency:String, payment_status:String, createdAt:{type:Date, default:Date.now} });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// Email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Helpers - PayPal API
const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
const PAYPAL_BASE = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(){
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + Buffer.from(PAYPAL_CLIENT + ':' + PAYPAL_SECRET).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const j = await res.json();
  return j.access_token;
}

// Auth helpers
function authMiddleware(req,res,next){ const auth = req.headers.authorization; if(!auth) return res.status(401).json({error:'No token'}); const token = auth.split(' ')[1]; try{ const data = jwt.verify(token, process.env.JWT_SECRET); req.user = data; next(); }catch(e){ return res.status(401).json({error:'Invalid token'}); } }

// Routes - Auth
app.post('/api/auth/register', async (req,res)=>{ try{ const {name,email,password} = req.body; const hash = await bcrypt.hash(password,10); const u = await User.create({name,email,password:hash}); res.json({id:u._id}); }catch(e){ console.error(e); res.status(400).json({error:e.message}); } });
app.post('/api/auth/login', async (req,res)=>{ try{ const {email,password} = req.body; const user = await User.findOne({email}); if(!user) return res.status(400).json({error:'User not found'}); const ok = await bcrypt.compare(password,user.password); if(!ok) return res.status(400).json({error:'Invalid credentials'}); const token = jwt.sign({id:user._id,role:user.role,email:user.email}, process.env.JWT_SECRET, {expiresIn:'7d'}); res.json({token}); }catch(e){ console.error(e); res.status(500).json({error:'Server error'}); } });

// Products
app.get('/api/products', async (req,res)=>{ const p = await Product.find().sort({name:1}); res.json(p); });
app.get('/api/products/:id', async (req,res)=>{ const p = await Product.findById(req.params.id); if(!p) return res.status(404).json({error:'Not found'}); res.json(p); });
app.post('/api/products', authMiddleware, async (req,res)=>{ try{ const user = req.user; if(user.role!=='admin') return res.status(403).json({error:'Forbidden'}); const {name,price,description} = req.body; const p = await Product.create({name,price,description}); res.json(p); }catch(e){ res.status(400).json({error:e.message}); } });
app.delete('/api/products/:id', authMiddleware, async (req,res)=>{ try{ const user = req.user; if(user.role!=='admin') return res.status(403).json({error:'Forbidden'}); await Product.findByIdAndDelete(req.params.id); res.json({ok:true}); }catch(e){ res.status(400).json({error:e.message}); } });

# Create PayPal order
app.post('/api/create-paypal-order', async (req,res)=>{
  try{
    const { items, customer } = req.body;
    const dbItems = await Product.find({_id: {$in: items.map(i=>i.id)}});
    let total = 0;
    const purchase_units_items = items.map(i=>{
      const prod = dbItems.find(d=>d._id.toString()===i.id);
      const unit_amount = (prod.price/100).toFixed(2);
      total += prod.price * i.qty;
      return {
        name: prod.name,
        unit_amount: { currency_code: 'USD', value: unit_amount },
        quantity: String(i.qty)
      };
    });

    const access = await getPayPalAccessToken();
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + access },
      body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: 'USD', value: (total/100).toFixed(2), breakdown: { item_total: { currency_code: 'USD', value: (total/100).toFixed(2) } } , items: purchase_units_items } ] })
    });
    const orderData = await orderRes.json();
    // Save order stub
    await Order.create({ paypalOrderId: orderData.id, customerEmail: customer?.email || '', items, amount_total: total, currency: 'usd', payment_status: 'pending' });
    res.json({ id: orderData.id });
  }catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

# Capture PayPal order
app.post('/api/capture-paypal-order', async (req,res)=>{
  try{
    const { orderID } = req.body;
    const access = await getPayPalAccessToken();
    const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + access } });
    const capData = await capRes.json();
    // Update DB
    const order = await Order.findOneAndUpdate({ paypalOrderId: orderID }, { payment_status: 'paid' }, { new: true });
    // Generate invoice PDF and email
    if(order){
      const invoicePath = path.join(__dirname, 'public', 'invoices');
      if(!fs.existsSync(invoicePath)) fs.mkdirSync(invoicePath, { recursive: true });
      const pdfPath = path.join(invoicePath, `${order._id}.pdf`);
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(pdfPath));
      doc.fontSize(20).text('G Mart - Invoice', {align:'center'});
      doc.moveDown();
      doc.fontSize(12).text(`Order ID: ${order._id}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
      doc.text(`Email: ${order.customerEmail}`);
      doc.moveDown();
      doc.text('Items:');
      for(const it of order.items){
        const prod = await Product.findById(it.id);
        doc.text(`${prod.name} x ${it.qty} - $${(prod.price/100).toFixed(2)}`);
      }
      doc.moveDown();
      doc.text(`Total: $${(order.amount_total/100).toFixed(2)}`);
      doc.end();
      // send email
      try{
        await transporter.sendMail({ from: process.env.EMAIL_FROM, to: order.customerEmail, subject: 'G Mart - Your Invoice', text: 'Thank you for your order. Invoice attached.', attachments: [{ filename: `${order._id}.pdf`, path: pdfPath }] });
      }catch(e){ console.error('Email failed', e.message); }
    }
    res.json(capData);
  }catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

# Invoice download
app.get('/api/invoice/:orderId', async (req,res)=>{
  const file = path.join(__dirname, 'public', 'invoices', `${req.params.orderId}.pdf`);
  if(fs.existsSync(file)) return res.sendFile(file);
  res.status(404).send('Invoice not found');
});

# Orders list for admin
app.get('/api/orders', authMiddleware, async (req,res)=>{ const user = req.user; if(user.role!=='admin') return res.status(403).json({error:'Forbidden'}); const orders = await Order.find().sort({createdAt:-1}); res.json(orders); });

const PORT = process.env.PORT || 4242;
app.listen(PORT, ()=>console.log(`Server running on ${PORT}`));
