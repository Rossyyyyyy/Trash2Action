import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Import actual components ────────────────────────────────────────────────
import UserNF from "./UserNF";
import UserNotification from "./UserNotification";
import UserReports from "./UserReports";
import UserProfile from "./UserProfile";
import UserMessage from "./UserMessage";

// ─── Change this to your local IP ────────────────────────────────────────────
const BASE_URL = "http://10.249.213.103:5000";

export default function UserDashboard({ route, navigation }) {
  // ✅ Get token and user from route params OR AsyncStorage
  const [token, setToken] = useState(route.params?.token || null);
  const [user, setUser] = useState(route.params?.user || null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notificationCount, setNotificationCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(2);

  // ─── Load user data from AsyncStorage if not in route params ────────────
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (!token || !user) {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUserData = await AsyncStorage.getItem('userData');
        
        if (storedToken && storedUserData) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserData));
          console.log("✅ Loaded user data from AsyncStorage");
        } else {
          // No stored data, redirect to login
          console.log("❌ No stored auth data, redirecting to login");
          navigation.replace('Home');
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      navigation.replace('Home');
    } finally {
      setIsLoading(false);
    }
  };

  console.log("🎯 UserDashboard loaded!");
  console.log("📊 Token:", token);
  console.log("👤 User:", user);

  // ─── LOGOUT ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear AsyncStorage
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            console.log("👋 User logged out, cleared AsyncStorage");
            
            // Navigate back to Home/Login screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } catch (error) {
            console.error("Error during logout:", error);
            // Still navigate even if clearing storage fails
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        },
      },
    ]);
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EAF7F1' }}>
        <Ionicons name="leaf" size={48} color="#2E7D32" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#2E7D32' }}>Loading...</Text>
      </View>
    );
  }

  // ─── RENDER ACTIVE TAB CONTENT ───────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case "newsfeed":
        return <UserNF token={token} user={user} />;
      case "notification":
        return (
          <UserNotification
            token={token}
            user={user}
            onClear={() => setNotificationCount(0)}
          />
        );
      case "reports":
        return <UserReports token={token} user={user} />;
      case "profile":
        return <UserProfile token={token} user={user} onLogout={handleLogout} />;
      case "dashboard":
      default:
        return <DashboardHome token={token} user={user} onLogout={handleLogout} />;
    }
  };

  // ─── FOOTER TAB ITEMS ────────────────────────────────────────────────────
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "apps-outline", activeIcon: "apps" },
    { id: "newsfeed", label: "Newsfeed", icon: "newspaper-outline", activeIcon: "newspaper" },
    { id: "notification", label: "Alerts", icon: "notifications-outline", activeIcon: "notifications" },
    { id: "reports", label: "Reports", icon: "document-text-outline", activeIcon: "document-text" },
    { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
  ];

  return (
    <View style={styles.root}>
      {/* ── Main scrollable content area ── */}
      <View style={styles.contentWrapper}>{renderContent()}</View>

      {/* ── Floating Message Bubble Button ── */}
      {!showMessages && (
        <TouchableOpacity
          style={styles.messageBubble}
          onPress={() => setShowMessages(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#2E7D32", "#43A047"]}
            style={styles.messageBubbleGradient}
          >
            <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
            {unreadMessages > 0 && (
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── Message Modal/Screen ── */}
      {showMessages && (
        <UserMessage
          token={token}
          user={user}
          onClose={() => setShowMessages(false)}
          onUpdateUnread={(count) => setUnreadMessages(count)}
        />
      )}

      {/* ── Bottom Footer Navigation ── */}
      <View style={styles.footer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.footerTab, isActive && styles.footerTabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.footerIconWrapper}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? "#2E7D32" : "#9E9E9E"}
                />
                {/* Notification badge */}
                {tab.id === "notification" && notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.footerLabel, isActive && styles.footerLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── DASHBOARD HOME (inline — the default tab content) ──────────────────────
function DashboardHome({ token, user, onLogout }) {
  const [chartPeriod, setChartPeriod] = useState("week");
  
  // Sample chart data
  const chartData = {
    week: [3, 5, 2, 8, 4, 6, 7],
    month: [12, 18, 15, 22, 19, 25, 28, 24, 30, 27, 32, 35],
  };

  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.screenContainer}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Top header bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.greetingSmall}>Welcome back,</Text>
              <Text style={styles.greetingName}>{user?.fullName || "User"}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
          </TouchableOpacity>
        </View>

        {/* Stats cards row */}
        <View style={styles.statsRow}>
          <StatCard icon="leaf" label="Reports" value="12" color="#43A047" />
          <StatCard icon="trophy" label="Points" value="840" color="#FB8C00" />
          <StatCard icon="star" label="Rank" value="#5" color="#8E24AA" />
        </View>

        {/* Activity Chart */}
        <View style={styles.sectionCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Activity Overview</Text>
            <View style={styles.chartToggle}>
              <TouchableOpacity
                style={[styles.chartBtn, chartPeriod === "week" && styles.chartBtnActive]}
                onPress={() => setChartPeriod("week")}
              >
                <Text style={[styles.chartBtnText, chartPeriod === "week" && styles.chartBtnTextActive]}>
                  Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chartBtn, chartPeriod === "month" && styles.chartBtnActive]}
                onPress={() => setChartPeriod("month")}
              >
                <Text style={[styles.chartBtnText, chartPeriod === "month" && styles.chartBtnTextActive]}>
                  Month
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <SimpleBarChart data={chartData[chartPeriod]} />
        </View>

        {/* Recent activity card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <ActivityItem
            icon="checkmark-circle"
            iconColor="#43A047"
            text="Submitted a waste report"
            time="2 hours ago"
          />
          <ActivityItem
            icon="notifications"
            iconColor="#FB8C00"
            text="Received 50 points reward"
            time="1 day ago"
          />
          <ActivityItem
            icon="people"
            iconColor="#2196F3"
            text="Joined Community Group #3"
            time="3 days ago"
          />
          <ActivityItem
            icon="trophy"
            iconColor="#8E24AA"
            text="Reached Silver level"
            time="5 days ago"
          />
        </View>

        {/* Quick actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <QuickAction icon="document-text" label="New Report" color="#2E7D32" />
            <QuickAction icon="map" label="Find Bins" color="#2196F3" />
            <QuickAction icon="share" label="Invite" color="#FF7043" />
            <QuickAction icon="help-circle" label="Help" color="#9C27B0" />
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementRow}>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementEmoji}>🏆</Text>
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>First Report</Text>
              <Text style={styles.achievementDesc}>Submitted your first waste report</Text>
            </View>
          </View>
          <View style={styles.achievementRow}>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementEmoji}>🔥</Text>
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>7-Day Streak</Text>
              <Text style={styles.achievementDesc}>Reported waste for 7 consecutive days</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─── SMALL REUSABLE COMPONENTS ───────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIconBg, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActivityItem({ icon, iconColor, text, time }) {
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, { backgroundColor: iconColor + "18" }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.activityText}>
        <Text style={styles.activityMain}>{text}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, color }) {
  return (
    <TouchableOpacity style={styles.quickAction} activeOpacity={0.75}>
      <View style={[styles.quickIconBg, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SimpleBarChart({ data }) {
  const maxValue = Math.max(...data);
  return (
    <View style={styles.chartContainer}>
      {data.map((value, index) => {
        const height = (value / maxValue) * 100;
        return (
          <View key={index} style={styles.barWrapper}>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { height: `${height}%` }]} />
            </View>
            <Text style={styles.barLabel}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F5" },
  contentWrapper: { flex: 1 },
  screenContainer: { flex: 1 },
  scrollView: { flex: 1 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  greetingSmall: { fontSize: 12, color: "#1B5E20", fontWeight: "500" },
  greetingName: { fontSize: 17, color: "#1B5E20", fontWeight: "bold" },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#212121" },
  statLabel: { fontSize: 11, color: "#757575", marginTop: 2 },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#2E7D32", marginBottom: 14 },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  activityText: { flex: 1 },
  activityMain: { fontSize: 14, color: "#424242", fontWeight: "500" },
  activityTime: { fontSize: 12, color: "#9E9E9E", marginTop: 2 },

  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: { alignItems: "center", flex: 1 },
  quickIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickLabel: { fontSize: 11, color: "#616161", fontWeight: "500", textAlign: "center" },

  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  chartToggle: { flexDirection: "row", gap: 4, backgroundColor: "#F5F5F5", borderRadius: 8, padding: 2 },
  chartBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  chartBtnActive: { backgroundColor: "#2E7D32" },
  chartBtnText: { fontSize: 12, color: "#757575", fontWeight: "500" },
  chartBtnTextActive: { color: "#FFFFFF", fontWeight: "600" },
  chartContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120, gap: 4 },
  barWrapper: { flex: 1, alignItems: "center" },
  barContainer: { flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar: { width: "70%", backgroundColor: "#43A047", borderRadius: 4, minHeight: 8 },
  barLabel: { fontSize: 10, color: "#757575", marginTop: 4 },

  achievementRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  achievementBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF8E1", justifyContent: "center", alignItems: "center" },
  achievementEmoji: { fontSize: 24 },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: 14, fontWeight: "600", color: "#212121" },
  achievementDesc: { fontSize: 12, color: "#757575", marginTop: 2 },

  footer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  footerTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    position: "relative",
  },
  footerTabActive: {},
  footerIconWrapper: { position: "relative", marginBottom: 3 },
  footerLabel: { fontSize: 10, color: "#9E9E9E", fontWeight: "500" },
  footerLabelActive: { color: "#2E7D32", fontWeight: "700" },
  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2E7D32",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#D32F2F",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { fontSize: 9, color: "#FFFFFF", fontWeight: "bold" },

  // Message bubble styles
  messageBubble: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  messageBubbleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  messageBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});