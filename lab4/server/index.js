// server/index.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs").promises;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "./db.json";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Nodemailer configuration
// const transporter = nodemailer.createTransport({
//   service: "Mail",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  // port: process.env.SMTP_PORT || 587,
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  connectionTimeout: 20000, // 20 seconds
  greetingTimeout: 20000,   // 20 seconds/ Set to 10 seconds or longer as needed
});

// Helper to read and write to JSON "database"
async function readDatabase() {
  const data = await fs.readFile(DB_FILE, "utf-8");
  return JSON.parse(data);
}

async function writeDatabase(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Route: Register
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const db = await readDatabase();
  const existingUser = db.users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = { email, password: hashedPassword, otp: null, otpExpires: null };
  db.users.push(newUser);
  await writeDatabase(db);

  res.json({ message: "User registered" });
});

// Route: Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = await readDatabase();
  const user = db.users.find((user) => user.email === email);
  const psw = user.password == password
  if (!user || !psw) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate and store OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await writeDatabase(db);

  transporter.sendMail({
    from: email,
    to: "", //your email
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  });

  res.json({ message: "OTP sent to email" });
});

// Route: Verify OTP
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const db = await readDatabase();
  const user = db.users.find((user) => user.email === email);

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    return res.status(401).json({ message: "Invalid or expired OTP" });
  }

  // Clear OTP after successful verification
  user.otp = null;
  user.otpExpires = null;
  await writeDatabase(db);

  const token = generateToken(user.email);
  res.json({ token });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
