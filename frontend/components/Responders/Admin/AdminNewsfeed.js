import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  Image,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { API_URL } from "../../../config";

export default function AdminNewsfeed({ navigation, route }) {
  const { token, responder } = route.params || {};
  const [posts, setPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Announcement");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedPostLikes, setSelectedPostLikes] = useState([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const categories = ["Announcement", "Event", "Notice", "Achievement", "Update"];

  useEffect(() => {
    loadUserId();
    fetchPosts();
  }, []);

  const loadUserId = async () => {
    try {
      if (responder && responder.id) {
        setCurrentUserId(responder.id);
      }
    } catch (error) {
      console.error("Load user ID error:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const userId = responder?.id;
      const url = userId 
        ? `${API_URL}/api/newsfeed?userId=${userId}`
        : `${API_URL}/api/newsfeed`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response");
        setPosts([]);
        Alert.alert(
          "Server Connection Issue", 
          "Could not connect to the backend server."
        );
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
      } else {
        Alert.alert("Error", data.message || "Failed to load posts");
        setPosts([]);
      }
    } catch (error) {
      console.error("Fetch posts error:", error);
      setPosts([]);
      Alert.alert("Connection Error", "Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = useCallback(async (postId) => {
    try {
      if (!token) {
        Alert.alert("Error", "Please login to like posts");
        return;
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );

      const response = await fetch(`${API_URL}/api/newsfeed/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
              : p
          )
        );
        Alert.alert("Error", data.message || "Failed to like post");
      }
    } catch (error) {
      console.error("Toggle like error:", error);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );
    }
  }, [token]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!newPostText.trim()) {
      Alert.alert("Error", "Please enter some text for your post");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!token) {
        Alert.alert("Error", "Please login to create posts");
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("category", newPostCategory);
      formData.append("body", newPostText);

      if (selectedImage) {
        const imageUri = selectedImage.uri;
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("image", {
          uri: imageUri,
          name: filename,
          type: type,
        });
      }

      if (selectedVideo) {
        const videoUri = selectedVideo.uri;
        const filename = videoUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `video/${match[1]}` : "video/mp4";

        formData.append("video", {
          uri: videoUri,
          name: filename,
          type: type,
        });
      }

      const url = editingPost 
        ? `${API_URL}/api/newsfeed/${editingPost.id}`
        : `${API_URL}/api/newsfeed`;

      const method = editingPost ? "PUT" : "POST";

      if (editingPost) {
        if (editingPost.imageUrl && !selectedImage) {
          formData.append("removeImage", "true");
        }
        if (editingPost.videoUrl && !selectedVideo) {
          formData.append("removeVideo", "true");
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (editingPost) {
          setPosts(posts.map(p => p.id === editingPost.id ? data.post : p));
          Alert.alert("Success", "Post updated successfully!");
        } else {
          setPosts([data.post, ...posts]);
          Alert.alert("Success", "Your post has been published!");
        }
        
        setNewPostText("");
        setSelectedImage(null);
        setSelectedVideo(null);
        setEditingPost(null);
        setShowCreatePost(false);
      } else {
        Alert.alert("Error", data.message || "Failed to save post");
      }
    } catch (error) {
      console.error("Create/Edit post error:", error);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setIsSubmitting(false);
    }
  }, [newPostText, newPostCategory, posts, selectedImage, selectedVideo, editingPost, token]);

  const handleEditPost = (post) => {
    setEditingPost(post);
    setNewPostText(post.body);
    setNewPostCategory(post.category);
    
    if (post.imageUrl) {
      setSelectedImage({ uri: post.imageUrl });
    }
    if (post.videoUrl) {
      setSelectedVideo({ uri: post.videoUrl });
    }
    
    setShowCreatePost(true);
  };

  const handleDeletePost = async (postId) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!token) {
                Alert.alert("Error", "Please login to delete posts");
                return;
              }

              const response = await fetch(`${API_URL}/api/newsfeed/${postId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (data.success) {
                setPosts(posts.filter(p => p.id !== postId));
                Alert.alert("Success", "Post deleted successfully");
              } else {
                Alert.alert("Error", data.message || "Failed to delete post");
              }
            } catch (error) {
              console.error("Delete post error:", error);
              Alert.alert("Error", "Could not connect to server");
            }
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setShowCreatePost(false);
    setEditingPost(null);
    setNewPostText("");
    setSelectedImage(null);
    setSelectedVideo(null);
    setNewPostCategory("Announcement");
  };

  const handleShowLikes = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/newsfeed/${postId}/likes`);
      const data = await response.json();

      if (data.success) {
        setSelectedPostLikes(data.likes);
        setShowLikesModal(true);
      } else {
        Alert.alert("Error", "Failed to load likes");
      }
    } catch (error) {
      console.error("Show likes error:", error);
      Alert.alert("Error", "Could not load likes");
    }
  };

  const handleShowComments = async (post) => {
    setSelectedPostComments(post);
    setShowCommentsModal(true);
    setIsLoadingComments(true);

    try {
      const response = await fetch(`${API_URL}/api/newsfeed/${post.id}/comments`);
      const data = await response.json();

      if (data.success) {
        setSelectedPostComments({ ...post, commentsList: data.comments });
      }
    } catch (error) {
      console.error("Load comments error:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      if (!token) {
        Alert.alert("Error", "Please login to comment");
        return;
      }

      const response = await fetch(`${API_URL}/api/newsfeed/${selectedPostComments.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedComments = [data.comment, ...(selectedPostComments.commentsList || [])];
        setSelectedPostComments({ ...selectedPostComments, commentsList: updatedComments });
        
        setPosts(posts.map(p => 
          p.id === selectedPostComments.id 
            ? { ...p, comments: data.totalComments }
            : p
        ));
        
        setCommentText("");
      } else {
        Alert.alert("Error", data.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Add comment error:", error);
      Alert.alert("Error", "Could not add comment");
    }
  };

  const handleSharePost = (post) => {
    Alert.alert(
      "Share Post",
      "Share this post with others",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy Link",
          onPress: () => {
            Alert.alert("Copied", "Post link copied to clipboard!");
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera roll permissions to upload images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setSelectedVideo(null);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera roll permissions to upload videos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedVideo(result.assets[0]);
      setSelectedImage(null);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <LinearGradient colors={["#2E7D32", "#43A047", "#66BB6A"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Newsfeed</Text>
              <Text style={styles.headerSubtitle}>Latest updates and announcements</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.iconBtn}>
                <Ionicons name="search" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreatePost(true)} style={styles.iconBtn}>
                <Ionicons name="add-circle" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#9E9E9E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts..."
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#9E9E9E" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#2E7D32"]}
              tintColor="#2E7D32"
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : filteredPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={48} color="#A5D6A7" />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            filteredPosts.map((post) => (
              <View key={post.id} style={styles.newsCard}>
                <View style={styles.newsHeader}>
                  <View style={styles.newsIcon}>
                    <Ionicons 
                      name={post.category === "Announcement" ? "megaphone" : "newspaper"} 
                      size={24} 
                      color="#2E7D32" 
                    />
                  </View>
                  <View style={styles.newsInfo}>
                    <Text style={styles.newsTitle}>{post.authorName}</Text>
                    <Text style={styles.newsTime}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={styles.newsContent}>{post.body}</Text>
                {post.imageUrl && (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                )}
                <View style={styles.newsFooter}>
                  <TouchableOpacity style={styles.newsAction} onPress={() => toggleLike(post.id)}>
                    <Ionicons 
                      name={post.liked ? "heart" : "heart-outline"} 
                      size={20} 
                      color={post.liked ? "#F44336" : "#666"} 
                    />
                    <Text style={styles.newsActionText}>{post.likes || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.newsAction} onPress={() => handleShowComments(post)}>
                    <Ionicons name="chatbubble-outline" size={20} color="#666" />
                    <Text style={styles.newsActionText}>{post.comments || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.newsAction} onPress={() => handleSharePost(post)}>
                    <Ionicons name="share-social-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
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
  headerActions: { flexDirection: "row", gap: 12 },
  iconBtn: { padding: 4 },
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FFFFFF", 
    margin: 20, 
    marginTop: 0, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12, 
    gap: 8 
  },
  searchIcon: { marginRight: 4 },
  searchInput: { flex: 1, fontSize: 14, color: "#212121" },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  loadingContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#666" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: "#999", fontWeight: "500" },
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
  postImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
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
