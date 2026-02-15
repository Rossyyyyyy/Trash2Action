//SERVER.JS
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cors = require("cors");
const os = require("os");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

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

// ─── START SERVER ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${LOCAL_IP}:${PORT}`);
  console.log(`\n📱 Test endpoints:`);
  console.log(`   http://${LOCAL_IP}:${PORT}/health`);
  console.log(`   http://${LOCAL_IP}:${PORT}/status`);
  console.log(`\n💡 Devices on the same network can connect using: http://${LOCAL_IP}:${PORT}\n`);
});