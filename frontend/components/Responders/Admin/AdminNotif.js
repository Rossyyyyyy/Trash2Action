import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../../config";
import socketService from "../../../services/socket";

export default function AdminNotif({ navigation, route }) {
  const { token, responder } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      if (!responder?.id) {
        console.log("No responder ID available");
        return;
      }

      const url = `${API_URL}/api/notifications?userId=${responder.id}&userType=responder`;
      console.log("Fetching notifications from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response:", await response.text());
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        console.error("API error:", data.message);
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: responder.id,
          userType: "responder",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const deletedNotif = notifications.find(n => n.id === notificationId);
        setNotifications(notifications.filter(n => n.id !== notificationId));
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "admin_request") {
      navigation.navigate("AdminRequest", { token, responder });
    } else if (notification.type === "post") {
      navigation.navigate("AdminNewsfeed", { token, responder });
    } else if (notification.type === "report") {
      // Navigate to reports page when implemented
      Alert.alert("Report", notification.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Setup Socket.IO and fetch initial data
  useEffect(() => {
    if (responder?.id) {
      // Connect to socket
      socketService.connect(responder.id);

      // Listen for new notifications
      socketService.onNewNotification((notification) => {
        console.log("📬 New notification received:", notification);
        
        // Add new notification to the list
        const newNotif = {
          id: Date.now().toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: false,
          time: "Just now",
          timestamp: notification.timestamp,
        };
        
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show alert for important notifications
        if (notification.type === "admin_request") {
          Alert.alert(notification.title, notification.message);
        }
      });

      // Fetch initial notifications with a small delay
      const timer = setTimeout(() => {
        fetchNotifications();
      }, 500);

      return () => {
        clearTimeout(timer);
        socketService.offNewNotification();
      };
    }
  }, [responder?.id]);

  // Get icon and color based on notification type
  const getNotificationStyle = (type) => {
    const styles = {
      admin_request: { icon: "person-add", color: "#2196F3" },
      post: { icon: "newspaper", color: "#9C27B0" },
      report: { icon: "alert-circle", color: "#FF9800" },
      comment: { icon: "chatbubble", color: "#43A047" },
      like: { icon: "heart", color: "#F44336" },
      system: { icon: "information-circle", color: "#2E7D32" },
    };
    return styles[type] || styles.system;
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <LinearGradient colors={["#2E7D32", "#43A047", "#66BB6A"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.scrollContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#BDBDBD" />
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubtext}>
                  You'll be notified when users submit reports or create posts
                </Text>
              </View>
            ) : (
              notifications.map((notif) => {
                const style = getNotificationStyle(notif.type);
                return (
                  <TouchableOpacity 
                    key={notif.id}
                    style={[styles.notifCard, !notif.read && styles.notifUnread]}
                    onPress={() => handleNotificationClick(notif)}
                    onLongPress={() => {
                      Alert.alert(
                        "Delete Notification",
                        "Are you sure you want to delete this notification?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { 
                            text: "Delete", 
                            style: "destructive",
                            onPress: () => deleteNotification(notif.id)
                          },
                        ]
                      );
                    }}
                  >
                    <View style={styles.notifIcon}>
                      <Ionicons name={style.icon} size={24} color={style.color} />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifText}>{notif.message}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                    {!notif.read && <View style={styles.notifDot} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => navigation.navigate("AdminDashboard", { token, responder })}
        >
          <Ionicons name="home-outline" size={26} color="#9E9E9E" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => navigation.navigate("AdminNewsfeed", { token, responder })}
        >
          <Ionicons name="newspaper-outline" size={26} color="#9E9E9E" />
          <Text style={styles.footerText}>Newsfeed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton}>
          <View>
            <Ionicons name="notifications" size={26} color="#2E7D32" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.footerText, styles.footerTextActive]}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => navigation.navigate("AdminDashboard", { token, responder })}
        >
          <Ionicons name="person-outline" size={26} color="#9E9E9E" />
          <Text style={styles.footerText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F5F5F5" },
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  markAllButton: { 
    backgroundColor: "rgba(255,255,255,0.25)", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  markAllText: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
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
  
  // Loading & Empty states
  loadingContainer: { 
    alignItems: "center", 
    justifyContent: "center", 
    paddingTop: 60 
  },
  loadingText: { 
    fontSize: 14, 
    color: "#757575", 
    marginTop: 12 
  },
  emptyContainer: { 
    alignItems: "center", 
    justifyContent: "center", 
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: { 
    fontSize: 16, 
    color: "#757575", 
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9E9E9E",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
