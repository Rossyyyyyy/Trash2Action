import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function AdminDashboard({ navigation, route }) {
  const { token, responder } = route.params || {};

  const [activeFooter, setActiveFooter] = useState("home");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeFooter === "newsfeed") {
      navigation.navigate("AdminNewsfeed", { token, responder });
      setActiveFooter("home");
    } else if (activeFooter === "notifications") {
      navigation.navigate("AdminNotif", { token, responder });
      setActiveFooter("home");
    }
  }, [activeFooter]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Simple chart component
  const SimpleBarChart = ({ data, maxValue }) => (
    <View style={styles.chartContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.barWrapper}>
          <View style={styles.barContainer}>
            <LinearGradient
              colors={item.colors}
              style={[styles.bar, { height: `${(item.value / maxValue) * 100}%` }]}
            />
          </View>
          <Text style={styles.barLabel}>{item.label}</Text>
          <Text style={styles.barValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );

  // Render Home Screen with Analytics
  const renderHomeScreen = () => {
    const weeklyData = [
      { label: "Mon", value: 12, colors: ["#4CAF50", "#66BB6A"] },
      { label: "Tue", value: 19, colors: ["#2196F3", "#42A5F5"] },
      { label: "Wed", value: 15, colors: ["#FF9800", "#FFA726"] },
      { label: "Thu", value: 22, colors: ["#9C27B0", "#AB47BC"] },
      { label: "Fri", value: 18, colors: ["#F44336", "#EF5350"] },
      { label: "Sat", value: 8, colors: ["#00BCD4", "#26C6DA"] },
      { label: "Sun", value: 5, colors: ["#FF5722", "#FF7043"] },
    ];

    return (
      <View style={styles.container}>
        <LinearGradient colors={["#2E7D32", "#43A047", "#66BB6A"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Welcome back, {responder?.fullName?.split(" ")[0] || "Admin"}!
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.replace("Home")}>
              <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.scrollContent}>
            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <LinearGradient colors={["#2196F3", "#1976D2"]} style={styles.statCard}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="document-text" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>247</Text>
                <Text style={styles.statLabel}>Total Reports</Text>
                <View style={styles.statBadge}>
                  <Ionicons name="trending-up" size={12} color="#4CAF50" />
                  <Text style={styles.statBadgeText}>+12%</Text>
                </View>
              </LinearGradient>

              <LinearGradient colors={["#FF9800", "#F57C00"]} style={styles.statCard}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="time" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>38</Text>
                <Text style={styles.statLabel}>Pending</Text>
                <View style={styles.statBadge}>
                  <Ionicons name="alert-circle" size={12} color="#FF5722" />
                  <Text style={styles.statBadgeText}>Urgent</Text>
                </View>
              </LinearGradient>

              <LinearGradient colors={["#4CAF50", "#388E3C"]} style={styles.statCard}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>189</Text>
                <Text style={styles.statLabel}>Resolved</Text>
                <View style={styles.statBadge}>
                  <Ionicons name="trending-up" size={12} color="#4CAF50" />
                  <Text style={styles.statBadgeText}>+8%</Text>
                </View>
              </LinearGradient>

              <LinearGradient colors={["#9C27B0", "#7B1FA2"]} style={styles.statCard}>
                <View style={styles.statIconCircle}>
                  <Ionicons name="people" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>1,234</Text>
                <Text style={styles.statLabel}>Active Users</Text>
                <View style={styles.statBadge}>
                  <Ionicons name="trending-up" size={12} color="#4CAF50" />
                  <Text style={styles.statBadgeText}>+24</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Weekly Reports Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.chartTitle}>Weekly Reports</Text>
                  <Text style={styles.chartSubtitle}>Last 7 days activity</Text>
                </View>
                <TouchableOpacity style={styles.chartButton}>
                  <Text style={styles.chartButtonText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#2E7D32" />
                </TouchableOpacity>
              </View>
              <SimpleBarChart data={weeklyData} maxValue={25} />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate("AdminRequest", { token, responder })}
              >
                <LinearGradient colors={["#FFF3E0", "#FFE0B2"]} style={styles.actionGradient}>
                  <Ionicons name="person-add" size={32} color="#F57C00" />
                </LinearGradient>
                <Text style={styles.actionTitle}>Admin Requests</Text>
                <Text style={styles.actionSubtitle}>Review pending</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient colors={["#E3F2FD", "#BBDEFB"]} style={styles.actionGradient}>
                  <Ionicons name="document-text" size={32} color="#1976D2" />
                </LinearGradient>
                <Text style={styles.actionTitle}>View Reports</Text>
                <Text style={styles.actionSubtitle}>All submissions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient colors={["#F3E5F5", "#E1BEE7"]} style={styles.actionGradient}>
                  <Ionicons name="people" size={32} color="#7B1FA2" />
                </LinearGradient>
                <Text style={styles.actionTitle}>Manage Users</Text>
                <Text style={styles.actionSubtitle}>User accounts</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient colors={["#E8F5E9", "#C8E6C9"]} style={styles.actionGradient}>
                  <MaterialCommunityIcons name="shield-account" size={32} color="#388E3C" />
                </LinearGradient>
                <Text style={styles.actionTitle}>Responders</Text>
                <Text style={styles.actionSubtitle}>Field teams</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Reports */}
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Reports</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={[styles.reportStatus, { backgroundColor: "#FFF3E0" }]}>
                    <Ionicons name="time" size={16} color="#F57C00" />
                    <Text style={[styles.reportStatusText, { color: "#F57C00" }]}>Pending</Text>
                  </View>
                  <Text style={styles.reportTime}>2 hours ago</Text>
                </View>
                <Text style={styles.reportTitle}>Illegal dumping at Creek 5</Text>
                <Text style={styles.reportLocation}>
                  <Ionicons name="location" size={14} color="#666" /> South Cembo, Makati
                </Text>
                <View style={styles.reportFooter}>
                  <View style={styles.reportUser}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>JD</Text>
                    </View>
                    <Text style={styles.userName}>John Doe</Text>
                  </View>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={[styles.reportStatus, { backgroundColor: "#E8F5E9" }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#388E3C" />
                    <Text style={[styles.reportStatusText, { color: "#388E3C" }]}>Resolved</Text>
                  </View>
                  <Text style={styles.reportTime}>5 hours ago</Text>
                </View>
                <Text style={styles.reportTitle}>Trash accumulation near bridge</Text>
                <Text style={styles.reportLocation}>
                  <Ionicons name="location" size={14} color="#666" /> Barangay 1, Makati
                </Text>
                <View style={styles.reportFooter}>
                  <View style={styles.reportUser}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>MS</Text>
                    </View>
                    <Text style={styles.userName}>Maria Santos</Text>
                  </View>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Newsfeed Screen
  const renderNewsfeedScreen = () => null;

  // Render Notifications Screen
  const renderNotificationsScreen = () => null;

  // Render Profile Screen
  const renderProfileScreen = () => (
    <View style={styles.container}>
      <LinearGradient colors={["#2E7D32", "#43A047", "#66BB6A"]} style={styles.headerLarge}>
        <View style={styles.profileHeaderContent}>
          <View style={styles.profileAvatarLarge}>
            <Text style={styles.profileAvatarTextLarge}>
              {responder?.fullName?.charAt(0) || "A"}
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
            <View style={styles.profileInfoRow}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.profileInfoText}>{responder?.email || "admin@example.com"}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.profileInfoText}>{responder?.phone || "N/A"}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.profileInfoText}>{responder?.barangay || "N/A"}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Ionicons name="id-card" size={20} color="#666" />
              <Text style={styles.profileInfoText}>{responder?.employeeId || "N/A"}</Text>
            </View>
          </View>

          {/* Menu Options */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconWrapper}>
                <Ionicons name="person-outline" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
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
              onPress={() => navigation.replace("Home")}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
              <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {activeFooter === "home" && renderHomeScreen()}
      {activeFooter === "newsfeed" && renderNewsfeedScreen()}
      {activeFooter === "notifications" && renderNotificationsScreen()}
      {activeFooter === "profile" && renderProfileScreen()}

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => setActiveFooter("home")}>
          <Ionicons 
            name={activeFooter === "home" ? "home" : "home-outline"} 
            size={26} 
            color={activeFooter === "home" ? "#2E7D32" : "#9E9E9E"} 
          />
          <Text style={[styles.footerText, activeFooter === "home" && styles.footerTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => setActiveFooter("newsfeed")}>
          <Ionicons 
            name={activeFooter === "newsfeed" ? "newspaper" : "newspaper-outline"} 
            size={26} 
            color={activeFooter === "newsfeed" ? "#2E7D32" : "#9E9E9E"} 
          />
          <Text style={[styles.footerText, activeFooter === "newsfeed" && styles.footerTextActive]}>
            Newsfeed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => setActiveFooter("notifications")}>
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

        <TouchableOpacity style={styles.footerButton} onPress={() => setActiveFooter("profile")}>
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
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerLarge: { paddingTop: 50, paddingBottom: 40, paddingHorizontal: 20 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  logoutButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "rgba(255, 255, 255, 0.25)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard: { 
    width: (width - 52) / 2, 
    padding: 20, 
    borderRadius: 20, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 5 
  },
  statIconCircle: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: "rgba(255,255,255,0.3)", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 12 
  },
  statNumber: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginBottom: 8 },
  statBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "rgba(255,255,255,0.9)", 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    alignSelf: "flex-start", 
    gap: 4 
  },
  statBadgeText: { fontSize: 11, fontWeight: "600", color: "#4CAF50" },
  
  // Chart
  chartCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3 
  },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: "bold", color: "#212121" },
  chartSubtitle: { fontSize: 13, color: "#757575", marginTop: 2 },
  chartButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  chartButtonText: { fontSize: 14, color: "#2E7D32", fontWeight: "600" },
  chartContainer: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 180 },
  barWrapper: { alignItems: "center", flex: 1 },
  barContainer: { height: 140, justifyContent: "flex-end", width: "70%" },
  bar: { borderRadius: 8, minHeight: 20 },
  barLabel: { fontSize: 11, color: "#757575", marginTop: 8, fontWeight: "500" },
  barValue: { fontSize: 12, fontWeight: "bold", color: "#212121", marginTop: 2 },
  
  // Quick Actions
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#212121", marginBottom: 16 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  actionCard: { 
    width: (width - 52) / 2, 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    padding: 16, 
    alignItems: "center", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2 
  },
  actionGradient: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 12 
  },
  actionTitle: { fontSize: 14, fontWeight: "600", color: "#212121", textAlign: "center" },
  actionSubtitle: { fontSize: 12, color: "#757575", marginTop: 4, textAlign: "center" },

  // Recent Reports
  recentSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  seeAllText: { fontSize: 14, color: "#2E7D32", fontWeight: "600" },
  reportCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2 
  },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  reportStatus: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12, 
    gap: 6 
  },
  reportStatusText: { fontSize: 12, fontWeight: "600" },
  reportTime: { fontSize: 12, color: "#999" },
  reportTitle: { fontSize: 16, fontWeight: "600", color: "#212121", marginBottom: 8 },
  reportLocation: { fontSize: 13, color: "#666", marginBottom: 12 },
  reportFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reportUser: { flexDirection: "row", alignItems: "center", gap: 8 },
  userAvatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: "#E8F5E9", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  userAvatarText: { fontSize: 12, fontWeight: "bold", color: "#2E7D32" },
  userName: { fontSize: 13, color: "#666", fontWeight: "500" },
  viewButton: { 
    backgroundColor: "#E8F5E9", 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  viewButtonText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
  
  // Newsfeed
  newsCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2 
  },
  newsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  newsIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: "#E8F5E9", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  newsInfo: { flex: 1 },
  newsTitle: { fontSize: 16, fontWeight: "600", color: "#212121" },
  newsTime: { fontSize: 12, color: "#999", marginTop: 2 },
  newsContent: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 12 },
  newsFooter: { flexDirection: "row", gap: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F5F5F5" },
  newsAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  newsActionText: { fontSize: 13, color: "#666", fontWeight: "500" },
  
  // Notifications
  markAllButton: { 
    backgroundColor: "rgba(255,255,255,0.25)", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  markAllText: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
  notifCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2 
  },
  notifUnread: { backgroundColor: "#E8F5E9" },
  notifIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: "#F5F5F5", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: "600", color: "#212121", marginBottom: 4 },
  notifText: { fontSize: 13, color: "#666", marginBottom: 4 },
  notifTime: { fontSize: 12, color: "#999" },
  notifDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: "#2E7D32" 
  },

  // Profile
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
  profileInfoRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: "#F5F5F5", 
    gap: 12 
  },
  profileInfoText: { fontSize: 14, color: "#666", flex: 1 },
  
  // Menu
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
  menuText: { flex: 1, fontSize: 15, color: "#212121", fontWeight: "500" },
  logoutMenuItem: { borderBottomWidth: 0 },
  logoutText: { color: "#D32F2F", fontWeight: "600" },
  
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
