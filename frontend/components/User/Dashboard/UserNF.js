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
import socketService from "../../../services/socket";

export default function UserNF({ user }) {
  const [posts, setPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Tip");
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
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const categories = ["Announcement", "Event", "Tip", "Notice", "Achievement"];

  useEffect(() => {
    console.log("📡 Current API_URL:", API_URL);
    loadUserId();
    fetchPosts();
    fetchSuggestedUsers();
    initializeSocket();

    return () => {
      // Cleanup socket listeners on unmount
      socketService.offNewMessage();
      socketService.offTypingEvents();
    };
  }, []);

  const initializeSocket = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const userId = parsedUser.id;
        setCurrentUserId(userId);
        
        // Connect to socket
        socketService.connect(userId);

        // Listen for new messages
        socketService.onNewMessage((message) => {
          console.log("📨 New message received:", message);
          console.log("📨 Message senderId:", message.senderId, "Current userId:", userId);
          
          // Add message only if it doesn't already exist
          setMessages((prev) => {
            const messageId = String(message.id);
            const exists = prev.some(msg => String(msg.id) === messageId);
            if (exists) {
              console.log("⚠️ Duplicate message ignored:", messageId);
              return prev;
            }
            
            // Determine sender based on senderId vs current userId
            const formattedMessage = {
              ...message,
              sender: String(message.senderId) === String(userId) ? "me" : "them"
            };
            
            console.log("📨 Formatted message sender:", formattedMessage.sender);
            
            return [...prev, formattedMessage];
          });
        });

        // Listen for typing events
        socketService.onUserTyping(({ userId: typingUserId }) => {
          if (selectedUserProfile && typingUserId === selectedUserProfile.id) {
            setIsTyping(true);
          }
        });

        socketService.onUserStopTyping(({ userId: typingUserId }) => {
          if (selectedUserProfile && typingUserId === selectedUserProfile.id) {
            setIsTyping(false);
          }
        });
      }
    } catch (error) {
      console.error("Initialize socket error:", error);
    }
  };

  const loadUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error("Load user ID error:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      console.log("Fetching posts from:", `${API_URL}/api/newsfeed`);
      
      const userData = await AsyncStorage.getItem("userData");
      const userId = userData ? JSON.parse(userData).id : null;
      
      const url = userId 
        ? `${API_URL}/api/newsfeed?userId=${userId}`
        : `${API_URL}/api/newsfeed`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("Response status:", response.status);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response");
        const text = await response.text();
        console.error("Response text:", text.substring(0, 200));
        
        // Show sample posts as fallback
        setPosts([]);
        Alert.alert(
          "Server Connection Issue", 
          "Could not connect to the backend server. Please ensure:\n\n1. Backend is running (npm start in backend folder)\n2. You're on the same WiFi network\n3. Check API_URL in config.js\n\nShowing empty feed for now."
        );
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Fetched posts:", data);

      if (data.success) {
        setPosts(data.posts || []);
      } else {
        Alert.alert("Error", data.message || "Failed to load posts");
        setPosts([]);
      }
    } catch (error) {
      console.error("Fetch posts error:", error);
      console.error("API_URL:", API_URL);
      
      // Show empty feed as fallback
      setPosts([]);
      Alert.alert(
        "Connection Error", 
        `Could not connect to server at:\n${API_URL}\n\nPlease check:\n1. Backend server is running\n2. Same WiFi network\n3. Firewall settings`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = useCallback(async (postId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) {
        Alert.alert("Error", "Please login to like posts");
        return;
      }

      // Optimistic update
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
        // Revert on error
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
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPosts();
    await fetchSuggestedUsers();
    setIsRefreshing(false);
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      setIsLoadingSuggestions(true);
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/users/suggested`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuggestedUsers(data.users || []);
      }
    } catch (error) {
      console.error("Fetch suggested users error:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert("Error", "Please login to follow users");
        return;
      }

      // Optimistic update
      setSuggestedUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );

      // Also update in profile modal if open
      if (selectedUserProfile && selectedUserProfile.id === userId) {
        setSelectedUserProfile((prev) => ({
          ...prev,
          isFollowing: !prev.isFollowing,
          followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1,
        }));
      }

      const response = await fetch(`${API_URL}/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        // Revert on error
        setSuggestedUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
          )
        );
        if (selectedUserProfile && selectedUserProfile.id === userId) {
          setSelectedUserProfile((prev) => ({
            ...prev,
            isFollowing: !prev.isFollowing,
            followersCount: prev.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1,
          }));
        }
        Alert.alert("Error", data.message || "Failed to follow user");
      }
    } catch (error) {
      console.error("Follow user error:", error);
      // Revert on error
      setSuggestedUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
      if (selectedUserProfile && selectedUserProfile.id === userId) {
        setSelectedUserProfile((prev) => ({
          ...prev,
          isFollowing: !prev.isFollowing,
          followersCount: prev.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1,
        }));
      }
      Alert.alert("Error", "Could not connect to server");
    }
  };

  const handleViewUserProfile = async (userId) => {
    try {
      setShowUserProfileModal(true);
      setIsLoadingUserProfile(true);
      setMessages([]);

      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert("Error", "Please login to view profiles");
        setShowUserProfileModal(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSelectedUserProfile(data.user);
        
        // Load existing messages
        await loadMessages(userId);
      } else {
        Alert.alert("Error", data.message || "Failed to load user profile");
        setShowUserProfileModal(false);
      }
    } catch (error) {
      console.error("View user profile error:", error);
      Alert.alert("Error", "Could not load user profile");
      setShowUserProfileModal(false);
    } finally {
      setIsLoadingUserProfile(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) return;

      console.log("📨 Loading messages from:", `${API_URL}/api/messages/${userId}`);

      const response = await fetch(`${API_URL}/api/messages/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response");
        const text = await response.text();
        console.error("Response text:", text.substring(0, 200));
        return;
      }

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
        
        // Mark messages as read
        await markMessagesAsRead(userId);
      } else {
        console.error("Load messages failed:", data.message);
      }
    } catch (error) {
      console.error("Load messages error:", error);
    }
  };

  const markMessagesAsRead = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) return;

      await fetch(`${API_URL}/api/messages/${userId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Mark messages as read error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUserProfile) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    setIsSendingMessage(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert("Error", "Please login to send messages");
        setIsSendingMessage(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/messages/${selectedUserProfile.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: messageText }),
      });

      const data = await response.json();

      if (data.success) {
        // Add message only if it doesn't already exist
        setMessages((prev) => {
          const messageId = String(data.message.id);
          const exists = prev.some(msg => String(msg.id) === messageId);
          if (exists) {
            console.log("⚠️ Duplicate message ignored:", messageId);
            return prev;
          }
          return [...prev, data.message];
        });
        setMessageText("");
        
        // Stop typing indicator
        if (currentUserId) {
          socketService.emitStopTyping(currentUserId, selectedUserProfile.id);
        }
      } else {
        Alert.alert("Error", data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Send message error:", error);
      Alert.alert("Error", "Could not send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleTyping = (text) => {
    setMessageText(text);

    if (text.trim() && currentUserId && selectedUserProfile) {
      socketService.emitTyping(currentUserId, selectedUserProfile.id);
      
      // Clear typing after 2 seconds of no typing
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socketService.emitStopTyping(currentUserId, selectedUserProfile.id);
      }, 2000);
    } else if (!text.trim() && currentUserId && selectedUserProfile) {
      socketService.emitStopTyping(currentUserId, selectedUserProfile.id);
    }
  };

  const handleCloseUserProfile = () => {
    setShowUserProfileModal(false);
    setSelectedUserProfile(null);
    setMessages([]);
    setMessageText("");
  };

  const handleCreatePost = useCallback(async () => {
    if (!newPostText.trim()) {
      Alert.alert("Error", "Please enter some text for your post");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

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

      // If editing and removing media
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
          // Update existing post
          setPosts(posts.map(p => p.id === editingPost.id ? data.post : p));
          Alert.alert("Success", "Post updated successfully!");
        } else {
          // Add new post
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
  }, [newPostText, newPostCategory, posts, selectedImage, selectedVideo, editingPost]);

  const handleEditPost = (post) => {
    setEditingPost(post);
    setNewPostText(post.body);
    setNewPostCategory(post.category);
    
    // Set existing media as selected
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
              const token = await AsyncStorage.getItem("userToken");

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
    setNewPostCategory("Tip");
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
      const token = await AsyncStorage.getItem("userToken");

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
        // Update local state
        const updatedComments = [data.comment, ...(selectedPostComments.commentsList || [])];
        setSelectedPostComments({ ...selectedPostComments, commentsList: updatedComments });
        
        // Update post comments count
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
    const shareText = `Check out this post on Trash2Action:\n\n${post.title}\n\n${post.body}`;
    
    Alert.alert(
      "Share Post",
      "Share this post with others",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy Link",
          onPress: () => {
            // In a real app, you'd copy the actual post URL
            Alert.alert("Copied", "Post link copied to clipboard!");
          },
        },
        {
          text: "Share Text",
          onPress: () => {
            // In a real app, you'd use Share API
            Alert.alert("Share", shareText);
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
      setSelectedVideo(null); // Clear video if image is selected
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
      setSelectedImage(null); // Clear image if video is selected
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Announcement: "#2E7D32",
      Event: "#9C27B0",
      Tip: "#43A047",
      Notice: "#2196F3",
      Achievement: "#FB8C00",
    };
    return colors[category] || "#2E7D32";
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Newsfeed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.iconBtn}>
            <Ionicons name="search" size={22} color="#2E7D32" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCreatePost(true)} style={styles.iconBtn}>
            <Ionicons name="add-circle" size={22} color="#2E7D32" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn}>
            <Ionicons
              name={isRefreshing ? "sync" : "sync-outline"}
              size={22}
              color="#2E7D32"
              style={isRefreshing ? styles.spinIcon : {}}
            />
          </TouchableOpacity>
        </View>
      </View>

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
        style={styles.scrollView}
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
        {/* People You May Know Section */}
        {suggestedUsers.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>People You May Know</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestedUsers.map((suggestedUser) => (
                <View key={suggestedUser.id} style={styles.suggestionCard}>
                  <TouchableOpacity 
                    onPress={() => handleViewUserProfile(suggestedUser.id)}
                    style={styles.suggestionAvatarContainer}
                  >
                    <View style={styles.suggestionAvatar}>
                      <Text style={styles.suggestionAvatarText}>{suggestedUser.avatar}</Text>
                    </View>
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {suggestedUser.fullName}
                    </Text>
                    <Text style={styles.suggestionStats}>
                      {suggestedUser.followersCount} followers
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.followBtn,
                      suggestedUser.isFollowing && styles.followingBtn
                    ]}
                    onPress={() => handleFollowUser(suggestedUser.id)}
                  >
                    <Ionicons 
                      name={suggestedUser.isFollowing ? "checkmark" : "person-add"} 
                      size={14} 
                      color={suggestedUser.isFollowing ? "#2E7D32" : "#FFFFFF"} 
                    />
                    <Text style={[
                      styles.followBtnText,
                      suggestedUser.isFollowing && styles.followingBtnText
                    ]}>
                      {suggestedUser.isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color="#A5D6A7" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No posts match your search." : "No posts available yet."}
            </Text>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postAuthorRow}>
                <TouchableOpacity 
                  style={styles.postAuthorTouchable}
                  onPress={() => post.authorId !== currentUserId && handleViewUserProfile(post.authorId)}
                  disabled={post.authorId === currentUserId}
                >
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
                </TouchableOpacity>
                
                {currentUserId && post.authorId === currentUserId && (
                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={styles.postActionBtn}
                      onPress={() => handleEditPost(post)}
                    >
                      <Ionicons name="create-outline" size={20} color="#2E7D32" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.postActionBtn}
                      onPress={() => handleDeletePost(post.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postBody}>{post.body}</Text>

              {post.imageUrl && (
                <Image
                  source={{ uri: post.imageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}

              {post.videoUrl && (
                <Video
                  source={{ uri: post.videoUrl }}
                  style={styles.postVideo}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                />
              )}

              <View style={styles.postActionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => toggleLike(post.id)}
                >
                  <Ionicons
                    name={post.liked ? "heart" : "heart-outline"}
                    size={18}
                    color={post.liked ? "#D32F2F" : "#9E9E9E"}
                  />
                  <TouchableOpacity onPress={() => handleShowLikes(post.id)}>
                    <Text style={[styles.actionText, post.liked && styles.actionTextLiked]}>
                      {post.likes}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => handleShowComments(post)}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#9E9E9E" />
                  <Text style={styles.actionText}>{post.comments?.length || post.comments || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => handleSharePost(post)}
                >
                  <Ionicons name="share-outline" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <Modal
        visible={showCreatePost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPost ? "Edit Post" : "Create Post"}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.postInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#9E9E9E"
              multiline
              value={newPostText}
              onChangeText={setNewPostText}
              maxLength={500}
            />

            <Text style={styles.charCount}>{newPostText.length}/500</Text>

            {selectedImage && (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            )}

            {selectedVideo && (
              <View style={styles.mediaPreview}>
                <Video
                  source={{ uri: selectedVideo.uri }}
                  style={styles.previewVideo}
                  useNativeControls
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  onPress={() => setSelectedVideo(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.categorySelector}>
              <Text style={styles.categorySelectorLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      newPostCategory === cat && styles.categoryChipActive
                    ]}
                    onPress={() => setNewPostCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      newPostCategory === cat && styles.categoryChipTextActive
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.mediaButtons}>
              <TouchableOpacity 
                style={styles.mediaBtn} 
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={20} color="#2E7D32" />
                <Text style={styles.mediaBtnText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mediaBtn} 
                onPress={pickVideo}
              >
                <Ionicons name="videocam-outline" size={20} color="#2E7D32" />
                <Text style={styles.mediaBtnText}>Video</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.publishBtn, (!newPostText.trim() || isSubmitting) && styles.publishBtnDisabled]} 
              onPress={handleCreatePost}
              disabled={!newPostText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.publishBtnText}>
                  {editingPost ? "Update Post" : "Publish Post"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Likes Modal */}
      <Modal
        visible={showLikesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLikesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Likes ({selectedPostLikes.length})</Text>
              <TouchableOpacity onPress={() => setShowLikesModal(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.likesScroll}>
              {selectedPostLikes.length === 0 ? (
                <Text style={styles.emptyText}>No likes yet</Text>
              ) : (
                selectedPostLikes.map((like) => (
                  <View key={like.id} style={styles.likeItem}>
                    <View style={styles.likeAvatar}>
                      <Text style={styles.likeAvatarText}>{like.avatar}</Text>
                    </View>
                    <Text style={styles.likeName}>{like.name}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Comments ({selectedPostComments?.commentsList?.length || 0})
              </Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsScroll}>
              {isLoadingComments ? (
                <ActivityIndicator size="small" color="#2E7D32" style={{ marginTop: 20 }} />
              ) : selectedPostComments?.commentsList?.length === 0 ? (
                <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
              ) : (
                selectedPostComments?.commentsList?.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{comment.userAvatar}</Text>
                    </View>
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUserName}>{comment.userName}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <Text style={styles.commentTime}>{comment.time}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#9E9E9E"
                value={commentText}
                onChangeText={setCommentText}
                maxLength={300}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendCommentBtn, !commentText.trim() && styles.sendCommentBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Ionicons name="send" size={20} color={commentText.trim() ? "#2E7D32" : "#9E9E9E"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal
        visible={showUserProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseUserProfile}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userProfileModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile</Text>
              <TouchableOpacity onPress={handleCloseUserProfile}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            {isLoadingUserProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
              </View>
            ) : selectedUserProfile ? (
              <ScrollView style={styles.profileScroll} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatarLarge}>
                    <Text style={styles.profileAvatarLargeText}>
                      {selectedUserProfile.avatar}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>{selectedUserProfile.fullName}</Text>
                  <Text style={styles.profileEmail}>{selectedUserProfile.email}</Text>

                  {/* Stats */}
                  <View style={styles.profileStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedUserProfile.followersCount}</Text>
                      <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedUserProfile.followingCount}</Text>
                      <Text style={styles.statLabel}>Following</Text>
                    </View>
                  </View>

                  {/* Follow Button */}
                  <TouchableOpacity
                    style={[
                      styles.profileFollowBtn,
                      selectedUserProfile.isFollowing && styles.profileFollowingBtn
                    ]}
                    onPress={() => handleFollowUser(selectedUserProfile.id)}
                  >
                    <Ionicons 
                      name={selectedUserProfile.isFollowing ? "checkmark-circle" : "person-add"} 
                      size={18} 
                      color={selectedUserProfile.isFollowing ? "#2E7D32" : "#FFFFFF"} 
                    />
                    <Text style={[
                      styles.profileFollowBtnText,
                      selectedUserProfile.isFollowing && styles.profileFollowingBtnText
                    ]}>
                      {selectedUserProfile.isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Messaging Section */}
                <View style={styles.messagingSection}>
                  <View style={styles.messagingSectionHeader}>
                    <Ionicons name="chatbubbles" size={20} color="#2E7D32" />
                    <Text style={styles.messagingSectionTitle}>Messages</Text>
                  </View>

                  <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
                    {messages.length === 0 ? (
                      <View style={styles.emptyMessages}>
                        <Ionicons name="chatbubble-outline" size={40} color="#C8E6C9" />
                        <Text style={styles.emptyMessagesText}>
                          No messages yet. Start a conversation!
                        </Text>
                      </View>
                    ) : (
                      <>
                        {messages.map((msg) => (
                          <View
                            key={String(msg.id)}
                            style={[
                              styles.messageItem,
                              msg.sender === "me" ? styles.myMessage : styles.theirMessage
                            ]}
                          >
                            <Text style={[
                              styles.messageText,
                              msg.sender === "me" && { color: "#FFFFFF" }
                            ]}>
                              {msg.text}
                            </Text>
                            <Text style={[
                              styles.messageTime,
                              msg.sender === "me" && { color: "rgba(255,255,255,0.7)" }
                            ]}>
                              {msg.time}
                            </Text>
                          </View>
                        ))}
                        {isTyping && (
                          <View style={styles.typingIndicator}>
                            <Text style={styles.typingText}>
                              {selectedUserProfile?.fullName} is typing...
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </ScrollView>

                  <View style={styles.messageInputContainer}>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Type a message..."
                      placeholderTextColor="#9E9E9E"
                      value={messageText}
                      onChangeText={handleTyping}
                      maxLength={500}
                      multiline
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendMessageBtn,
                        (!messageText.trim() || isSendingMessage) && styles.sendMessageBtnDisabled
                      ]}
                      onPress={handleSendMessage}
                      disabled={!messageText.trim() || isSendingMessage}
                    >
                      {isSendingMessage ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons 
                          name="send" 
                          size={20} 
                          color={messageText.trim() ? "#FFFFFF" : "#9E9E9E"} 
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#1B5E20" 
  },
  headerActions: { 
    flexDirection: "row", 
    gap: 8 
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  spinIcon: { 
    transform: [{ rotate: "45deg" }] 
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#212121",
    paddingVertical: 4,
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    paddingHorizontal: 20 
  },
  emptyContainer: { 
    alignItems: "center", 
    paddingTop: 60 
  },
  emptyText: { 
    fontSize: 14, 
    color: "#757575", 
    marginTop: 12 
  },
  loadingContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 12,
  },
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
  postAuthorRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10 
  },
  postActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: "auto",
  },
  postActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  postAvatarText: { 
    fontSize: 22 
  },
  postAuthorInfo: { 
    flex: 1 
  },
  postNameRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
  },
  postAuthorName: { 
    fontSize: 14, 
    fontWeight: "bold", 
    color: "#212121" 
  },
  postTime: { 
    fontSize: 11, 
    color: "#9E9E9E", 
    marginTop: 2 
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryText: { 
    fontSize: 10, 
    fontWeight: "600" 
  },
  postTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#212121", 
    marginBottom: 6 
  },
  postBody: { 
    fontSize: 13, 
    color: "#616161", 
    lineHeight: 19,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#F5F5F5",
  },
  postVideo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#000000",
  },
  postActionsRow: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 20,
  },
  actionBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 5 
  },
  actionText: { 
    fontSize: 13, 
    color: "#9E9E9E" 
  },
  actionTextLiked: { 
    color: "#D32F2F" 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-end" 
  },
  modalContent: { 
    backgroundColor: "#FFFFFF", 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 20, 
    maxHeight: "80%" 
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 16 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#212121" 
  },
  postInput: { 
    borderWidth: 1, 
    borderColor: "#E0E0E0", 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 15, 
    color: "#212121", 
    minHeight: 120, 
    textAlignVertical: "top", 
    marginBottom: 8 
  },
  charCount: {
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "right",
    marginBottom: 12,
  },
  mediaPreview: {
    position: "relative",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  previewVideo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#000000",
  },
  removeMediaBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  categorySelector: { 
    marginBottom: 16 
  },
  categorySelectorLabel: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#757575", 
    marginBottom: 8 
  },
  categoryChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 16, 
    backgroundColor: "#F5F5F5", 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: "#E0E0E0" 
  },
  categoryChipActive: { 
    backgroundColor: "#2E7D32", 
    borderColor: "#2E7D32" 
  },
  categoryChipText: { 
    fontSize: 13, 
    color: "#757575", 
    fontWeight: "500" 
  },
  categoryChipTextActive: { 
    color: "#FFFFFF", 
    fontWeight: "600" 
  },
  mediaButtons: { 
    flexDirection: "row", 
    gap: 12, 
    marginBottom: 20 
  },
  mediaBtn: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 6, 
    paddingVertical: 12, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#C8E6C9", 
    backgroundColor: "#F1F8E9" 
  },
  mediaBtnText: { 
    fontSize: 14, 
    color: "#2E7D32", 
    fontWeight: "500" 
  },
  publishBtn: { 
    backgroundColor: "#2E7D32", 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: "center" 
  },
  publishBtnDisabled: {
    backgroundColor: "#C8E6C9",
    opacity: 0.6,
  },
  publishBtnText: { 
    fontSize: 16, 
    color: "#FFFFFF", 
    fontWeight: "bold" 
  },
  likesScroll: {
    maxHeight: 400,
  },
  likeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  likeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  likeAvatarText: {
    fontSize: 18,
  },
  likeName: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  commentsScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  commentAvatarText: {
    fontSize: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    color: "#424242",
    lineHeight: 18,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 11,
    color: "#9E9E9E",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: "#212121",
    maxHeight: 80,
    marginRight: 8,
  },
  sendCommentBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  sendCommentBtnDisabled: {
    backgroundColor: "#F5F5F5",
  },
  suggestionAvatarContainer: {
    alignItems: "center",
    width: "100%",
  },
  postAuthorTouchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userProfileModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
    height: "90%",
  },
  profileScroll: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 20,
  },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#2E7D32",
  },
  profileAvatarLargeText: {
    fontSize: 48,
    fontWeight: "600",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  profileFollowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 160,
  },
  profileFollowBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileFollowingBtn: {
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#2E7D32",
  },
  profileFollowingBtnText: {
    color: "#2E7D32",
  },
  messagingSection: {
    flex: 1,
    paddingBottom: 20,
  },
  messagingSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  messagingSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  messagesContainer: {
    flex: 1,
    maxHeight: 300,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  emptyMessages: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 12,
    textAlign: "center",
  },
  messageItem: {
    maxWidth: "75%",
    minWidth: 80,
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    flexShrink: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2E7D32",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    color: "#212121",
    flexWrap: "wrap",
    flexShrink: 1,
  },
  messageTime: {
    fontSize: 10,
    color: "#9E9E9E",
    alignSelf: "flex-end",
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#212121",
    maxHeight: 100,
    backgroundColor: "#F9F9F9",
  },
  sendMessageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  sendMessageBtnDisabled: {
    backgroundColor: "#C8E6C9",
  },
  suggestionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 12,
  },
  suggestionsScroll: {
    paddingRight: 20,
  },
  suggestionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  suggestionAvatarText: {
    fontSize: 28,
    fontWeight: "600",
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212121",
    textAlign: "center",
    marginBottom: 4,
  },
  suggestionStats: {
    fontSize: 11,
    color: "#9E9E9E",
    marginBottom: 12,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    width: "100%",
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  followingBtn: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  followingBtnText: {
    color: "#2E7D32",
  },
  typingIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  typingText: {
    fontSize: 12,
    color: "#9E9E9E",
    fontStyle: "italic",
  },
});