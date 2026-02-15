import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// ─── Sample newsfeed data (replace with API later) ───────────────────────────
const SAMPLE_POSTS = [
  {
    id: "1",
    avatar: "🌿",
    authorName: "Trash2Action Team",
    authorRole: "Official",
    time: "10 min ago",
    category: "Announcement",
    categoryColor: "#2E7D32",
    title: "New Recycling Station Open in Taguig!",
    body: "A brand new recycling station has opened near BGC. Residents can now drop off plastics, cardboard, and electronics every day from 7 AM to 6 PM. Earn points for every kilogram you bring!",
    likes: 142,
    comments: 38,
    liked: false,
  },
  {
    id: "2",
    avatar: "🏆",
    authorName: "Maria Santos",
    authorRole: "Top Contributor",
    time: "1 hour ago",
    category: "Achievement",
    categoryColor: "#FB8C00",
    title: "Reached 1,000 Points Milestone!",
    body: "After 3 months of consistent reporting and recycling, I've hit the 1,000 point mark. The key is reporting waste consistently — even small amounts add up. Keep it up everyone!",
    likes: 87,
    comments: 21,
    liked: false,
  },
  {
    id: "3",
    avatar: "🚛",
    authorName: "Taguig City Hall",
    authorRole: "Government",
    time: "3 hours ago",
    category: "Notice",
    categoryColor: "#2196F3",
    title: "Schedule Change: Garbage Collection",
    body: "Please note that garbage collection for Barangay 50–55 will shift to Tuesday and Friday starting next week. Kindly separate recyclables from general waste.",
    likes: 203,
    comments: 56,
    liked: false,
  },
  {
    id: "4",
    avatar: "🌍",
    authorName: "EcoClub Philippines",
    authorRole: "Partner Org",
    time: "Yesterday",
    category: "Event",
    categoryColor: "#9C27B0",
    title: "Weekend Clean-Up Drive — Join Us!",
    body: "This Saturday, 8 AM at Bonifacio Global City Park. Bring gloves and bags. Participants will earn 100 bonus points and receive a free eco-friendly tote bag. See you there!",
    likes: 64,
    comments: 14,
    liked: false,
  },
  {
    id: "5",
    avatar: "💡",
    authorName: "Juan dela Cruz",
    authorRole: "Community Member",
    time: "2 days ago",
    category: "Tip",
    categoryColor: "#43A047",
    title: "Easy Way to Earn Points at Home",
    body: "Did you know you can earn points just by properly sorting your trash at home? Label 3 bins: Recyclables, Organics, and General Waste. Then log your sorting daily on the app!",
    likes: 45,
    comments: 9,
    liked: false,
  },
];

export default function UserNF({ token, user }) {
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Announcement", "Event", "Tip", "Notice", "Achievement"];

  // ─── Toggle like ─────────────────────────────────────────────────────────
  const toggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  // ─── Simulated refresh ───────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  }, []);

  const filteredPosts =
    activeFilter === "All" ? posts : posts.filter((p) => p.category === activeFilter);

  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Newsfeed</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <Ionicons
            name={isRefreshing ? "sync" : "sync-outline"}
            size={22}
            color="#2E7D32"
            style={isRefreshing ? styles.spinIcon : {}}
          />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Feed */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isRefreshing && (
          <View style={styles.refreshIndicator}>
            <ActivityIndicator size="small" color="#2E7D32" />
          </View>
        )}

        {filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color="#A5D6A7" />
            <Text style={styles.emptyText}>No posts in this category yet.</Text>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {/* Author row */}
              <View style={styles.postAuthorRow}>
                <View style={styles.postAvatar}>
                  <Text style={styles.postAvatarText}>{post.avatar}</Text>
                </View>
                <View style={styles.postAuthorInfo}>
                  <View style={styles.postNameRow}>
                    <Text style={styles.postAuthorName}>{post.authorName}</Text>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: post.categoryColor + "18", borderColor: post.categoryColor },
                      ]}
                    >
                      <Text style={[styles.categoryText, { color: post.categoryColor }]}>
                        {post.category}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>
              </View>

              {/* Title & body */}
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postBody}>{post.body}</Text>

              {/* Actions */}
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => toggleLike(post.id)}
                >
                  <Ionicons
                    name={post.liked ? "heart" : "heart-outline"}
                    size={18}
                    color={post.liked ? "#D32F2F" : "#9E9E9E"}
                  />
                  <Text style={[styles.actionText, post.liked && styles.actionTextLiked]}>
                    {post.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={18} color="#9E9E9E" />
                  <Text style={styles.actionText}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="share-outline" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              </View>
            </View>
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1B5E20" },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  spinIcon: { transform: [{ rotate: "45deg" }] },

  // Filter pills
  filterScroll: { marginBottom: 8 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
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

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  refreshIndicator: { alignItems: "center", paddingVertical: 10 },

  // Empty state
  emptyContainer: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, color: "#757575", marginTop: 12 },

  // Post card
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },

  // Author row
  postAuthorRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  postAvatarText: { fontSize: 22 },
  postAuthorInfo: { flex: 1 },
  postNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  postAuthorName: { fontSize: 14, fontWeight: "bold", color: "#212121" },
  postTime: { fontSize: 11, color: "#9E9E9E", marginTop: 2 },

  // Category badge
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryText: { fontSize: 10, fontWeight: "600" },

  // Post content
  postTitle: { fontSize: 16, fontWeight: "bold", color: "#212121", marginBottom: 6 },
  postBody: { fontSize: 13, color: "#616161", lineHeight: 19 },

  // Actions
  postActions: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 20,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontSize: 13, color: "#9E9E9E" },
  actionTextLiked: { color: "#D32F2F" },
});