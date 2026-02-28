import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../../config";

export default function AdminProfile({ navigation, route }) {
  const { token, responder } = route.params || {};
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFooter, setActiveFooter] = useState("profile");
  
  // Edit profile state
  const [editData, setEditData] = useState({
    fullName: responder?.fullName || "",
    phone: responder?.phone || "",
    email: responder?.email || "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleEditProfile = async () => {
    if (!editData.fullName.trim()) {
      Alert.alert("Error", "Full name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/responders/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully");
        setEditModalVisible(false);
        // Update local responder data
        Object.assign(responder, editData);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/responders/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert("Success", "Password changed successfully");
        setPasswordModalVisible(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        Alert.alert("Error", data.message || "Failed to change password");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => navigation.replace("Home")
        },
      ]
    );
  };

  // Handle footer navigation
  const handleFooterNavigation = (screen) => {
    if (screen === "home") {
      navigation.navigate("AdminDashboard", { token, responder });
    } else if (screen === "newsfeed") {
      navigation.navigate("AdminNewsfeed", { token, responder });
    } else if (screen === "notifications") {
      navigation.navigate("AdminNotif", { token, responder });
    }
    // Profile is current screen, no navigation needed
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={["#2E7D32", "#43A047", "#66BB6A"]} style={styles.headerLarge}>
        <View style={styles.profileHeaderContent}>
          <View style={styles.profileAvatarLarge}>
            <Text style={styles.profileAvatarTextLarge}>
              {responder?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </Text>
          </View>
          <Text style={styles.profileNameLarge}>{responder?.fullName || "Administrator"}</Text>
          <View style={styles.profileBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.profileBadgeText}>{responder?.accountType || "ADMIN"}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {/* Profile Info Card */}
          <View style={styles.profileInfoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Account Information</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Ionicons name="mail" size={20} color="#2E7D32" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.profileInfoText}>{responder?.email || "admin@example.com"}</Text>
              </View>
            </View>
            <View style={styles.profileInfoRow}>
              <Ionicons name="call" size={20} color="#2E7D32" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.profileInfoText}>{responder?.phone || "Not provided"}</Text>
              </View>
            </View>
            <View style={styles.profileInfoRow}>
              <Ionicons name="location" size={20} color="#2E7D32" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Barangay</Text>
                <Text style={styles.profileInfoText}>{responder?.barangay || "Not assigned"}</Text>
              </View>
            </View>
            <View style={[styles.profileInfoRow, styles.lastRow]}>
              <Ionicons name="id-card" size={20} color="#2E7D32" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Employee ID</Text>
                <Text style={styles.profileInfoText}>{responder?.employeeId || "Not assigned"}</Text>
              </View>
            </View>
          </View>

          {/* Menu Options */}
          <View style={styles.menuSection}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setEditModalVisible(true)}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="person-outline" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setPasswordModalVisible(true)}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="lock-closed-outline" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.menuText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconWrapper}>
                <Ionicons name="notifications-outline" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.menuText}>Notification Settings</Text>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconWrapper}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.menuText}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconWrapper}>
                <Ionicons name="help-circle-outline" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.menuText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutMenuItem]} 
              onPress={handleLogout}
            >
              <View style={[styles.menuIconWrapper, styles.logoutIconWrapper]}>
                <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editData.fullName}
                  onChangeText={(text) => setEditData({ ...editData, fullName: text })}
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editData.email}
                  onChangeText={(text) => setEditData({ ...editData, email: text })}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editData.phone}
                  onChangeText={(text) => setEditData({ ...editData, phone: text })}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleEditProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  placeholder="Enter current password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterNavigation("home")}>
          <Ionicons 
            name={activeFooter === "home" ? "home" : "home-outline"} 
            size={26} 
            color={activeFooter === "home" ? "#2E7D32" : "#9E9E9E"} 
          />
          <Text style={[styles.footerText, activeFooter === "home" && styles.footerTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterNavigation("newsfeed")}>
          <Ionicons 
            name={activeFooter === "newsfeed" ? "newspaper" : "newspaper-outline"} 
            size={26} 
            color={activeFooter === "newsfeed" ? "#2E7D32" : "#9E9E9E"} 
          />
          <Text style={[styles.footerText, activeFooter === "newsfeed" && styles.footerTextActive]}>
            Newsfeed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterNavigation("notifications")}>
          <View>
            <Ionicons 
              name={activeFooter === "notifications" ? "notifications" : "notifications-outline"} 
              size={26} 
              color={activeFooter === "notifications" ? "#2E7D32" : "#9E9E9E"} 
            />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </View>
          <Text style={[styles.footerText, activeFooter === "notifications" && styles.footerTextActive]}>
            Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton}>
          <Ionicons 
            name={activeFooter === "profile" ? "person" : "person-outline"} 
            size={26} 
            color={activeFooter === "profile" ? "#2E7D32" : "#9E9E9E"} 
          />
          <Text style={[styles.footerText, activeFooter === "profile" && styles.footerTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F5F5F5" },
  container: { flex: 1 },
  headerLarge: { paddingTop: 50, paddingBottom: 40, paddingHorizontal: 20 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },

  // Profile Header
  profileHeaderContent: { alignItems: "center" },
  profileAvatarLarge: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "rgba(255,255,255,0.3)", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 16, 
    borderWidth: 4, 
    borderColor: "rgba(255,255,255,0.5)" 
  },
  profileAvatarTextLarge: { fontSize: 40, fontWeight: "bold", color: "#FFFFFF" },
  profileNameLarge: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  profileBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "rgba(255,255,255,0.25)", 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 20, 
    gap: 6 
  },
  profileBadgeText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },

  // Profile Info Card
  profileInfoCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2 
  },
  cardHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },
  profileInfoRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: "#F5F5F5", 
    gap: 12 
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  profileInfoText: { 
    fontSize: 15, 
    color: "#212121", 
    fontWeight: "500" 
  },
  
  // Menu Section
  menuSection: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    overflow: "hidden", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2 
  },
  menuItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: "#F5F5F5" 
  },
  menuIconWrapper: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "#E8F5E9", 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: 12 
  },
  logoutIconWrapper: {
    backgroundColor: "#FFEBEE",
  },
  menuText: { flex: 1, fontSize: 15, color: "#212121", fontWeight: "500" },
  logoutMenuItem: { borderBottomWidth: 0 },
  logoutText: { color: "#D32F2F", fontWeight: "600" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#212121",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Footer
  footer: { 
    flexDirection: "row", 
    backgroundColor: "#FFFFFF", 
    borderTopWidth: 1, 
    borderTopColor: "#E0E0E0", 
    paddingBottom: 20, 
    paddingTop: 12, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 10 
  },
  footerButton: { flex: 1, alignItems: "center", paddingVertical: 4 },
  footerText: { fontSize: 11, color: "#9E9E9E", marginTop: 4, fontWeight: "500" },
  footerTextActive: { color: "#2E7D32", fontWeight: "700" },
  notificationBadge: { 
    position: "absolute", 
    top: -4, 
    right: -8, 
    backgroundColor: "#F44336", 
    borderRadius: 10, 
    minWidth: 18, 
    height: 18, 
    justifyContent: "center", 
    alignItems: "center", 
    borderWidth: 2, 
    borderColor: "#FFFFFF" 
  },
  notificationBadgeText: { fontSize: 10, color: "#FFFFFF", fontWeight: "bold" },
});
