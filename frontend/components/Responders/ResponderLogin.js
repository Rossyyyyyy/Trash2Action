import { Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from "../../config";

export default function ResponderLogin({ navigation }) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const accountTypes = [
    { label: "Admin", value: "ADMIN" },
    { label: "Barangay", value: "BARANGAY" },
    { label: "POSO", value: "POSO" },
  ];

  // ─── RESEND VERIFICATION (from login screen) ────────────────────────────
  const handleResendVerification = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/responder/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  const handleLogin = async () => {
    if (!accountType) {
      Alert.alert("Required Field", "Please select your account type");
      return;
    }
    if (!employeeId.trim()) {
      Alert.alert("Required Field", "Please enter your employee ID");
      return;
    }
    if (!password) {
      Alert.alert("Required Field", "Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/responder/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          accountType,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ ResponderLogin - Login successful!");
        console.log("Token:", data.token);
        console.log("Responder:", data.responder);
        
        // Navigate to Admin Dashboard
        navigation.replace('AdminDashboard', { 
          token: data.token, 
          responder: data.responder 
        });
        
      } else if (response.status === 403 && data.needsApproval) {
        // Admin account not approved yet
        Alert.alert(
          "Account Pending Approval",
          data.message,
          [{ text: "OK" }]
        );
      } else if (response.status === 403 && data.needsVerification) {
        Alert.alert(
          "Email Not Verified",
          "Your email has not been verified yet.\n\nPlease check your inbox for the verification link, or we can resend it for you.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resend Verification",
              onPress: () => {
                // We need to get the email - for now show a prompt
                Alert.prompt(
                  "Enter Email",
                  "Please enter your registered email address:",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Send",
                      onPress: (email) => {
                        if (email && email.trim()) {
                          handleResendVerification(email.trim().toLowerCase());
                        }
                      },
                    },
                  ],
                  "plain-text"
                );
              },
            },
          ]
        );
      } else if (response.status === 401) {
        Alert.alert("Login Failed", "Invalid credentials. Please check your employee ID, account type, and password.");
      } else {
        Alert.alert("Login Failed", data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Network Error", "Could not connect to the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text style={styles.title}>Responder Login</Text>
            <Text style={styles.subtitle}>Authorized personnel only</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
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
              <Text style={styles.label}>Employee ID</Text>
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Contact Administrator</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Need access? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ResponderRegister')}>
                <Text style={styles.registerLink}>Request Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#2E7D32" />
              <Text style={styles.infoText}>
                This portal is for authorized barangay responders only. Unauthorized access is prohibited.
              </Text>
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
    marginBottom: 30,
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
    marginBottom: 16,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: "#81C784",
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  registerText: {
    fontSize: 14,
    color: "#757575",
  },
  registerLink: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#1B5E20",
    lineHeight: 18,
  },
});