import { Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from "../../config";

export default function UserRegister({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Controls whether we show the registration form or the "check your email" screen
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ─── Password Validation ───────────────────────────────────────────────────
  const validatePassword = (pass) => {
    if (pass.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(pass)) {
      return { isValid: false, message: "Password must contain at least 1 capital letter" };
    }
    if (!/[0-9]/.test(pass)) {
      return { isValid: false, message: "Password must contain at least 1 number" };
    }
    return { isValid: true, message: "" };
  };

  // ─── Image Picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant permission to access your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // ─── Resend Verification Email ─────────────────────────────────────────────
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const response = await fetch(`${API_URL}/api/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Email Resent", "A new verification email has been sent. Please check your inbox.");
        // Start 30-second cooldown to prevent spam
        setResendCooldown(30);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      Alert.alert("Network Error", "Failed to resend email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // ─── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    // ── Client-side validation
    if (!fullName.trim()) {
      Alert.alert("Required Field", "Please enter your full name");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Required Field", "Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
    if (!gender) {
      Alert.alert("Required Field", "Please select your gender");
      return;
    }
    if (!password) {
      Alert.alert("Required Field", "Please enter a password");
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert("Invalid Password", passwordValidation.message);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords don't match!");
      return;
    }

    // ── Send to backend
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          gender,
          password,
          profileImage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show the "check your email" screen
        setRegisteredEmail(email.trim().toLowerCase());
        setRegistrationSuccess(true);
      } else {
        Alert.alert("Registration Failed", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not connect to the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RENDER: Email Verification Pending Screen ────────────────────────────
  if (registrationSuccess) {
    return (
      <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
            <View style={styles.verificationContainer}>
              {/* Icon */}
              <View style={styles.verificationIconWrapper}>
                <Ionicons name="mail" size={56} color="#2E7D32" />
              </View>

              <Text style={styles.verificationTitle}>Check Your Email</Text>
              <Text style={styles.verificationSubtitle}>
                We've sent a verification email to:
              </Text>
              <Text style={styles.verificationEmail}>{registeredEmail}</Text>
              <Text style={styles.verificationDescription}>
                Please open your email and click the verification link to activate your account.
                The link will expire in 1 hour.
              </Text>

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>📌 Didn't receive the email?</Text>
                <Text style={styles.tipText}>• Check your Spam or Junk folder</Text>
                <Text style={styles.tipText}>• Make sure the email address is correct</Text>
                <Text style={styles.tipText}>• Wait a few minutes and try again</Text>
              </View>

              {/* Resend Button */}
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (resendCooldown > 0 || isResending) && styles.resendButtonDisabled,
                ]}
                onPress={handleResendEmail}
                disabled={resendCooldown > 0 || isResending}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.resendButtonText}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity style={styles.backToLoginButton} onPress={() => navigation.navigate('UserLogin')}>
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ─── RENDER: Registration Form ─────────────────────────────────────────────
  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
          {/* Header */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="person-add" size={64} color="#2E7D32" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the community to start reporting</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            {/* Profile Picture Upload (Optional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Profile Picture <Text style={styles.optionalText}>(Optional)</Text>
              </Text>
              <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={40} color="#2E7D32" />
                    <Text style={styles.uploadText}>Upload Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Full Name <Text style={styles.requiredText}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Email <Text style={styles.requiredText}>*</Text>
              </Text>
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

            {/* Gender Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Gender <Text style={styles.requiredText}>*</Text>
              </Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, gender === "male" && styles.genderButtonActive]}
                  onPress={() => setGender("male")}
                >
                  <Ionicons name="male" size={24} color={gender === "male" ? "#FFFFFF" : "#2E7D32"} />
                  <Text style={[styles.genderText, gender === "male" && styles.genderTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.genderButton, gender === "female" && styles.genderButtonActive]}
                  onPress={() => setGender("female")}
                >
                  <Ionicons name="female" size={24} color={gender === "female" ? "#FFFFFF" : "#2E7D32"} />
                  <Text style={[styles.genderText, gender === "female" && styles.genderTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.genderButton, gender === "other" && styles.genderButtonActive]}
                  onPress={() => setGender("other")}
                >
                  <Ionicons name="transgender" size={24} color={gender === "other" ? "#FFFFFF" : "#2E7D32"} />
                  <Text style={[styles.genderText, gender === "other" && styles.genderTextActive]}>
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Password <Text style={styles.requiredText}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
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
              <Text style={styles.passwordHint}>
                Must contain at least 8 characters, 1 capital letter, and 1 number
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Confirm Password <Text style={styles.requiredText}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#757575"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('UserLogin')}>
                <Text style={styles.loginLink}>Login here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
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
  title: { fontSize: 26, fontWeight: "bold", color: "#2E7D32", marginTop: 15, marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#1B5E20" },

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
  optionalText: { color: "#757575", fontSize: 12, fontWeight: "normal" },

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

  imageUploadContainer: { alignItems: "center", marginBottom: 10 },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#2E7D32",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#2E7D32",
  },
  uploadText: { marginTop: 8, fontSize: 12, color: "#2E7D32", fontWeight: "600" },

  genderContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    gap: 6,
  },
  genderButtonActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  genderText: { fontSize: 13, fontWeight: "600", color: "#2E7D32" },
  genderTextActive: { color: "#FFFFFF" },

  registerButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: { backgroundColor: "#81C784", shadowOpacity: 0 },
  registerButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },

  loginContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  loginText: { fontSize: 14, color: "#757575" },
  loginLink: { fontSize: 14, color: "#2E7D32", fontWeight: "bold" },

  // ── Verification Screen Styles ─────────────────────────────────────────────
  verificationContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 60,
  },
  verificationIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 6,
  },
  verificationEmail: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 12,
  },
  verificationDescription: {
    fontSize: 13,
    color: "#757575",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  tipsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  resendButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: "center",
    width: "100%",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  resendButtonDisabled: { backgroundColor: "#81C784", shadowOpacity: 0 },
  resendButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
  backToLoginButton: { marginTop: 18 },
  backToLoginText: { fontSize: 14, color: "#2E7D32", fontWeight: "600" },
});