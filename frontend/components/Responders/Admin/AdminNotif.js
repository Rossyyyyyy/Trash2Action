import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function AdminNotif({ navigation, route }) {
  const { token, responder } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <LinearGradient colors={["#2E7D32", "#43A047", "#66BB6A"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>Stay updated with alerts</Text>
            </View>
            <TouchableOpacity style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.scrollContent}>
            <TouchableOpacity 
              style={[styles.notifCard, styles.notifUnread]}
              onPress={() => navigation.navigate("AdminRequest", { token, responder })}
            >
              <View style={styles.notifIcon}>
                <Ionicons name="person-add" size={24} color="#2196F3" />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>New Admin Request</Text>
                <Text style={styles.notifText}>John Smith requested admin access</Text>
                <Text style={styles.notifTime}>5 minutes ago</Text>
              </View>
              <View style={styles.notifDot} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.notifCard, styles.notifUnread]}>
              <View style={styles.notifIcon}>
                <Ionicons name="alert-circle" size={24} color="#FF9800" />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>Urgent Report</Text>
                <Text style={styles.notifText}>New report requires immediate attention</Text>
                <Text style={styles.notifTime}>1 hour ago</Text>
              </View>
              <View style={styles.notifDot} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.notifCard}>
              <View style={styles.notifIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>Report Resolved</Text>
                <Text style={styles.notifText}>Creek cleanup completed successfully</Text>
                <Text style={styles.notifTime}>3 hours ago</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.notifCard}>
              <View style={styles.notifIcon}>
                <Ionicons name="people" size={24} color="#9C27B0" />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>New User Registered</Text>
                <Text style={styles.notifText}>Maria Santos joined the platform</Text>
                <Text style={styles.notifTime}>Yesterday</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.notifCard}>
              <View style={styles.notifIcon}>
                <Ionicons name="trash" size={24} color="#F44336" />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>Report Submitted</Text>
                <Text style={styles.notifText}>Illegal dumping reported at Creek 5</Text>
                <Text style={styles.notifTime}>2 days ago</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.notifCard}>
              <View style={styles.notifIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#2E7D32" />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>Responder Assigned</Text>
                <Text style={styles.notifText}>Field team dispatched to location</Text>
                <Text style={styles.notifTime}>3 days ago</Text>
              </View>
            </TouchableOpacity>
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
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
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
});
