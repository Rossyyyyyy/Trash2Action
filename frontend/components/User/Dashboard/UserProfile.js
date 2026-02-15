//Trash2Action/components/User/Dashboard/UserProfile.js
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function UserProfile({ token, user, onLogout }) {
  // ── Placeholder stats (replace with API calls later) ─────────────────────
  const stats = {
    totalReports: 12,
    pointsEarned: 840,
    rank: 5,
    streak: 7,       // days
    level: "Silver",
  };

  const menuItems = [
    { id: "edit", icon: "create-outline",       label: "Edit Profile",         color: "#2E7D32" },
    { id: "security", icon: "lock-closed-outline", label: "Security & Password",  color: "#2196F3" },
    { id: "privacy", icon: "eye-outline",       label: "Privacy Settings",     color: "#9C27B0" },
    { id: "help", icon: "help-circle-outline",  label: "Help & Support",       color: "#FF7043" },
    { id: "about", icon: "information-circle-outline", label: "About Trash2Action", color: "#607D8B" },
  ];

  const handleMenuPress = (id) => {
    Alert.alert("Coming Soon", `${menuItems.find(m => m.id === id)?.label} — feature will be available soon!`);
  };

  // ─── Gender display helper ───────────────────────────────────────────────
  const genderLabel = user.gender === "male" ? "Male" : user.gender === "female" ? "Female" : "Other";

  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Profile header card ── */}
        <View style={styles.profileHeaderCard}>
          {/* Avatar */}
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={52} color="#FFFFFF" />
            </View>
            {/* Edit avatar button */}
            <TouchableOpacity style={styles.avatarEditBtn} onPress={() => handleMenuPress("edit")}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Name + verified badge */}
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{user.fullName}</Text>
            {user.isEmailVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#43A047" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.profileEmail}>{user.email}</Text>
          <Text style={styles.profileGender}>{genderLabel} · Member since 2025</Text>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <StatBox icon="document-text" value={stats.totalReports.toString()} label="Reports" color="#2E7D32" />
          <StatBox icon="trophy"        value={stats.pointsEarned.toString()} label="Points"  color="#FB8C00" />
          <StatBox icon="star"          value={`#${stats.rank}`}              label="Rank"    color="#8E24AA" />
          <StatBox icon="flame"         value={`${stats.streak}d`}            label="Streak"  color="#FF5722" />
        </View>

        {/* ── Level banner ── */}
        <View style={styles.levelBanner}>
          <View style={styles.levelIconWrap}>
            <Ionicons name="medal" size={28} color="#FDD835" />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{stats.level} Member</Text>
            <Text style={styles.levelSub}>You need 160 more points to reach Gold</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "68%" }]} />
          </View>
        </View>

        {/* ── Menu items ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Settings</Text>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.color + "15" }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout button ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─── STAT BOX ────────────────────────────────────────────────────────────────
function StatBox({ icon, value, label, color }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statBoxIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  // ── Profile header card
  profileHeaderCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 50,
    marginBottom: 18,
    paddingTop: 30,
    paddingBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarOuter: { position: "relative", marginBottom: 14 },
  avatarInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#43A047",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  profileNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 22, fontWeight: "bold", color: "#1B5E20" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText: { fontSize: 12, color: "#43A047", fontWeight: "600" },
  profileEmail: { fontSize: 13, color: "#757575", marginTop: 4 },
  profileGender: { fontSize: 12, color: "#9E9E9E", marginTop: 3 },

  // ── Stats grid
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  statBoxIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statBoxValue: { fontSize: 17, fontWeight: "bold" },
  statBoxLabel: { fontSize: 10, color: "#9E9E9E", marginTop: 2 },

  // ── Level banner
  levelBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  levelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
  },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 15, fontWeight: "bold", color: "#212121" },
  levelSub: { fontSize: 12, color: "#757575", marginTop: 2 },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#43A047",
    borderRadius: 4,
  },

  // ── Menu section
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#757575",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#424242", fontWeight: "500" },

  // ── Logout button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: { fontSize: 16, color: "#D32F2F", fontWeight: "600" },
});