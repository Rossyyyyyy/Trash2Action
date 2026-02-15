//Trash2Action/components/User/Dashboard/UserNotification.tsx
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

interface UserNotificationProps {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    gender: string;
    profileImage: string | null;
  };
  onClear: () => void; // callback to reset badge count in parent
}

// ─── Sample notification data ────────────────────────────────────────────────
const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    icon: "trophy",
    iconColor: "#FB8C00",
    bgColor: "#FFF3E0",
    title: "Points Reward!",
    message: "You earned 50 points for submitting a waste report in your area.",
    time: "10 min ago",
    read: false,
  },
  {
    id: "n2",
    icon: "checkmark-circle",
    iconColor: "#43A047",
    bgColor: "#E8F5E9",
    title: "Report Verified",
    message: "Your waste report #1042 has been verified by local authorities.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "n3",
    icon: "people",
    iconColor: "#2196F3",
    bgColor: "#E3F2FD",
    title: "New Community Event",
    message: "EcoClub Philippines has announced a clean-up drive this Saturday at BGC Park.",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "n4",
    icon: "star",
    iconColor: "#8E24AA",
    bgColor: "#F3E5F5",
    title: "Rank Update",
    message: "Congratulations! You moved up to Rank #5 in your community this month.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "n5",
    icon: "information-circle",
    iconColor: "#607D8B",
    bgColor: "#ECEFF1",
    title: "App Update Available",
    message: "A new version of Trash2Action is available. Update now for the latest features.",
    time: "2 days ago",
    read: true,
  },
  {
    id: "n6",
    icon: "alert-circle",
    iconColor: "#D32F2F",
    bgColor: "#FFEBEE",
    title: "Incomplete Report",
    message: "Your report #1038 is missing a photo. Please update it to earn full points.",
    time: "3 days ago",
    read: true,
  },
];

export default function UserNotification({ token, user, onClear }: UserNotificationProps) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Mark single notification as read ────────────────────────────────────
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // ─── Mark all as read ────────────────────────────────────────────────────
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onClear();
  };

  // ─── Clear all ───────────────────────────────────────────────────────────
  const clearAll = () => {
    Alert.alert("Clear All", "Are you sure you want to clear all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setNotifications([]);
          onClear();
        },
      },
    ]);
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {displayed.length === 0 ? (
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
          displayed.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, n.read && styles.notifCardRead]}
              onPress={() => markAsRead(n.id)}
              activeOpacity={0.88}
            >
              {/* Icon */}
              <View style={[styles.notifIcon, { backgroundColor: n.bgColor }]}>
                <Ionicons name={n.icon as any} size={22} color={n.iconColor} />
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
          ))
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