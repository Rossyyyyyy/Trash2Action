//SERVER.JS
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cors = require("cors");
const os = require("os");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://roschelmaeanoos_db_user:Ros123anoos@trash2action.kspjcro.mongodb.net/?appName=Trash2Action";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_this";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ─── GET LOCAL NETWORK IP ────────────────────────────────────────────────────
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalNetworkIP();
const BASE_URL = process.env.BASE_URL || `http://${LOCAL_IP}:${PORT}`;

// ─── MONGOOSE CONNECTION ─────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ─── USER SCHEMA ─────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  fullName:                  { type: String, required: true, trim: true },
  email:                     { type: String, required: true, unique: true, lowercase: true, trim: true },
  gender:                    { type: String, required: true, enum: ["male", "female", "other"] },
  password:                  { type: String, required: true },
  profileImage:              { type: String, default: null },
  isEmailVerified:           { type: Boolean, default: false },
  emailVerificationToken:    { type: String, default: null },
  emailVerificationExpiry:   { type: Date, default: null },
  passwordResetCode:         { type: String, default: null },   // ← was missing
  passwordResetExpiry:       { type: Date, default: null },     // ← was missing
  followers:                 [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following:                 [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt:                 { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// ─── RESPONDER SCHEMA ────────────────────────────────────────────────────────
const responderSchema = new mongoose.Schema({
  fullName:                  { type: String, required: true, trim: true },
  accountType:               { type: String, required: true, enum: ["ADMIN", "BARANGAY", "POSO"] },
  employeeId:                { type: String, required: true, unique: true, trim: true },
  email:                     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:                     { type: String, required: true, trim: true },
  barangay:                  { type: String, required: true, trim: true },
  position:                  { type: String, default: "Administrator", trim: true },
  password:                  { type: String, required: true },
  isEmailVerified:           { type: Boolean, default: false },
  isApproved:                { type: Boolean, default: false },  // For ADMIN approval
  approvalStatus:            { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  emailVerificationToken:    { type: String, default: null },
  emailVerificationExpiry:   { type: Date, default: null },
  passwordResetCode:         { type: String, default: null },
  passwordResetExpiry:       { type: Date, default: null },
  createdAt:                 { type: Date, default: Date.now },
});

const Responder = mongoose.model("Responder", responderSchema);

// ─── MESSAGE SCHEMA ──────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  conversationId:            { type: String, required: true, index: true },
  senderId:                  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId:                { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text:                      { type: String, required: true },
  read:                      { type: Boolean, default: false },
  createdAt:                 { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// ─── NOTIFICATION SCHEMA ─────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipientId:           { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientType:         { type: String, required: true, enum: ["user", "responder"] },
  type:                  { type: String, required: true, enum: ["report", "post", "admin_request", "comment", "like", "system"] },
  title:                 { type: String, required: true },
  message:               { type: String, required: true },
  relatedId:             { type: mongoose.Schema.Types.ObjectId, default: null },
  relatedType:           { type: String, enum: ["report", "post", "user", "responder"], default: null },
  read:                  { type: Boolean, default: false },
  createdAt:             { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);

// ─── MULTER CONFIGURATION FOR FILE UPLOADS ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads", "newsfeed");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|mov|avi|mkv|webm/;
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (file.fieldname === "image") {
    if (allowedImageTypes.test(extname) && mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  } else if (file.fieldname === "video") {
    if (allowedVideoTypes.test(extname) && mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed (mp4, mov, avi, mkv, webm)"));
    }
  } else {
    cb(new Error("Invalid field name"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// ─── NEWSFEED POST SCHEMA ────────────────────────────────────────────────────
const newsfeedPostSchema = new mongoose.Schema({
  authorId:       { type: mongoose.Schema.Types.ObjectId, required: true },
  authorType:     { type: String, required: true, enum: ["user", "responder"] },
  authorName:     { type: String, required: true },
  authorRole:     { type: String, default: "Community Member" },
  avatar:         { type: String, default: "👤" },
  category:       { type: String, required: true, enum: ["Announcement", "Event", "Tip", "Notice", "Achievement"] },
  title:          { type: String, required: true, maxlength: 100 },
  body:           { type: String, required: true, maxlength: 500 },
  imageUrl:       { type: String, default: null },
  videoUrl:       { type: String, default: null },
  likes:          { type: Number, default: 0 },
  likedBy:        [{ type: mongoose.Schema.Types.ObjectId }],
  comments:       [{
    userId:       { type: mongoose.Schema.Types.ObjectId, required: true },
    userName:     { type: String, required: true },
    userAvatar:   { type: String, default: "👤" },
    text:         { type: String, required: true, maxlength: 300 },
    createdAt:    { type: Date, default: Date.now },
  }],
  createdAt:      { type: Date, default: Date.now },
});

const NewsfeedPost = mongoose.model("NewsfeedPost", newsfeedPostSchema);

// ─── NODEMAILER SETUP ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// ─── SEND VERIFICATION EMAIL ─────────────────────────────────────────────────
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Verify Your Email - Trash2Action",
    text: `Please verify your email by clicking the following link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="color: #2E7D32; margin: 0;">Trash2Action</h1>
        </div>

        <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #2E7D32; margin-top: 0;">Welcome! Verify Your Email</h2>
          <p style="color: #424242; font-size: 15px; line-height: 1.6;">
            Thank you for creating your account! To complete the registration process,
            please verify your email address by clicking the button below.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="display: inline-block; padding: 14px 32px; background-color: #2E7D32; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
              ✓ Verify Email
            </a>
          </div>

          <p style="color: #757575; font-size: 13px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #2E7D32; font-size: 13px; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 6px;">
            ${verificationUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

          <p style="color: #999; font-size: 12px;">
            ⏰ This link will expire in <strong>1 hour</strong>.<br />
            If you did not create an account, please ignore this email.
          </p>
        </div>

        <p style="text-align: center; color: #999; font-size: 11px; margin-top: 20px;">
          © 2025 Trash2Action. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

// ─── SEND RESET CODE EMAIL ───────────────────────────────────────────────────
const sendResetCodeEmail = async (email, code) => {
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Password Reset Code - Trash2Action",
    text: `Your password reset code is: ${code}\nThis code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="color: #2E7D32; margin: 0;">Trash2Action</h1>
        </div>

        <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #2E7D32; margin-top: 0;">Password Reset Code</h2>
          <p style="color: #424242; font-size: 15px; line-height: 1.6;">
            You requested to reset your password. Use the code below to proceed.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #E8F5E9; border-radius: 12px; padding: 20px 40px; border: 2px dashed #2E7D32;">
              <span style="font-size: 36px; font-weight: bold; color: #2E7D32; letter-spacing: 8px;">${code}</span>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

          <p style="color: #999; font-size: 12px;">
            ⏰ This code will expire in <strong>10 minutes</strong>.<br />
            If you did not request a password reset, please ignore this email.
          </p>
        </div>

        <p style="text-align: center; color: #999; font-size: 11px; margin-top: 20px;">
          © 2025 Trash2Action. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Reset code email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending reset code email:", error);
    throw error;
  }
};

// ─── SEND ADMIN REQUEST EMAIL ────────────────────────────────────────────────
const sendAdminRequestEmail = async (email, fullName) => {
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Admin Account Request Submitted - Trash2Action",
    text: `Your admin account request has been submitted and is pending approval.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="color: #2E7D32; margin: 0;">Trash2Action</h1>
        </div>

        <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #2E7D32; margin-top: 0;">Admin Account Request Submitted</h2>
          <p style="color: #424242; font-size: 15px; line-height: 1.6;">
            Hello ${fullName},
          </p>
          <p style="color: #424242; font-size: 15px; line-height: 1.6;">
            Your request for an administrator account has been received and is currently under review.
          </p>

          <div style="background-color: #FFF3E0; border-left: 4px solid #F57C00; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #424242; font-size: 14px;">
              <strong>⏳ Status:</strong> Pending Approval
            </p>
          </div>

          <p style="color: #424242; font-size: 15px; line-height: 1.6;">
            You will receive an email notification once your request has been reviewed by the system administrators.
            This process typically takes 1-2 business days.
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

          <p style="color: #999; font-size: 12px;">
            If you did not submit this request, please contact support immediately.
          </p>
        </div>

        <p style="text-align: center; color: #999; font-size: 11px; margin-top: 20px;">
          © 2025 Trash2Action. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Admin request email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending admin request email:", error);
    throw error;
  }
};

// ─── SEND APPROVAL/REJECTION EMAIL ───────────────────────────────────────────
const sendApprovalEmail = async (email, fullName, approved, verificationToken = null) => {
  const status = approved ? "Approved" : "Rejected";
  const color = approved ? "#2E7D32" : "#D32F2F";

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: `Admin Account ${status} - Trash2Action`,
    text: approved 
      ? `Your admin account has been approved! You can now login to your account.`
      : `Your admin account request has been rejected.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="color: #2E7D32; margin: 0;">Trash2Action</h1>
        </div>

        <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: ${color}; margin-top: 0;">Admin Account ${status}</h2>
          <p style="color: #424242; font-size: 15px; line-height: 1.6;">
            Hello ${fullName},
          </p>
          <p style="color: #424242; font-size: 15px; line-height: 1.6;">
            ${approved 
              ? 'Your request for an administrator account has been <strong>approved</strong>!'
              : 'Your request for an administrator account has been <strong>rejected</strong>.'}
          </p>

          ${approved ? `
            <p style="color: #424242; font-size: 15px; line-height: 1.6;">
              You can now login to your account using your employee ID and password.
            </p>

            <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #2E7D32; font-size: 14px; margin: 0; font-weight: bold;">
                ✓ Your account is ready to use!
              </p>
              <p style="color: #424242; font-size: 13px; margin: 10px 0 0 0;">
                Login with your employee ID to access the admin dashboard.
              </p>
            </div>
          ` : `
            <p style="color: #424242; font-size: 15px; line-height: 1.6;">
              If you believe this was a mistake, please contact the system administrators.
            </p>
          `}
        </div>

        <p style="text-align: center; color: #999; font-size: 11px; margin-top: 20px;">
          © 2025 Trash2Action. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ ${status} email sent to:`, email);
  } catch (error) {
    console.error(`❌ Error sending ${status} email:`, error);
    throw error;
  }
};

// ─── AUTH MIDDLEWARE (JWT) ───────────────────────────────────────────────────
const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token)
    return res.status(401).json({ success: false, message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ─── HEALTH / STATUS ENDPOINTS ───────────────────────────────────────────────
app.get("/status", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running and connected!" });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/connection-check", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Connection successful",
    serverTime: new Date().toISOString(),
  });
});

// ─── REGISTER ────────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, gender, password, profileImage } = req.body;

    if (!fullName || !email || !gender || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000);

    const newUser = new User({
      fullName,
      email,
      gender,
      password: hashedPassword,
      profileImage: profileImage || null,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    await newUser.save();
    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      success: true,
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

// ─── VERIFY EMAIL ────────────────────────────────────────────────────────────
app.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(renderVerificationPage("error", "Invalid verification link."));
    }

    // Try to find in User collection first
    let user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    });

    // If not found in User, try Responder collection
    let responder = null;
    if (!user) {
      responder = await Responder.findOne({
        emailVerificationToken: token,
        emailVerificationExpiry: { $gt: new Date() },
      });
    }

    if (!user && !responder) {
      return res.status(400).send(renderVerificationPage("error", "Link is invalid or has expired."));
    }

    // Update the found account
    if (user) {
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpiry = null;
      await user.save();
    } else if (responder) {
      responder.isEmailVerified = true;
      responder.emailVerificationToken = null;
      responder.emailVerificationExpiry = null;
      await responder.save();
    }

    return res.status(200).send(renderVerificationPage("success", "Your email has been verified! You can now log in."));
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).send(renderVerificationPage("error", "Something went wrong."));
  }
});

function renderVerificationPage(status, message) {
  const color = status === "success" ? "#2E7D32" : "#D32F2F";
  const icon = status === "success" ? "✓" : "✗";
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /><title>Email Verification</title></head>
      <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5;">
        <div style="background: #fff; border-radius: 12px; padding: 40px; max-width: 400px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
          <div style="width: 70px; height: 70px; border-radius: 50%; background: ${color}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px;">${icon}</div>
          <h2 style="color: ${color}; margin-top: 0;">${status === "success" ? "Verified!" : "Verification Failed"}</h2>
          <p style="color: #424242;">${message}</p>
        </div>
      </body>
    </html>
  `;
}

// ─── RESEND VERIFICATION EMAIL ───────────────────────────────────────────────
app.post("/api/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ success: true, message: "If this email exists, a verification link has been sent." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, verificationToken);

    return res.status(200).json({ success: true, message: "Verification email resent successfully" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please check your inbox or resend verification.",
        needsVerification: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        gender: user.gender,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// ─── FORGOT PASSWORD: Request a reset code ──────────────────────────────────
app.post("/api/forgot-password/request", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset code has been sent.",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcrypt.genSalt(10);
    user.passwordResetCode = await bcrypt.hash(code, salt);
    user.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log("  [request] saved passwordResetCode:", !!user.passwordResetCode, "expiry:", user.passwordResetExpiry);

    await sendResetCodeEmail(email, code);

    return res.status(200).json({
      success: true,
      message: "If this email is registered, a reset code has been sent.",
    });
  } catch (error) {
    console.error("Forgot password request error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── FORGOT PASSWORD: Verify the code ───────────────────────────────────────
app.post("/api/forgot-password/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    console.log("━━━ VERIFY-CODE HIT ━━━");
    console.log("  email received :", JSON.stringify(email));
    console.log("  code  received :", JSON.stringify(code));

    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and code are required" });
    }

    const user = await User.findOne({ email });

    console.log("  user found     :", !!user);
    console.log("  resetCode in DB:", user ? JSON.stringify(user.passwordResetCode) : "N/A");
    console.log("  resetExpiry    :", user ? user.passwordResetExpiry : "N/A");

    if (!user || !user.passwordResetCode || !user.passwordResetExpiry) {
      console.log("  ✗ BLOCKED — passwordResetCode or Expiry is null/undefined in DB");
      return res.status(400).json({ success: false, message: "Invalid or expired code" });
    }

    const now = new Date();
    if (user.passwordResetExpiry < now) {
      console.log("  ✗ BLOCKED — code expired");
      user.passwordResetCode = null;
      user.passwordResetExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: "Code has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(code, user.passwordResetCode);
    console.log("  bcrypt.compare result:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    console.log("  ✓ CODE VERIFIED OK");
    return res.status(200).json({ success: true, message: "Code verified" });
  } catch (error) {
    console.error("Verify code error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── FORGOT PASSWORD: Reset the password ────────────────────────────────────
app.post("/api/forgot-password/reset", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, code, and new password are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.passwordResetCode || !user.passwordResetExpiry) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset request" });
    }

    if (user.passwordResetExpiry < new Date()) {
      user.passwordResetCode = null;
      user.passwordResetExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: "Code has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(code, user.passwordResetCode);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.passwordResetCode = null;
    user.passwordResetExpiry = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET PROFILE (protected) ─────────────────────────────────────────────────
app.get("/api/profile", authMiddleware, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// ═══════════════════════════════════════════════════════════════════════════
// ═══ NEWSFEED ENDPOINTS ════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET ALL NEWSFEED POSTS ──────────────────────────────────────────────────
app.get("/api/newsfeed", async (req, res) => {
  try {
    const userId = req.query.userId; // Optional: to check if user liked posts
    
    const posts = await NewsfeedPost.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      posts: posts.map(post => ({
        id: post._id,
        authorId: post.authorId,
        avatar: post.avatar,
        authorName: post.authorName,
        authorRole: post.authorRole,
        time: getTimeAgo(post.createdAt),
        category: post.category,
        categoryColor: getCategoryColor(post.category),
        title: post.title,
        body: post.body,
        imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : null,
        videoUrl: post.videoUrl ? `${BASE_URL}${post.videoUrl}` : null,
        likes: post.likes,
        comments: post.comments.length,
        liked: userId ? post.likedBy.some(id => id.toString() === userId) : false,
        likedBy: post.likedBy,
      })),
    });
  } catch (error) {
    console.error("Get newsfeed error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── CREATE NEWSFEED POST WITH MEDIA ─────────────────────────────────────────
app.post("/api/newsfeed", authMiddleware, upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]), async (req, res) => {
  try {
    const { category, body } = req.body;

    if (!category || !body) {
      return res.status(400).json({ success: false, message: "Category and body are required" });
    }

    if (!["Announcement", "Event", "Tip", "Notice", "Achievement"].includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    const title = body.substring(0, 50) + (body.length > 50 ? "..." : "");

    let imageUrl = null;
    let videoUrl = null;

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        imageUrl = `/uploads/newsfeed/${req.files.image[0].filename}`;
      }
      if (req.files.video && req.files.video[0]) {
        videoUrl = `/uploads/newsfeed/${req.files.video[0].filename}`;
      }
    }

    const newPost = new NewsfeedPost({
      authorId: req.user._id,
      authorType: "user",
      authorName: req.user.fullName,
      authorRole: "Community Member",
      avatar: "👤",
      category,
      title,
      body,
      imageUrl,
      videoUrl,
    });

    await newPost.save();

    // Create notification for all admins
    const admins = await Responder.find({ accountType: "ADMIN", isApproved: true });
    const notifications = admins.map(admin => ({
      recipientId: admin._id,
      recipientType: "responder",
      type: "post",
      title: "New Post Created",
      message: `${req.user.fullName} created a new ${category} post`,
      relatedId: newPost._id,
      relatedType: "post",
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      
      // Emit real-time notification to all admins
      admins.forEach(admin => {
        io.to(`user_${admin._id}`).emit("new_notification", {
          type: "post",
          title: "New Post Created",
          message: `${req.user.fullName} created a new ${category} post`,
          timestamp: new Date(),
        });
      });
    }

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: {
        id: newPost._id,
        avatar: newPost.avatar,
        authorName: newPost.authorName,
        authorRole: newPost.authorRole,
        time: "Just now",
        category: newPost.category,
        categoryColor: getCategoryColor(newPost.category),
        title: newPost.title,
        body: newPost.body,
        imageUrl: imageUrl ? `${BASE_URL}${imageUrl}` : null,
        videoUrl: videoUrl ? `${BASE_URL}${videoUrl}` : null,
        likes: newPost.likes,
        comments: newPost.comments.length,
        liked: false,
      },
    });
  } catch (error) {
    console.error("Create newsfeed post error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

// ─── TOGGLE LIKE ON POST ─────────────────────────────────────────────────────
app.post("/api/newsfeed/:postId/like", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await NewsfeedPost.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Ensure comments is an array (migration safety)
    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }

    // Ensure likedBy is an array
    if (!Array.isArray(post.likedBy)) {
      post.likedBy = [];
    }

    const hasLiked = post.likedBy.some(id => id.toString() === userId.toString());

    if (hasLiked) {
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      liked: !hasLiked,
      likes: post.likes,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── UPDATE POST ─────────────────────────────────────────────────────────────
app.put("/api/newsfeed/:postId", authMiddleware, upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]), async (req, res) => {
  try {
    const { postId } = req.params;
    const { category, body, removeImage, removeVideo } = req.body;

    const post = await NewsfeedPost.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check if user owns the post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own posts" });
    }

    // Update text fields
    if (category) {
      if (!["Announcement", "Event", "Tip", "Notice", "Achievement"].includes(category)) {
        return res.status(400).json({ success: false, message: "Invalid category" });
      }
      post.category = category;
    }

    if (body) {
      post.body = body;
      post.title = body.substring(0, 50) + (body.length > 50 ? "..." : "");
    }

    // Handle image removal
    if (removeImage === "true" && post.imageUrl) {
      const imagePath = path.join(__dirname, post.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      post.imageUrl = null;
    }

    // Handle video removal
    if (removeVideo === "true" && post.videoUrl) {
      const videoPath = path.join(__dirname, post.videoUrl);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      post.videoUrl = null;
    }

    // Handle new image upload
    if (req.files && req.files.image && req.files.image[0]) {
      // Delete old image if exists
      if (post.imageUrl) {
        const oldImagePath = path.join(__dirname, post.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      post.imageUrl = `/uploads/newsfeed/${req.files.image[0].filename}`;
    }

    // Handle new video upload
    if (req.files && req.files.video && req.files.video[0]) {
      // Delete old video if exists
      if (post.videoUrl) {
        const oldVideoPath = path.join(__dirname, post.videoUrl);
        if (fs.existsSync(oldVideoPath)) {
          fs.unlinkSync(oldVideoPath);
        }
      }
      post.videoUrl = `/uploads/newsfeed/${req.files.video[0].filename}`;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: {
        id: post._id,
        avatar: post.avatar,
        authorName: post.authorName,
        authorRole: post.authorRole,
        time: getTimeAgo(post.createdAt),
        category: post.category,
        categoryColor: getCategoryColor(post.category),
        title: post.title,
        body: post.body,
        imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : null,
        videoUrl: post.videoUrl ? `${BASE_URL}${post.videoUrl}` : null,
        likes: post.likes,
        comments: post.comments.length,
        liked: false,
      },
    });
  } catch (error) {
    console.error("Update post error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

// ─── DELETE POST ─────────────────────────────────────────────────────────────
app.delete("/api/newsfeed/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await NewsfeedPost.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check if user owns the post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own posts" });
    }

    // Delete associated media files
    if (post.imageUrl) {
      const imagePath = path.join(__dirname, post.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    if (post.videoUrl) {
      const videoPath = path.join(__dirname, post.videoUrl);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    await NewsfeedPost.findByIdAndDelete(postId);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET USERS WHO LIKED A POST ──────────────────────────────────────────────
app.get("/api/newsfeed/:postId/likes", async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await NewsfeedPost.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Ensure likedBy is an array
    if (!Array.isArray(post.likedBy)) {
      post.likedBy = [];
    }

    // Get user details for all who liked
    const likedUsers = await User.find({ _id: { $in: post.likedBy } })
      .select("fullName email")
      .limit(100);

    return res.status(200).json({
      success: true,
      likes: likedUsers.map(user => ({
        id: user._id,
        name: user.fullName,
        avatar: "👤",
      })),
      total: post.likes,
    });
  } catch (error) {
    console.error("Get likes error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── MANUAL MIGRATION ENDPOINT (for debugging) ──────────────────────────────
app.post("/api/admin/migrate-posts", async (req, res) => {
  try {
    const postsToMigrate = await NewsfeedPost.find({ 
      comments: { $type: "number" } 
    });

    if (postsToMigrate.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: "No posts need migration",
        migrated: 0 
      });
    }

    for (const post of postsToMigrate) {
      post.comments = [];
      await post.save();
    }

    return res.status(200).json({
      success: true,
      message: `Successfully migrated ${postsToMigrate.length} posts`,
      migrated: postsToMigrate.length,
    });
  } catch (error) {
    console.error("Manual migration error:", error);
    return res.status(500).json({ success: false, message: "Migration failed" });
  }
});

// ─── ADD COMMENT TO POST ─────────────────────────────────────────────────────
app.post("/api/newsfeed/:postId/comment", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    if (text.length > 300) {
      return res.status(400).json({ success: false, message: "Comment must be 300 characters or less" });
    }

    const post = await NewsfeedPost.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const newComment = {
      userId: req.user._id,
      userName: req.user.fullName,
      userAvatar: "👤",
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: {
        id: post.comments[post.comments.length - 1]._id,
        userId: newComment.userId,
        userName: newComment.userName,
        userAvatar: newComment.userAvatar,
        text: newComment.text,
        time: "Just now",
      },
      totalComments: post.comments.length,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET COMMENTS FOR POST ───────────────────────────────────────────────────
app.get("/api/newsfeed/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await NewsfeedPost.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Ensure comments is an array
    if (!Array.isArray(post.comments)) {
      post.comments = [];
      await post.save();
    }

    return res.status(200).json({
      success: true,
      comments: post.comments.map(comment => ({
        id: comment._id,
        userId: comment.userId,
        userName: comment.userName,
        userAvatar: comment.userAvatar,
        text: comment.text,
        time: getTimeAgo(comment.createdAt),
      })).reverse(), // Most recent first
      total: post.comments.length,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── DELETE COMMENT ──────────────────────────────────────────────────────────
app.delete("/api/newsfeed/:postId/comment/:commentId", authMiddleware, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await NewsfeedPost.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own comments" });
    }

    post.comments.pull(commentId);
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      totalComments: post.comments.length,
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Helper functions for newsfeed
function getCategoryColor(category) {
  const colors = {
    Announcement: "#2E7D32",
    Event: "#9C27B0",
    Tip: "#43A047",
    Notice: "#2196F3",
    Achievement: "#FB8C00",
  };
  return colors[category] || "#2E7D32";
}

function getTimeAgo(date) {
  if (!date) return "Unknown";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((new Date() - dateObj) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  
  return dateObj.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════
// ═══ RESPONDER ENDPOINTS ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════

// ─── RESPONDER REGISTER ──────────────────────────────────────────────────────
app.post("/api/responder/register", async (req, res) => {
  try {
    const { fullName, accountType, employeeId, email, phone, barangay, position, password } = req.body;

    if (!fullName || !accountType || !employeeId || !email || !phone || !barangay || !password) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    // Position is required for non-ADMIN accounts
    if (accountType !== "ADMIN" && !position) {
      return res.status(400).json({ success: false, message: "Position is required for this account type" });
    }

    // Check if employee ID already exists
    const existingEmployeeId = await Responder.findOne({ employeeId });
    if (existingEmployeeId) {
      return res.status(400).json({ success: false, message: "Employee ID already registered" });
    }

    // Check if email already exists
    const existingEmail = await Responder.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Different handling for ADMIN vs BARANGAY/POSO
    const isAdmin = accountType === "ADMIN";
    
    const newResponder = new Responder({
      fullName,
      accountType,
      employeeId,
      email,
      phone,
      barangay,
      position: accountType === "ADMIN" ? "Administrator" : position,
      password: hashedPassword,
      isEmailVerified: isAdmin ? true : false, // ADMIN doesn't need email verification initially
      isApproved: !isAdmin, // Auto-approve BARANGAY/POSO, require approval for ADMIN
      approvalStatus: isAdmin ? "pending" : "approved",
      emailVerificationToken: isAdmin ? null : verificationToken, // Only set token for non-ADMIN
      emailVerificationExpiry: isAdmin ? null : verificationExpiry,
    });

    await newResponder.save();
    
    // Send appropriate email based on account type
    if (isAdmin) {
      // Send admin request notification (no verification link)
      await sendAdminRequestEmail(email, fullName);
      
      // Create notification for all existing admins
      const existingAdmins = await Responder.find({ accountType: "ADMIN", isApproved: true });
      const notifications = existingAdmins.map(admin => ({
        recipientId: admin._id,
        recipientType: "responder",
        type: "admin_request",
        title: "New Admin Request",
        message: `${fullName} requested admin access`,
        relatedId: newResponder._id,
        relatedType: "responder",
      }));
      
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        
        // Emit real-time notification to all admins
        existingAdmins.forEach(admin => {
          io.to(`user_${admin._id}`).emit("new_notification", {
            type: "admin_request",
            title: "New Admin Request",
            message: `${fullName} requested admin access`,
            timestamp: new Date(),
          });
        });
      }
    } else {
      // Send regular verification email for BARANGAY/POSO
      await sendVerificationEmail(email, verificationToken);
    }

    const message = isAdmin 
      ? "Admin account request submitted! You'll receive an email once your request is reviewed."
      : "Account created! Please check your email to verify your account.";

    return res.status(201).json({
      success: true,
      message,
      requiresApproval: isAdmin,
    });
  } catch (error) {
    console.error("Responder register error:", error);
    return res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

// ─── RESPONDER LOGIN ─────────────────────────────────────────────────────────
app.post("/api/responder/login", async (req, res) => {
  try {
    const { employeeId, accountType, password } = req.body;

    if (!employeeId || !accountType || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const responder = await Responder.findOne({ employeeId, accountType });

    if (!responder) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if account is approved (for ADMIN accounts)
    if (responder.accountType === "ADMIN") {
      if (!responder.isApproved || responder.approvalStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message: responder.approvalStatus === "rejected" 
            ? "Your admin account request has been rejected. Please contact support."
            : "Your admin account request is pending approval. You'll receive an email once it's reviewed.",
          needsApproval: true,
          approvalStatus: responder.approvalStatus,
        });
      }
    }

    // For non-ADMIN accounts, check email verification
    // ADMIN accounts don't need email verification (they're pre-verified and only need approval)
    if (responder.accountType !== "ADMIN" && !responder.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please check your inbox or resend verification.",
        needsVerification: true,
      });
    }

    const isMatch = await bcrypt.compare(password, responder.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: responder._id, type: "responder" }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      responder: {
        id: responder._id,
        fullName: responder.fullName,
        accountType: responder.accountType,
        employeeId: responder.employeeId,
        email: responder.email,
        phone: responder.phone,
        barangay: responder.barangay,
        position: responder.position,
        isEmailVerified: responder.isEmailVerified,
        isApproved: responder.isApproved,
      },
    });
  } catch (error) {
    console.error("Responder login error:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// ─── RESPONDER RESEND VERIFICATION EMAIL ─────────────────────────────────────
app.post("/api/responder/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const responder = await Responder.findOne({ email });

    if (!responder) {
      return res.status(200).json({ success: true, message: "If this email exists, a verification link has been sent." });
    }

    if (responder.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    responder.emailVerificationToken = verificationToken;
    responder.emailVerificationExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await responder.save();

    await sendVerificationEmail(email, verificationToken);

    return res.status(200).json({ success: true, message: "Verification email resent successfully" });
  } catch (error) {
    console.error("Responder resend verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET PENDING ADMIN REQUESTS ──────────────────────────────────────────────
app.get("/api/responder/pending-requests", async (req, res) => {
  try {
    const pendingRequests = await Responder.find({
      accountType: "ADMIN",
      approvalStatus: "pending",
      isApproved: false,
    }).select("-password -emailVerificationToken").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error("Get pending requests error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── APPROVE/REJECT ADMIN REQUEST ────────────────────────────────────────────
app.post("/api/responder/approve-admin", async (req, res) => {
  try {
    const { responderId, approved } = req.body;

    if (!responderId || approved === undefined) {
      return res.status(400).json({ success: false, message: "Responder ID and approval status are required" });
    }

    const responder = await Responder.findById(responderId);

    if (!responder) {
      return res.status(404).json({ success: false, message: "Responder not found" });
    }

    if (responder.accountType !== "ADMIN") {
      return res.status(400).json({ success: false, message: "This endpoint is only for admin accounts" });
    }

    responder.isApproved = approved;
    responder.approvalStatus = approved ? "approved" : "rejected";

    // ADMIN accounts don't need email verification - they're already pre-verified
    // Just notify them of approval/rejection
    await responder.save();

    // Send approval/rejection email (no verification link needed for ADMIN)
    await sendApprovalEmail(responder.email, responder.fullName, approved, null);

    return res.status(200).json({
      success: true,
      message: `Admin account ${approved ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Approve admin error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET DASHBOARD STATISTICS ────────────────────────────────────────────────
app.get("/api/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments({ isEmailVerified: true });
    
    // Get total responders count (approved only)
    const totalResponders = await Responder.countDocuments({ isApproved: true });
    
    // Get pending admin requests
    const pendingAdminRequests = await Responder.countDocuments({
      accountType: "ADMIN",
      approvalStatus: "pending",
      isApproved: false,
    });
    
    // Get total newsfeed posts
    const totalPosts = await NewsfeedPost.countDocuments();
    
    // Get recent posts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPosts = await NewsfeedPost.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get weekly post activity (last 7 days)
    const weeklyActivity = await NewsfeedPost.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format weekly data (1=Sunday, 2=Monday, etc.)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = Array(7).fill(0).map((_, index) => {
      const dayOfWeek = index === 0 ? 1 : index + 1; // Adjust for MongoDB's day numbering
      const activity = weeklyActivity.find(a => a._id === dayOfWeek);
      return {
        day: dayNames[index],
        count: activity ? activity.count : 0
      };
    });
    
    // Get recent newsfeed posts
    const recentNewsfeedPosts = await NewsfeedPost.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("authorId", "fullName email")
      .lean();
    
    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalResponders,
        pendingAdminRequests,
        totalPosts,
        recentPosts,
        weeklyData,
        recentNewsfeedPosts
      }
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── FOLLOW/UNFOLLOW USER ────────────────────────────────────────────────────
app.post("/api/users/:userId/follow", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);
    
    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUserId.toString());
    } else {
      // Follow
      currentUser.following.push(userId);
      userToFollow.followers.push(currentUserId);
    }

    await currentUser.save();
    await userToFollow.save();

    return res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
    });
  } catch (error) {
    console.error("Follow/unfollow error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET SUGGESTED USERS ─────────────────────────────────────────────────────
app.get("/api/users/suggested", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    // Get users that the current user is not following and exclude self
    const suggestedUsers = await User.find({
      _id: { 
        $ne: currentUserId,
        $nin: currentUser.following 
      },
      isEmailVerified: true
    })
    .select("fullName email profileImage followers following")
    .limit(10)
    .lean();

    // Add isFollowing flag and format response
    const formattedUsers = suggestedUsers.map(user => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      profileImage: user.profileImage,
      avatar: user.fullName.charAt(0).toUpperCase(),
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isFollowing: false
    }));

    return res.status(200).json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Get suggested users error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET USER PROFILE ────────────────────────────────────────────────────────
app.get("/api/users/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId)
      .select("fullName email profileImage followers following createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(userId);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
        avatar: user.fullName.charAt(0).toUpperCase(),
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        isFollowing,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET USER FOLLOWERS ──────────────────────────────────────────────────────
app.get("/api/users/:userId/followers", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("followers", "fullName email profileImage")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const followers = user.followers.map(follower => ({
      id: follower._id,
      fullName: follower.fullName,
      email: follower.email,
      profileImage: follower.profileImage,
      avatar: follower.fullName.charAt(0).toUpperCase(),
    }));

    return res.status(200).json({
      success: true,
      followers,
    });
  } catch (error) {
    console.error("Get followers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET USER FOLLOWING ──────────────────────────────────────────────────────
app.get("/api/users/:userId/following", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("following", "fullName email profileImage")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const following = user.following.map(followedUser => ({
      id: followedUser._id,
      fullName: followedUser.fullName,
      email: followedUser.email,
      profileImage: followedUser.profileImage,
      avatar: followedUser.fullName.charAt(0).toUpperCase(),
    }));

    return res.status(200).json({
      success: true,
      following,
    });
  } catch (error) {
    console.error("Get following error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── MESSAGING ENDPOINTS ─────────────────────────────────────────────────────

// Get all conversations for current user
app.get("/api/conversations", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "fullName email profileImage")
      .populate("receiverId", "fullName email profileImage")
      .lean();

    // Group by conversation and get latest message
    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUserId = msg.senderId._id.toString() === currentUserId.toString() 
        ? msg.receiverId._id.toString() 
        : msg.senderId._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        const otherUser = msg.senderId._id.toString() === currentUserId.toString() 
          ? msg.receiverId 
          : msg.senderId;

        // Count unread messages from this user
        const unreadCount = await Message.countDocuments({
          conversationId: [currentUserId.toString(), otherUserId].sort().join("_"),
          receiverId: currentUserId,
          read: false
        });

        conversationsMap.set(otherUserId, {
          id: otherUser._id,
          name: otherUser.fullName,
          email: otherUser.email,
          avatar: otherUser.profileImage,
          lastMessage: msg.text,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          unread: unreadCount,
          online: false, // TODO: Implement online status with Socket.IO
          createdAt: msg.createdAt,
        });
      }
    }

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get conversation messages
app.get("/api/messages/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Create conversation ID (always use smaller ID first for consistency)
    const conversationId = [currentUserId.toString(), userId].sort().join("_");

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName email")
      .populate("receiverId", "fullName email")
      .lean();

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      text: msg.text,
      sender: msg.senderId._id.toString() === currentUserId.toString() ? "me" : "them",
      senderId: msg.senderId._id,
      senderName: msg.senderId.fullName,
      receiverId: msg.receiverId._id,
      receiverName: msg.receiverId.fullName,
      read: msg.read,
      time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: msg.createdAt,
    }));

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send message
app.post("/api/messages/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;
    const currentUserId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text is required" });
    }

    // Create conversation ID
    const conversationId = [currentUserId.toString(), userId].sort().join("_");

    const newMessage = new Message({
      conversationId,
      senderId: currentUserId,
      receiverId: userId,
      text: text.trim(),
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName email")
      .populate("receiverId", "fullName email")
      .lean();

    const formattedMessage = {
      id: populatedMessage._id,
      text: populatedMessage.text,
      sender: "me",
      senderId: populatedMessage.senderId._id,
      senderName: populatedMessage.senderId.fullName,
      receiverId: populatedMessage.receiverId._id,
      receiverName: populatedMessage.receiverId.fullName,
      read: populatedMessage.read,
      time: new Date(populatedMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: populatedMessage.createdAt,
    };

    // Emit to receiver via Socket.IO
    io.to(`user_${userId}`).emit("new_message", {
      ...formattedMessage,
      sender: "them",
    });

    return res.status(200).json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark messages as read
app.put("/api/messages/:userId/read", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const conversationId = [currentUserId.toString(), userId].sort().join("_");

    await Message.updateMany(
      {
        conversationId,
        receiverId: currentUserId,
        read: false,
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── SOCKET.IO CONNECTION ────────────────────────────────────────────────────
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);

  // User joins with their ID
  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, socket.id);
    console.log(`✅ User ${userId} joined room: user_${userId}`);
  });

  // User is typing
  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(`user_${receiverId}`).emit("user_typing", { userId: senderId });
  });

  // User stopped typing
  socket.on("stop_typing", ({ senderId, receiverId }) => {
    io.to(`user_${receiverId}`).emit("user_stop_typing", { userId: senderId });
  });

  socket.on("disconnect", () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ═══ NOTIFICATION ENDPOINTS ════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET NOTIFICATIONS ───────────────────────────────────────────────────────
app.get("/api/notifications", async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ success: false, message: "userId and userType are required" });
    }

    const notifications = await Notification.find({
      recipientId: userId,
      recipientType: userType,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedNotifications = notifications.map(notif => ({
      id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      read: notif.read,
      relatedId: notif.relatedId,
      relatedType: notif.relatedType,
      time: getTimeAgo(notif.createdAt),
      timestamp: notif.createdAt,
    }));

    const unreadCount = notifications.filter(n => !n.read).length;

    return res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── MARK NOTIFICATION AS READ ───────────────────────────────────────────────
app.put("/api/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── MARK ALL NOTIFICATIONS AS READ ──────────────────────────────────────────
app.put("/api/notifications/mark-all-read", async (req, res) => {
  try {
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ success: false, message: "userId and userType are required" });
    }

    await Notification.updateMany(
      {
        recipientId: userId,
        recipientType: userType,
        read: false,
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── DELETE NOTIFICATION ─────────────────────────────────────────────────────
app.delete("/api/notifications/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── WASTE DETECTION WITH YOLOV8 ─────────────────────────────────────────────
const wasteUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.post("/api/detect-waste", authMiddleware, wasteUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    // Try to use Python YOLOv8 service if available
    const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://localhost:5001/detect';
    
    try {
      const FormData = require('form-data');
      const axios = require('axios');
      
      const formData = new FormData();
      formData.append('image', req.file.buffer, {
        filename: 'waste.jpg',
        contentType: req.file.mimetype
      });

      const response = await axios.post(YOLO_SERVICE_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 10000 // 10 second timeout
      });

      if (response.data.success) {
        return res.status(200).json({
          success: true,
          result: response.data.result,
          message: "Waste detected successfully"
        });
      }
    } catch (yoloError) {
      console.log("⚠️ YOLOv8 service unavailable, using mock detection:", yoloError.message);
      // Fall back to mock detection if Python service is not available
    }

    // Mock detection result (fallback when Python service is unavailable)
    const mockDetection = simulateWasteDetection();

    return res.status(200).json({
      success: true,
      result: mockDetection,
      message: "Waste detected successfully (demo mode)"
    });

  } catch (error) {
    console.error("Waste detection error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to detect waste type" 
    });
  }
});

// ─── REAL-TIME WASTE DETECTION (Multiple Objects) ────────────────────────────
app.post("/api/detect-waste-realtime", authMiddleware, wasteUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    // Try to use Python YOLOv8 service if available
    const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://localhost:5001/detect-multiple';
    
    try {
      const FormData = require('form-data');
      const axios = require('axios');
      
      const formData = new FormData();
      formData.append('image', req.file.buffer, {
        filename: 'frame.jpg',
        contentType: req.file.mimetype
      });

      const response = await axios.post(YOLO_SERVICE_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 5000 // 5 second timeout for real-time
      });

      if (response.data.success) {
        return res.status(200).json({
          success: true,
          detections: response.data.detections,
          message: "Objects detected"
        });
      }
    } catch (yoloError) {
      console.log("⚠️ YOLOv8 service unavailable for real-time:", yoloError.message);
      // Fall back to mock detection
    }

    // Mock multiple detections for demo
    const mockDetections = simulateMultipleDetections();

    return res.status(200).json({
      success: true,
      detections: mockDetections,
      message: "Objects detected (demo mode)"
    });

  } catch (error) {
    console.error("Real-time detection error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to detect objects" 
    });
  }
});

// Mock function to simulate YOLOv8 detection
// Replace this with actual YOLOv8 API integration
function simulateWasteDetection() {
  const wasteTypes = [
    {
      wasteType: "Plastic Bottle",
      category: "Recyclable",
      confidence: 95,
      recommendation: "Place in recyclable bin. Rinse before disposal."
    },
    {
      wasteType: "Food Waste",
      category: "Biodegradable",
      confidence: 88,
      recommendation: "Dispose in compost bin or biodegradable waste container."
    },
    {
      wasteType: "Paper",
      category: "Recyclable",
      confidence: 92,
      recommendation: "Place in paper recycling bin. Keep dry."
    },
    {
      wasteType: "Metal Can",
      category: "Recyclable",
      confidence: 97,
      recommendation: "Rinse and place in metal recycling bin."
    },
    {
      wasteType: "Glass Bottle",
      category: "Recyclable",
      confidence: 94,
      recommendation: "Place in glass recycling bin. Remove caps."
    },
    {
      wasteType: "Electronic Waste",
      category: "Hazardous",
      confidence: 85,
      recommendation: "Take to e-waste collection center. Do not dispose in regular bins."
    }
  ];

  // Return random waste type for demo
  return wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
}

// Mock function for multiple object detection (real-time)
function simulateMultipleDetections() {
  const screenWidth = 375; // Approximate screen width
  const screenHeight = 667; // Approximate screen height
  
  const objects = [
    { label: 'Plastic Bottle', confidence: 0.95, color: '#2196F3' },
    { label: 'Paper', confidence: 0.88, color: '#4CAF50' },
    { label: 'Metal Can', confidence: 0.92, color: '#FF9800' },
    { label: 'Glass', confidence: 0.87, color: '#9C27B0' },
    { label: 'Cardboard', confidence: 0.91, color: '#795548' },
  ];

  // Randomly select 1-3 objects to detect
  const numObjects = Math.floor(Math.random() * 3) + 1;
  const selectedObjects = [];
  
  for (let i = 0; i < numObjects; i++) {
    const obj = objects[Math.floor(Math.random() * objects.length)];
    const x = Math.random() * (screenWidth - 150);
    const y = Math.random() * (screenHeight - 200) + 100;
    const width = Math.random() * 100 + 80;
    const height = Math.random() * 120 + 100;
    
    selectedObjects.push({
      label: obj.label,
      confidence: obj.confidence,
      x: x,
      y: y,
      width: width,
      height: height,
    });
  }

  return selectedObjects;
}

// ─── START SERVER ────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${LOCAL_IP}:${PORT}`);
  console.log(`\n📱 Test endpoints:`);
  console.log(`   http://${LOCAL_IP}:${PORT}/health`);
  console.log(`   http://${LOCAL_IP}:${PORT}/status`);
  console.log(`\n💡 Devices on the same network can connect using: http://${LOCAL_IP}:${PORT}\n`);
  console.log(`🔌 Socket.IO ready for real-time messaging\n`);
  
  // Auto-migrate existing posts on startup
  migrateExistingPosts();
});

// ─── MIGRATION: Convert comments from number to array ───────────────────────
async function migrateExistingPosts() {
  try {
    const postsToMigrate = await NewsfeedPost.find({ 
      comments: { $type: "number" } 
    });

    if (postsToMigrate.length > 0) {
      console.log(`\n🔄 Migrating ${postsToMigrate.length} posts with old comment format...`);
      
      for (const post of postsToMigrate) {
        post.comments = []; // Convert number to empty array
        await post.save();
      }
      
      console.log(`✅ Migration complete! ${postsToMigrate.length} posts updated.\n`);
    }
  } catch (error) {
    console.error("❌ Migration error:", error.message);
  }
}