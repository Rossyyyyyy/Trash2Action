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
import { API_URL } from "../../../config";
import socketService from "../../../services/socket";

const { width } = Dimensions.get("window");

export default function AdminDashboard({ navigation, route }) {
  const { token, responder } = route.params || {};

  const [activeFooter, setActiveFooter] = useState("home");
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalResponders: 0,
    pendingAdminRequests: 0,
    totalPosts: 0,
    recentPosts: 0,
    weeklyData: [],
    recentNewsfeedPosts: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      if (!responder?.id) {
        console.log("No responder ID available");
        return;
      }

      const url = `${API_URL}/api/notifications?userId=${responder.id}&userType=responder`;
      console.log("Fetching unread count from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount);
      } else {
        console.error("API error:", data.message);
      }
    } catch (error) {
      console.error("Fetch unread count error:", error);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      if (!token) {
        console.log("No token available");
        return;
      }

      const url = `${API_URL}/api/dashboard/stats`;
      console.log("Fetching dashboard stats from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setDashboardStats(data.stats);
      } else {
        console.error("API error:", data.message);
      }
    } catch (error) {
      console.error("Fetch dashboard stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeFooter === "newsfeed") {
      navigation.navigate("AdminNewsfeed", { token, responder });
      setActiveFooter("home");
    } else if (activeFooter === "notifications") {
      navigation.navigate("AdminNotif", { token, responder });
      setActiveFooter("home");
    } else if (activeFooter === "profile") {
      navigation.navigate("AdminProfile", { token, responder });
      setActiveFooter("home");
    }
  }, [activeFooter]);

  // Setup Socket.IO for real-time notifications
  useEffect(() => {
    if (responder?.id) {
      // Connect to socket
      socketService.connect(responder.id);

      // Listen for new notifications
      socketService.onNewNotification(() => {
        setUnreadCount(prev => prev + 1);
      });

      // Fetch initial data with a small delay
      const timer = setTimeout(() => {
        fetchUnreadCount();
        fetchDashboardStats();
      }, 500);

      return () => {
        clearTimeout(timer);
        socketService.offNewNotification();
      };
    }
  }, [responder?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUnreadCount(), fetchDashboardStats()]);
    setRefreshing(false);
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
    // Transform weekly data from API
    const weeklyData = dashboardStats.weeklyData.map((item, index) => {
      const colors = [
        ["#4CAF50", "#66BB6A"], // Mon
        ["#2196F3", "#42A5F5"], // Tue
        ["#FF9800", "#FFA726"], // Wed
        ["#9C27B0", "#AB47BC"], // Thu
        ["#F44336", "#EF5350"], // Fri
        ["#00BCD4", "#26C6DA"], // Sat
        ["#FF5722", "#FF7043"], // Sun
      ];
      return {
        label: item.day,
        value: item.count,
        colors: colors[index] || ["#78909C", "#90A4AE"]
      };
    });

    const maxValue = Math.max(...weeklyData.map(d => d.value), 1);

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
            {loading ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ color: "#666", fontSize: 16 }}>Loading dashboard...</Text>
              </View>
            ) : (
              <>
                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                  <LinearGradient colors={["#2196F3", "#1976D2"]} style={styles.statCard}>
                    <View style={styles.statIconCircle}>
                      <Ionicons name="newspaper" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statNumber}>{dashboardStats.totalPosts}</Text>
                    <Text style={styles.statLabel}>Total Posts</Text>
                    <View style={styles.statBadge}>
                      <Ionicons name="trending-up" size={12} color="#4CAF50" />
                      <Text style={styles.statBadgeText}>+{dashboardStats.recentPosts} this week</Text>
                    </View>
                  </LinearGradient>

                  <LinearGradient colors={["#FF9800", "#F57C00"]} style={styles.statCard}>
                    <View style={styles.statIconCircle}>
                      <Ionicons name="time" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statNumber}>{dashboardStats.pendingAdminRequests}</Text>
                    <Text style={styles.statLabel}>Pending Requests</Text>
                    <View style={styles.statBadge}>
                      <Ionicons name="alert-circle" size={12} color="#FF5722" />
                      <Text style={styles.statBadgeText}>
                        {dashboardStats.pendingAdminRequests > 0 ? "Needs Review" : "All Clear"}
                      </Text>
                    </View>
                  </LinearGradient>

                  <LinearGradient colors={["#4CAF50", "#388E3C"]} style={styles.statCard}>
                    <View style={styles.statIconCircle}>
                      <MaterialCommunityIcons name="shield-account" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statNumber}>{dashboardStats.totalResponders}</Text>
                    <Text style={styles.statLabel}>Responders</Text>
                    <View style={styles.statBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                      <Text style={styles.statBadgeText}>Active</Text>
                    </View>
                  </LinearGradient>

                  <LinearGradient colors={["#9C27B0", "#7B1FA2"]} style={styles.statCard}>
                    <View style={styles.statIconCircle}>
                      <Ionicons name="people" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statNumber}>{dashboardStats.totalUsers}</Text>
                    <Text style={styles.statLabel}>Active Users</Text>
                    <View style={styles.statBadge}>
                      <Ionicons name="trending-up" size={12} color="#4CAF50" />
                      <Text style={styles.statBadgeText}>Verified</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Weekly Reports Chart */}
                <View style={styles.chartCard}>
                  <View style={styles.chartHeader}>
                    <View>
                      <Text style={styles.chartTitle}>Weekly Activity</Text>
                      <Text style={styles.chartSubtitle}>Last 7 days posts</Text>
                    </View>
                    <TouchableOpacity style={styles.chartButton}>
                      <Text style={styles.chartButtonText}>View All</Text>
                      <Ionicons name="chevron-forward" size={16} color="#2E7D32" />
                    </TouchableOpacity>
                  </View>
                  <SimpleBarChart data={weeklyData} maxValue={maxValue} />
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
                    <Text style={styles.actionSubtitle}>
                      {dashboardStats.pendingAdminRequests} pending
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => navigation.navigate("AdminNewsfeed", { token, responder })}
                  >
                    <LinearGradient colors={["#E3F2FD", "#BBDEFB"]} style={styles.actionGradient}>
                      <Ionicons name="newspaper" size={32} color="#1976D2" />
                    </LinearGradient>
                    <Text style={styles.actionTitle}>Newsfeed</Text>
                    <Text style={styles.actionSubtitle}>{dashboardStats.totalPosts} posts</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => navigation.navigate("AdminUsers", { token, responder })}
                  >
                    <LinearGradient colors={["#F3E5F5", "#E1BEE7"]} style={styles.actionGradient}>
                      <Ionicons name="people" size={32} color="#7B1FA2" />
                    </LinearGradient>
                    <Text style={styles.actionTitle}>Manage Users</Text>
                    <Text style={styles.actionSubtitle}>{dashboardStats.totalUsers} users</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => navigation.navigate("AdminResponders", { token, responder })}
                  >
                    <LinearGradient colors={["#E8F5E9", "#C8E6C9"]} style={styles.actionGradient}>
                      <MaterialCommunityIcons name="shield-account" size={32} color="#388E3C" />
                    </LinearGradient>
                    <Text style={styles.actionTitle}>Responders</Text>
                    <Text style={styles.actionSubtitle}>{dashboardStats.totalResponders} active</Text>
                  </TouchableOpacity>
                </View>

                {/* Recent Posts */}
                {dashboardStats.recentNewsfeedPosts.length > 0 && (
                  <View style={styles.recentSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Recent Posts</Text>
                      <TouchableOpacity onPress={() => navigation.navigate("AdminNewsfeed", { token, responder })}>
                        <Text style={styles.seeAllText}>See All</Text>
                      </TouchableOpacity>
                    </View>

                    {dashboardStats.recentNewsfeedPosts.slice(0, 3).map((post, index) => {
                      const timeAgo = getTimeAgo(new Date(post.createdAt));
                      const authorName = post.authorId?.fullName || "Unknown User";
                      const initials = authorName.split(" ").map(n => n[0]).join("").toUpperCase();
                      
                      return (
                        <View key={post._id || index} style={styles.reportCard}>
                          <View style={styles.reportHeader}>
                            <View style={[styles.reportStatus, { backgroundColor: "#E3F2FD" }]}>
                              <Ionicons name="newspaper" size={16} color="#1976D2" />
                              <Text style={[styles.reportStatusText, { color: "#1976D2" }]}>Post</Text>
                            </View>
                            <Text style={styles.reportTime}>{timeAgo}</Text>
                          </View>
                          <Text style={styles.reportTitle} numberOfLines={2}>
                            {post.content || "No content"}
                          </Text>
                          <View style={styles.reportFooter}>
                            <View style={styles.reportUser}>
                              <View style={styles.userAvatar}>
                                <Text style={styles.userAvatarText}>{initials}</Text>
                              </View>
                              <Text style={styles.userName}>{authorName}</Text>
                            </View>
                            <View style={{ flexDirection: "row", gap: 12 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Ionicons name="heart" size={16} color="#F44336" />
                                <Text style={{ fontSize: 13, color: "#666" }}>
                                  {post.likedBy?.length || 0}
                                </Text>
                              </View>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Ionicons name="chatbubble" size={16} color="#2196F3" />
                                <Text style={{ fontSize: 13, color: "#666" }}>
                                  {post.comments?.length || 0}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return "Just now";
  };

  // Render Newsfeed Screen
  const renderNewsfeedScreen = () => null;

  // Render Notifications Screen
  const renderNotificationsScreen = () => null;

  // Render Profile Screen - Navigate to dedicated AdminProfile component
  const renderProfileScreen = () => null;

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
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
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
