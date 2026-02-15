import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../config";

export default function UserLogin({ navigation }) {
  // ── Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── Screen navigation
  const [screen, setScreen] = useState("login");

  // ── Forgot Password state
  const [fpEmail, setFpEmail] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpPassword, setFpPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [showFpPassword, setShowFpPassword] = useState(false);
  const [showFpConfirmPassword, setShowFpConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Resend cooldown helper
  const startCooldown = (seconds) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Required Field", "Please enter your email");
      return;
    }
    if (!password) {
      Alert.alert("Required Field", "Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ── Login successful - navigate to UserDashboard ──
        console.log("✅ UserLogin - Login successful!");
        console.log("Token:", data.token);
        console.log("User:", data.user);
        
        // Navigate to UserDashboard with user data
        navigation.replace('UserDashboard', { 
          token: data.token, 
          user: data.user 
        });
        
      } else if (response.status === 403 && data.needsVerification) {
        // ── User exists but email not verified
        Alert.alert(
          "Email Not Verified",
          "Your email has not been verified yet.\n\nPlease check your inbox for the verification link, or we can resend it for you.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resend Verification",
              onPress: () => handleResendVerification(email.trim().toLowerCase()),
            },
          ]
        );
      } else if (response.status === 401) {
        // ── 401 = user not found in DB OR wrong password
        Alert.alert(
          "Login Failed",
          "Account not found or incorrect password.\nPlease register first or check your credentials."
        );
      } else {
        Alert.alert("Login Failed", data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Network Error", "Could not connect to the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RESEND VERIFICATION (from login screen) ────────────────────────────
  const handleResendVerification = async (emailToResend) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToResend }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert("Email Sent", "A verification email has been sent. Please check your inbox.");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch {
      Alert.alert("Network Error", "Failed to resend email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── FORGOT PASSWORD: Step 1 — Enter email ──────────────────────────────
  const handleForgotRequestCode = async () => {
    if (!fpEmail.trim()) {
      Alert.alert("Required Field", "Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fpEmail.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
      });
      const data = await response.json();

      if (response.ok) {
        setScreen("forgotCode");
        startCooldown(30);
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch {
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── FORGOT PASSWORD: Resend code ────────────────────────────────────────
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Code Resent", "A new code has been sent to your email.");
        startCooldown(30);
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch {
      Alert.alert("Network Error", "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── FORGOT PASSWORD: Step 2 — Verify code ──────────────────────────────
  const handleVerifyCode = async () => {
    if (!fpCode.trim()) {
      Alert.alert("Required Field", "Please enter the verification code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/forgot-password/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fpEmail.trim().toLowerCase(),
          code: fpCode.trim(),
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setScreen("forgotReset");
      } else {
        Alert.alert("Invalid Code", data.message || "The code is invalid or has expired.");
      }
    } catch {
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── FORGOT PASSWORD: Step 3 — Reset password ───────────────────────────
  const handleResetPassword = async () => {
    if (!fpPassword) {
      Alert.alert("Required Field", "Please enter a new password");
      return;
    }
    if (fpPassword.length < 8) {
      Alert.alert("Invalid Password", "Password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(fpPassword)) {
      Alert.alert("Invalid Password", "Password must contain at least 1 capital letter");
      return;
    }
    if (!/[0-9]/.test(fpPassword)) {
      Alert.alert("Invalid Password", "Password must contain at least 1 number");
      return;
    }
    if (fpPassword !== fpConfirmPassword) {
      Alert.alert("Password Mismatch", "Passwords don't match!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fpEmail.trim().toLowerCase(),
          code: fpCode.trim(),
          newPassword: fpPassword,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert("Success", "Your password has been reset successfully! You can now log in.", [
          {
            text: "Go to Login",
            onPress: () => {
              setFpEmail("");
              setFpCode("");
              setFpPassword("");
              setFpConfirmPassword("");
              setScreen("login");
            },
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to reset password.");
      }
    } catch {
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RENDER: Forgot Password — Enter Email ──────────────────────────────
  if (screen === "forgotEmail") {
    return (
      <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={() => setScreen("login")}>
              <Ionicons name="arrow-back" size={24} color="#2E7D32" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.fpIconWrapper}>
                <Ionicons name="lock-open-outline" size={48} color="#2E7D32" />
              </View>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                Enter your registered email and we'll send you a reset code.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Email <Text style={styles.requiredText}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#757575" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your registered email"
                    value={fpEmail}
                    onChangeText={setFpEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleForgotRequestCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backToLoginButton} onPress={() => setScreen("login")}>
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ─── RENDER: Forgot Password — Enter Code ───────────────────────────────
  if (screen === "forgotCode") {
    return (
      <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={() => setScreen("forgotEmail")}>
              <Ionicons name="arrow-back" size={24} color="#2E7D32" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.fpIconWrapper}>
                <Ionicons name="keypad-outline" size={48} color="#2E7D32" />
              </View>
              <Text style={styles.title}>Enter Code</Text>
              <Text style={styles.subtitle}>We sent a 6-digit code to {fpEmail}</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Verification Code <Text style={styles.requiredText}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#757575" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    value={fpCode}
                    onChangeText={setFpCode}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.resendRow}
                onPress={handleResendCode}
                disabled={resendCooldown > 0 || isLoading}
              >
                <Text
                  style={[
                    styles.resendText,
                    (resendCooldown > 0 || isLoading) && styles.resendTextDisabled,
                  ]}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleVerifyCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backToLoginButton} onPress={() => setScreen("login")}>
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ─── RENDER: Forgot Password — New Password ─────────────────────────────
  if (screen === "forgotReset") {
    return (
      <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={() => setScreen("forgotCode")}>
              <Ionicons name="arrow-back" size={24} color="#2E7D32" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.fpIconWrapper}>
                <Ionicons name="create-outline" size={48} color="#2E7D32" />
              </View>
              <Text style={styles.title}>New Password</Text>
              <Text style={styles.subtitle}>Create a new secure password</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  New Password <Text style={styles.requiredText}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    value={fpPassword}
                    onChangeText={setFpPassword}
                    secureTextEntry={!showFpPassword}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowFpPassword(!showFpPassword)}>
                    <Ionicons
                      name={showFpPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#757575"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>
                  Must contain at least 8 characters, 1 capital letter, and 1 number
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Confirm Password <Text style={styles.requiredText}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    value={fpConfirmPassword}
                    onChangeText={setFpConfirmPassword}
                    secureTextEntry={!showFpConfirmPassword}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setShowFpConfirmPassword(!showFpConfirmPassword)}>
                    <Ionicons
                      name={showFpConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#757575"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backToLoginButton} onPress={() => setScreen("login")}>
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ─── RENDER: Login Screen (default) ──────────────────────────────────────
  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="people" size={64} color="#2E7D32" />
            <Text style={styles.title}>Community User Login</Text>
            <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#757575"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => setScreen("forgotEmail")}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('UserRegister')}>
                <Text style={styles.registerLink}>Register here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingTop: 40, paddingBottom: 40 },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  header: { alignItems: "center", marginBottom: 30 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: { fontSize: 14, color: "#1B5E20", textAlign: "center", paddingHorizontal: 20 },

  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#2E7D32", marginBottom: 8 },
  requiredText: { color: "#D32F2F", fontSize: 14 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#424242" },
  passwordHint: { fontSize: 11, color: "#757575", marginTop: 5, marginLeft: 5 },

  forgotPassword: { alignSelf: "flex-end", marginBottom: 22 },
  forgotPasswordText: { color: "#2E7D32", fontSize: 14, fontWeight: "600" },

  primaryButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonDisabled: { backgroundColor: "#81C784", shadowOpacity: 0 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },

  registerContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  registerText: { fontSize: 14, color: "#757575" },
  registerLink: { fontSize: 14, color: "#2E7D32", fontWeight: "bold" },

  fpIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  resendRow: { alignItems: "center", marginBottom: 18 },
  resendText: { fontSize: 14, color: "#2E7D32", fontWeight: "600" },
  resendTextDisabled: { color: "#999" },

  backToLoginButton: { alignItems: "center", marginTop: 20 },
  backToLoginText: { fontSize: 14, color: "#2E7D32", fontWeight: "600" },
});