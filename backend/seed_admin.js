import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(async ()=>{ console.log('connected'); const User = mongoose.model('User', new mongoose.Schema({ name:String, email:String, password:String, role:String })); const pw = await bcrypt.hash('Admin@123',10); try{ await User.create({name:'Admin', email:'admin@gmart.com', password:pw, role:'admin'}); console.log('Admin created'); }catch(e){ console.error('Error', e.message); } process.exit(0); }).catch(e=>{console.error(e);});
