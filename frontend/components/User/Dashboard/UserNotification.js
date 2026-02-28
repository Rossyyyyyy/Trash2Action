//Trash2Action/components/User/Dashboard/UserNotification.js
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../../config";
import socketService from "../../../services/socket";

export default function UserNotification({ token, user, onClear, onUpdateUnread }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      if (!user?.id) {
        console.log("No user ID available");
        return;
      }

      const url = `${API_URL}/api/notifications?userId=${user.id}&userType=user`;
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
        // Update unread count in parent component
        if (onUpdateUnread) {
          onUpdateUnread(data.unreadCount || 0);
        }
      } else {
        console.error("API error:", data.message);
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Setup Socket.IO and fetch initial data
  useEffect(() => {
    if (user?.id) {
      // Connect to socket
      socketService.connect(user.id);

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
        
        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          // Update unread count
          const unreadCount = updated.filter(n => !n.read).length;
          if (onUpdateUnread) {
            onUpdateUnread(unreadCount);
          }
          return updated;
        });
      });

      // Fetch initial notifications
      const timer = setTimeout(() => {
        fetchNotifications();
      }, 500);

      return () => {
        clearTimeout(timer);
        socketService.offNewNotification();
      };
    }
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        // Update unread count
        const unreadCount = updated.filter(n => !n.read).length;
        if (onUpdateUnread) {
          onUpdateUnread(unreadCount);
        }
        return updated;
      });
    } catch (error) {
      console.error("Mark as read error:", error);
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
          userId: user.id,
          userType: "user",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        if (onClear) onClear();
        if (onUpdateUnread) onUpdateUnread(0);
      }
    } catch (error) {
      console.error("Mark all as read error:", error);
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
        setNotifications(prev => {
          const updated = prev.filter(n => n.id !== notificationId);
          // Update unread count
          const unreadCount = updated.filter(n => !n.read).length;
          if (onUpdateUnread) {
            onUpdateUnread(unreadCount);
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  // Clear all notifications
  const clearAll = () => {
    Alert.alert("Clear All", "Are you sure you want to clear all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          // Delete all notifications
          for (const notif of notifications) {
            await deleteNotification(notif.id);
          }
          if (onClear) onClear();
        },
      },
    ]);
  };

  // Refresh notifications
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Get icon and color based on notification type
  const getNotificationStyle = (type) => {
    const styles = {
      report: { icon: "alert-circle", iconColor: "#FF9800", bgColor: "#FFF3E0" },
      post: { icon: "newspaper", iconColor: "#9C27B0", bgColor: "#F3E5F5" },
      comment: { icon: "chatbubble", iconColor: "#43A047", bgColor: "#E8F5E9" },
      like: { icon: "heart", iconColor: "#F44336", bgColor: "#FFEBEE" },
      points: { icon: "trophy", iconColor: "#FB8C00", bgColor: "#FFF3E0" },
      verified: { icon: "checkmark-circle", iconColor: "#43A047", bgColor: "#E8F5E9" },
      system: { icon: "information-circle", iconColor: "#607D8B", bgColor: "#ECEFF1" },
    };
    return styles[type] || styles.system;
  };

  const displayed =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread notification{unreadCount > 1 ? "s" : ""}</Text>
          )}
        </View>
        <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={22} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      {/* Filter + Mark all read row */}
      <View style={styles.actionBar}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === "all" && styles.filterPillActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === "unread" && styles.filterPillActive]}
            onPress={() => setFilter("unread")}
          >
            <Text style={[styles.filterText, filter === "unread" && styles.filterTextActive]}>
              Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification list */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Loading notifications...</Text>
          </View>
        ) : displayed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={filter === "unread" ? "notifications-outline" : "notifications-off-outline"}
              size={52}
              color="#A5D6A7"
            />
            <Text style={styles.emptyTitle}>
              {filter === "unread" ? "All caught up!" : "No notifications"}
            </Text>
            <Text style={styles.emptySub}>
              {filter === "unread"
                ? "You have no unread notifications."
                : "You'll see notifications here when they arrive."}
            </Text>
          </View>
        ) : (
          displayed.map((n) => {
            const style = getNotificationStyle(n.type);
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.notifCard, n.read && styles.notifCardRead]}
                onPress={() => markAsRead(n.id)}
                onLongPress={() => {
                  Alert.alert(
                    "Delete Notification",
                    "Are you sure you want to delete this notification?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Delete", 
                        style: "destructive",
                        onPress: () => deleteNotification(n.id)
                      },
                    ]
                  );
                }}
                activeOpacity={0.88}
              >
                {/* Icon */}
                <View style={[styles.notifIcon, { backgroundColor: style.bgColor }]}>
                  <Ionicons name={style.icon} size={22} color={style.iconColor} />
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                  <View style={styles.notifTitleRow}>
                    <Text style={[styles.notifTitle, n.read && styles.notifTitleRead]}>
                      {n.title}
                    </Text>
                    {!n.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[styles.notifMessage, n.read && styles.notifMessageRead]}>
                    {n.message}
                  </Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1B5E20" },
  headerSub: { fontSize: 12, color: "#43A047", marginTop: 2 },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Action bar (filters + mark all)
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterRow: { flexDirection: "row", gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  filterPillActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  filterText: { fontSize: 13, color: "#424242", fontWeight: "500" },
  filterTextActive: { color: "#FFFFFF", fontWeight: "600" },
  markAllText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },

  // Scroll
  scrollView: { flex: 1, paddingHorizontal: 20 },

  // Empty state
  emptyContainer: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#424242", marginTop: 14 },
  emptySub: { fontSize: 13, color: "#9E9E9E", marginTop: 6, textAlign: "center", paddingHorizontal: 20 },

  // Notification card
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#2E7D32",
  },
  notifCardRead: {
    borderLeftColor: "transparent",
    backgroundColor: "#FAFAFA",
    shadowOpacity: 0.03,
  },

  // Icon
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  // Content
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { fontSize: 14, fontWeight: "bold", color: "#212121", flex: 1 },
  notifTitleRead: { color: "#757575", fontWeight: "500" },
  notifMessage: { fontSize: 13, color: "#616161", marginTop: 3, lineHeight: 18 },
  notifMessageRead: { color: "#9E9E9E" },
  notifTime: { fontSize: 11, color: "#9E9E9E", marginTop: 5 },

  // Unread dot
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2E7D32",
    flexShrink: 0,
  },
});