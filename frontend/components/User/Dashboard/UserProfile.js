//Trash2Action/components/User/Dashboard/UserProfile.js
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../../config";
import socketService from "../../../services/socket";

export default function UserProfile({ token, user, onLogout }) {
  const [profileImage, setProfileImage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.fullName || "");
  const [editedGender, setEditedGender] = useState(user?.gender || "male");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [selectedUserForChat, setSelectedUserForChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ── Placeholder stats (replace with API calls later) ─────────────────────
  const stats = {
    totalReports: 12,
    pointsEarned: 840,
    rank: 5,
    streak: 7,
    level: "Silver",
  };

  const menuItems = [
    { id: "edit", icon: "create-outline", label: "Edit Profile", color: "#2E7D32" },
    { id: "security", icon: "lock-closed-outline", label: "Security & Password", color: "#2196F3" },
    { id: "privacy", icon: "eye-outline", label: "Privacy Settings", color: "#9C27B0" },
    { id: "notifications", icon: "notifications-outline", label: "Notification Settings", color: "#FF7043" },
    { id: "help", icon: "help-circle-outline", label: "Help & Support", color: "#607D8B" },
    { id: "about", icon: "information-circle-outline", label: "About Trash2Action", color: "#78909C" },
  ];

  // ── Load user profile data ───────────────────────────────────────────────
  useEffect(() => {
    loadUserProfile();
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
          if (selectedUserForChat && typingUserId === selectedUserForChat.id) {
            setIsTyping(true);
          }
        });

        socketService.onUserStopTyping(({ userId: typingUserId }) => {
          if (selectedUserForChat && typingUserId === selectedUserForChat.id) {
            setIsTyping(false);
          }
        });
      }
    } catch (error) {
      console.error("Initialize socket error:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");
      
      if (!userToken || !userData) return;

      const parsedUser = JSON.parse(userData);
      
      const response = await fetch(`${API_URL}/api/users/${parsedUser.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setFollowersCount(data.user.followersCount || 0);
        setFollowingCount(data.user.followingCount || 0);
      }
    } catch (error) {
      console.error("Load user profile error:", error);
    }
  };

  // ── Load followers ───────────────────────────────────────────────────────
  const loadFollowers = async () => {
    try {
      setIsLoadingFollowers(true);
      const userToken = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");
      
      if (!userToken || !userData) return;

      const parsedUser = JSON.parse(userData);
      
      const response = await fetch(`${API_URL}/api/users/${parsedUser.id}/followers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setFollowers(data.followers || []);
      }
    } catch (error) {
      console.error("Load followers error:", error);
      Alert.alert("Error", "Could not load followers");
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  // ── Load following ───────────────────────────────────────────────────────
  const loadFollowing = async () => {
    try {
      setIsLoadingFollowing(true);
      const userToken = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");
      
      if (!userToken || !userData) return;

      const parsedUser = JSON.parse(userData);
      
      const response = await fetch(`${API_URL}/api/users/${parsedUser.id}/following`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error("Load following error:", error);
      Alert.alert("Error", "Could not load following");
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  // ── Handle show followers ────────────────────────────────────────────────
  const handleShowFollowers = () => {
    setShowFollowersModal(true);
    loadFollowers();
  };

  // ── Handle show following ────────────────────────────────────────────────
  const handleShowFollowing = () => {
    setShowFollowingModal(true);
    loadFollowing();
  };

  // ── Handle message user ──────────────────────────────────────────────────
  const handleMessageUser = async (userToMessage) => {
    setSelectedUserForChat(userToMessage);
    setMessages([]);
    setMessageText("");
    setShowFollowersModal(false);
    setShowFollowingModal(false);
    setShowMessagesModal(true);

    // Load existing messages
    await loadMessages(userToMessage.id);
  };

  // ── Load messages ────────────────────────────────────────────────────────
  const loadMessages = async (userId) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      
      if (!userToken) return;

      console.log("📨 Loading messages from:", `${API_URL}/api/messages/${userId}`);

      const response = await fetch(`${API_URL}/api/messages/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
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

  // ── Mark messages as read ────────────────────────────────────────────────
  const markMessagesAsRead = async (userId) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      
      if (!userToken) return;

      await fetch(`${API_URL}/api/messages/${userId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });
    } catch (error) {
      console.error("Mark messages as read error:", error);
    }
  };

  // ── Handle send message ──────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUserForChat) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    setIsSendingMessage(true);

    try {
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        Alert.alert("Error", "Please login to send messages");
        setIsSendingMessage(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/messages/${selectedUserForChat.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
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
          socketService.emitStopTyping(currentUserId, selectedUserForChat.id);
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

  // ── Handle typing ────────────────────────────────────────────────────────
  const handleTyping = (text) => {
    setMessageText(text);

    if (text.trim() && currentUserId && selectedUserForChat) {
      socketService.emitTyping(currentUserId, selectedUserForChat.id);
      
      // Clear typing after 2 seconds of no typing
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socketService.emitStopTyping(currentUserId, selectedUserForChat.id);
      }, 2000);
    } else if (!text.trim() && currentUserId && selectedUserForChat) {
      socketService.emitStopTyping(currentUserId, selectedUserForChat.id);
    }
  };

  // ─── Pick profile image ──────────────────────────────────────────────────
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your photo library to upload a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      Alert.alert("Success", "Profile picture updated!");
    }
  };

  // ─── Take photo ──────────────────────────────────────────────────────────
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow camera access to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      Alert.alert("Success", "Profile picture updated!");
    }
  };

  // ─── Handle avatar edit ──────────────────────────────────────────────────
  const handleAvatarEdit = () => {
    Alert.alert(
      "Update Profile Picture",
      "Choose an option",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // ─── Handle menu press ───────────────────────────────────────────────────
  const handleMenuPress = (id) => {
    if (id === "edit") {
      setShowEditModal(true);
    } else {
      Alert.alert("Coming Soon", `${menuItems.find(m => m.id === id)?.label} — feature will be available soon!`);
    }
  };

  // ─── Save profile changes ────────────────────────────────────────────────
  const handleSaveProfile = () => {
    Alert.alert("Success", "Profile updated successfully!");
    setShowEditModal(false);
  };

  // ─── Gender display helper ───────────────────────────────────────────────
  const genderLabel = user?.gender === "male" ? "Male" : user?.gender === "female" ? "Female" : "Other";

  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Profile header card ── */}
        <View style={styles.profileHeaderCard}>
          {/* Avatar */}
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={52} color="#FFFFFF" />
              )}
            </View>
            {/* Edit avatar button */}
            <TouchableOpacity style={styles.avatarEditBtn} onPress={handleAvatarEdit}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Name + verified badge */}
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{user?.fullName || "User"}</Text>
            {user?.isEmailVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#43A047" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.profileEmail}>{user?.email || ""}</Text>
          <Text style={styles.profileGender}>{genderLabel} · Member since 2025</Text>

          {/* Followers/Following Stats */}
          <View style={styles.socialStats}>
            <TouchableOpacity 
              style={styles.socialStatItem}
              onPress={handleShowFollowers}
            >
              <Text style={styles.socialStatValue}>{followersCount}</Text>
              <Text style={styles.socialStatLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.socialStatDivider} />
            <TouchableOpacity 
              style={styles.socialStatItem}
              onPress={handleShowFollowing}
            >
              <Text style={styles.socialStatValue}>{followingCount}</Text>
              <Text style={styles.socialStatLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <StatBox icon="document-text" value={stats.totalReports.toString()} label="Reports" color="#2E7D32" />
          <StatBox icon="trophy" value={stats.pointsEarned.toString()} label="Points" color="#FB8C00" />
          <StatBox icon="star" value={`#${stats.rank}`} label="Rank" color="#8E24AA" />
          <StatBox icon="flame" value={`${stats.streak}d`} label="Streak" color="#FF5722" />
        </View>

        {/* ── Level banner ── */}
        <View style={styles.levelBanner}>
          <View style={styles.levelIconWrap}>
            <Ionicons name="medal" size={28} color="#FDD835" />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{stats.level} Member</Text>
            <Text style={styles.levelSub}>You need 160 more points to reach Gold</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "68%" }]} />
          </View>
        </View>

        {/* ── Menu items ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Settings</Text>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.color + "15" }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout button ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your full name"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={[styles.formInput, styles.formInputDisabled]}
                value={user?.email}
                editable={false}
                placeholderTextColor="#9E9E9E"
              />
              <Text style={styles.formHint}>Email cannot be changed</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Gender</Text>
              <View style={styles.genderOptions}>
                {["male", "female", "other"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      editedGender === g && styles.genderOptionActive
                    ]}
                    onPress={() => setEditedGender(g)}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      editedGender === g && styles.genderOptionTextActive
                    ]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Followers Modal */}
      <Modal
        visible={showFollowersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Followers ({followersCount})</Text>
              <TouchableOpacity onPress={() => setShowFollowersModal(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.userListScroll}>
              {isLoadingFollowers ? (
                <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
              ) : followers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#C8E6C9" />
                  <Text style={styles.emptyStateText}>No followers yet</Text>
                </View>
              ) : (
                followers.map((follower) => (
                  <View key={follower.id} style={styles.userListItem}>
                    <View style={styles.userListAvatar}>
                      <Text style={styles.userListAvatarText}>{follower.avatar}</Text>
                    </View>
                    <View style={styles.userListInfo}>
                      <Text style={styles.userListName}>{follower.fullName}</Text>
                      <Text style={styles.userListEmail}>{follower.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.messageIconBtn}
                      onPress={() => handleMessageUser(follower)}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color="#2E7D32" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Following Modal */}
      <Modal
        visible={showFollowingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Following ({followingCount})</Text>
              <TouchableOpacity onPress={() => setShowFollowingModal(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.userListScroll}>
              {isLoadingFollowing ? (
                <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
              ) : following.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#C8E6C9" />
                  <Text style={styles.emptyStateText}>Not following anyone yet</Text>
                </View>
              ) : (
                following.map((followedUser) => (
                  <View key={followedUser.id} style={styles.userListItem}>
                    <View style={styles.userListAvatar}>
                      <Text style={styles.userListAvatarText}>{followedUser.avatar}</Text>
                    </View>
                    <View style={styles.userListInfo}>
                      <Text style={styles.userListName}>{followedUser.fullName}</Text>
                      <Text style={styles.userListEmail}>{followedUser.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.messageIconBtn}
                      onPress={() => handleMessageUser(followedUser)}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color="#2E7D32" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Messages Modal */}
      <Modal
        visible={showMessagesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMessagesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.chatHeaderInfo}>
                <TouchableOpacity onPress={() => setShowMessagesModal(false)}>
                  <Ionicons name="arrow-back" size={24} color="#757575" />
                </TouchableOpacity>
                {selectedUserForChat && (
                  <>
                    <View style={styles.chatHeaderAvatar}>
                      <Text style={styles.chatHeaderAvatarText}>
                        {selectedUserForChat.avatar}
                      </Text>
                    </View>
                    <Text style={styles.chatHeaderName}>{selectedUserForChat.fullName}</Text>
                  </>
                )}
              </View>
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
                        {selectedUserForChat?.fullName} is typing...
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
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ─── STAT BOX ────────────────────────────────────────────────────────────────
function StatBox({ icon, value, label, color }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statBoxIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  // ── Profile header card
  profileHeaderCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 50,
    marginBottom: 18,
    paddingTop: 30,
    paddingBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarOuter: { position: "relative", marginBottom: 14 },
  avatarInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  avatarEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#43A047",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },

  profileNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 22, fontWeight: "bold", color: "#1B5E20" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText: { fontSize: 12, color: "#43A047", fontWeight: "600" },
  profileEmail: { fontSize: 13, color: "#757575", marginTop: 4 },
  profileGender: { fontSize: 12, color: "#9E9E9E", marginTop: 3 },

  // ── Stats grid
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  statBoxIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statBoxValue: { fontSize: 17, fontWeight: "bold" },
  statBoxLabel: { fontSize: 10, color: "#9E9E9E", marginTop: 2 },

  // ── Level banner
  levelBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  levelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
  },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 15, fontWeight: "bold", color: "#212121" },
  levelSub: { fontSize: 12, color: "#757575", marginTop: 2 },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#43A047",
    borderRadius: 4,
  },

  // ── Menu section
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#757575",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#424242", fontWeight: "500" },

  // ── Logout button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: { fontSize: 16, color: "#D32F2F", fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#212121" },
  
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: "600", color: "#424242", marginBottom: 8 },
  formInput: { borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 10, padding: 12, fontSize: 15, color: "#212121", backgroundColor: "#FAFAFA" },
  formInputDisabled: { backgroundColor: "#F5F5F5", color: "#9E9E9E" },
  formHint: { fontSize: 12, color: "#9E9E9E", marginTop: 4 },
  
  genderOptions: { flexDirection: "row", gap: 10 },
  genderOption: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E0E0E0", backgroundColor: "#FAFAFA", alignItems: "center" },
  genderOptionActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  genderOptionText: { fontSize: 14, color: "#757575", fontWeight: "500" },
  genderOptionTextActive: { color: "#FFFFFF", fontWeight: "600" },
  
  saveBtn: { backgroundColor: "#2E7D32", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  saveBtnText: { fontSize: 16, color: "#FFFFFF", fontWeight: "bold" },

  // Social stats
  socialStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  socialStatItem: {
    alignItems: "center",
  },
  socialStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  socialStatLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  socialStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#E0E0E0",
  },

  // User list (followers/following)
  userListScroll: {
    maxHeight: 500,
  },
  userListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  userListAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userListAvatarText: {
    fontSize: 20,
    fontWeight: "600",
  },
  userListInfo: {
    flex: 1,
  },
  userListName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  userListEmail: {
    fontSize: 12,
    color: "#757575",
  },
  messageIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 12,
  },

  // Chat modal
  chatModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
    height: "90%",
  },
  chatHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  chatHeaderAvatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginVertical: 16,
  },
  emptyMessages: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
