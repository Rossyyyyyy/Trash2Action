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

export default function AdminNewsfeed({ navigation, route }) {
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
              <Text style={styles.headerTitle}>Newsfeed</Text>
              <Text style={styles.headerSubtitle}>Latest updates and announcements</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.scrollContent}>
            <View style={styles.newsCard}>
              <View style={styles.newsHeader}>
                <View style={styles.newsIcon}>
                  <Ionicons name="megaphone" size={24} color="#2E7D32" />
                </View>
                <View style={styles.newsInfo}>
                  <Text style={styles.newsTitle}>System Update</Text>
                  <Text style={styles.newsTime}>Today at 10:30 AM</Text>
                </View>
              </View>
              <Text style={styles.newsContent}>
                New features added to the admin dashboard. Check out the improved analytics and reporting tools.
              </Text>
              <View style={styles.newsFooter}>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="heart-outline" size={20} color="#666" />
                  <Text style={styles.newsActionText}>24</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="chatbubble-outline" size={20} color="#666" />
                  <Text style={styles.newsActionText}>8</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="share-social-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.newsCard}>
              <View style={styles.newsHeader}>
                <View style={styles.newsIcon}>
                  <Ionicons name="trophy" size={24} color="#F57C00" />
                </View>
                <View style={styles.newsInfo}>
                  <Text style={styles.newsTitle}>Achievement Unlocked</Text>
                  <Text style={styles.newsTime}>Yesterday at 3:45 PM</Text>
                </View>
              </View>
              <Text style={styles.newsContent}>
                Congratulations! Your barangay has resolved 100+ reports this month. Keep up the great work!
              </Text>
              <View style={styles.newsFooter}>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="heart-outline" size={20} color="#666" />
                  <Text style={styles.newsActionText}>156</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="chatbubble-outline" size={20} color="#666" />
                  <Text style={styles.newsActionText}>32</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="share-social-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.newsCard}>
              <View style={styles.newsHeader}>
                <View style={styles.newsIcon}>
                  <Ionicons name="alert-circle" size={24} color="#FF5722" />
                </View>
                <View style={styles.newsInfo}>
                  <Text style={styles.newsTitle}>Important Notice</Text>
                  <Text style={styles.newsTime}>2 days ago</Text>
                </View>
              </View>
              <Text style={styles.newsContent}>
                Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM. The system will be temporarily unavailable.
              </Text>
              <View style={styles.newsFooter}>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="heart-outline" size={20} color="#666" />
                  <Text style={styles.newsActionText}>89</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="chatbubble-outline" size={20} color="#666" />
                  <Text style={styles.newsActionText}>15</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.newsAction}>
                  <Ionicons name="share-social-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
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

        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="newspaper" size={26} color="#2E7D32" />
          <Text style={[styles.footerText, styles.footerTextActive]}>Newsfeed</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => navigation.navigate("AdminNotif", { token, responder })}
        >
          <View>
            <Ionicons name="notifications-outline" size={26} color="#9E9E9E" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </View>
          <Text style={styles.footerText}>Notifications</Text>
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
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
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
