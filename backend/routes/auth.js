import express from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp.js";
import User from "../models/User.js";

const router = express.Router();

// Email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// SEND OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.deleteMany({ email });

  await Otp.create({
    email,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  await transporter.sendMail({
    from: "GMart <no-reply@gmart.com>",
    to: email,
    subject: "Your GMart OTP",
    html: `<h2>${otp}</h2><p>Valid for 5 minutes</p>`
  });

  res.json({ success: true });
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const record = await Otp.findOne({ email, otp });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name: email.split("@")[0]
    });
  }

  await Otp.deleteMany({ email });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user
  });
});

export default router;
