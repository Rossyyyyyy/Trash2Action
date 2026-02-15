import { Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from "../../config";

export default function ResponderRegister({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [barangay, setBarangay] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Email verification screen state
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [requiresApproval, setRequiresApproval] = useState(false);

  const accountTypes = [
    { label: "Admin", value: "ADMIN" },
    { label: "Barangay", value: "BARANGAY" },
    { label: "POSO", value: "POSO" },
  ];

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

  // ─── Resend Verification Email ─────────────────────────────────────────────
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const response = await fetch(`${API_URL}/api/responder/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Email Resent", "A new verification email has been sent. Please check your inbox.");
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

  const handleRegister = async () => {
    // ── Client-side validation
    if (!fullName.trim()) {
      Alert.alert("Required Field", "Please enter your full name");
      return;
    }
    if (!accountType) {
      Alert.alert("Required Field", "Please select your account type");
      return;
    }
    if (!employeeId.trim()) {
      Alert.alert("Required Field", "Please enter your employee ID");
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
    if (!phone.trim()) {
      Alert.alert("Required Field", "Please enter your phone number");
      return;
    }
    if (!barangay.trim()) {
      Alert.alert("Required Field", "Please enter your barangay");
      return;
    }
    // Position is only required for non-ADMIN accounts
    if (accountType !== "ADMIN" && !position.trim()) {
      Alert.alert("Required Field", "Please enter your position");
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
      const response = await fetch(`${API_URL}/api/responder/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          accountType,
          employeeId: employeeId.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          barangay: barangay.trim(),
          position: accountType === "ADMIN" ? "Administrator" : position.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRegisteredEmail(email.trim().toLowerCase());
        setRequiresApproval(data.requiresApproval || false);
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.verificationContainer}>
              <View style={styles.verificationIconWrapper}>
                <Ionicons name={requiresApproval ? "time" : "mail"} size={56} color="#2E7D32" />
              </View>

              <Text style={styles.verificationTitle}>
                {requiresApproval ? "Request Submitted" : "Check Your Email"}
              </Text>
              <Text style={styles.verificationSubtitle}>
                {requiresApproval 
                  ? "Your admin account request has been submitted"
                  : "We've sent a verification email to:"}
              </Text>
              <Text style={styles.verificationEmail}>{registeredEmail}</Text>
              <Text style={styles.verificationDescription}>
                {requiresApproval
                  ? "Your request is pending approval from system administrators. You'll receive an email notification once your request has been reviewed. This typically takes 1-2 business days."
                  : "Please open your email and click the verification link to activate your account. The link will expire in 1 hour."}
              </Text>

              {!requiresApproval && (
                <>
                  <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>📌 Didn't receive the email?</Text>
                    <Text style={styles.tipText}>• Check your Spam or Junk folder</Text>
                    <Text style={styles.tipText}>• Make sure the email address is correct</Text>
                    <Text style={styles.tipText}>• Wait a few minutes and try again</Text>
                  </View>

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
                </>
              )}

              <TouchableOpacity style={styles.backToLoginButton} onPress={() => navigation.navigate('ResponderLogin')}>
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
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
            <MaterialCommunityIcons name="shield-account" size={64} color="#2E7D32" />
            <Text style={styles.title}>Responder Registration</Text>
            <Text style={styles.subtitle}>Request access as an authorized responder</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Account Type <Text style={styles.requiredText}>*</Text>
              </Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color="#757575" style={styles.inputIcon} />
                <Text style={[styles.dropdownButtonText, !accountType && styles.placeholderText]}>
                  {accountType ? accountTypes.find(t => t.value === accountType)?.label : "Select account type"}
                </Text>
                <Ionicons 
                  name={showDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#757575" 
                />
              </TouchableOpacity>
              
              {showDropdown && (
                <View style={styles.dropdownList}>
                  {accountTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.dropdownItem,
                        accountType === type.value && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setAccountType(type.value);
                        setShowDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        accountType === type.value && styles.dropdownItemTextSelected
                      ]}>
                        {type.label}
                      </Text>
                      {accountType === type.value && (
                        <Ionicons name="checkmark" size={20} color="#2E7D32" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Employee ID <Text style={styles.requiredText}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your employee ID"
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.requiredText}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Barangay <Text style={styles.requiredText}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your barangay"
                  value={barangay}
                  onChangeText={setBarangay}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Only show Position field if account type is not ADMIN */}
            {accountType !== "ADMIN" && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Position <Text style={styles.requiredText}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="briefcase-outline" size={20} color="#757575" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Barangay Tanod, Environment Officer"
                    value={position}
                    onChangeText={setPosition}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            )}

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

            <View style={styles.noteBox}>
              <Ionicons name="information-circle" size={20} color="#2E7D32" />
              <Text style={styles.noteText}>
                {accountType === "ADMIN" 
                  ? "Admin accounts require approval. You'll receive an email once your request is reviewed."
                  : "You'll receive a verification email after registration. Please verify your email before logging in."}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>
                  {accountType === "ADMIN" ? "Request Account" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ResponderLogin')}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#1B5E20",
    textAlign: "center",
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  requiredText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#424242",
  },
  placeholderText: {
    color: "#999",
  },
  dropdownList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  dropdownItemSelected: {
    backgroundColor: "#E8F5E9",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#424242",
  },
  dropdownItemTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#424242",
  },
  noteBox: {
    flexDirection: "row",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#1B5E20",
    lineHeight: 18,
  },
  registerButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    backgroundColor: "#81C784",
    shadowOpacity: 0,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  passwordHint: {
    fontSize: 11,
    color: "#757575",
    marginTop: 5,
    marginLeft: 5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: "#757575",
  },
  loginLink: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "bold",
  },
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
  resendButtonDisabled: {
    backgroundColor: "#81C784",
    shadowOpacity: 0,
  },
  resendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  backToLoginButton: {
    marginTop: 18,
  },
  backToLoginText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
});