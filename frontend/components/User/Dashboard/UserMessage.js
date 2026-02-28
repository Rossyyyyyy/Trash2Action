import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../../config";
import socketService from "../../../services/socket";

export default function UserMessage({ token, user, onClose, onUpdateUnread }) {
  const [view, setView] = useState("list");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadConversations();
    
    // Connect to Socket.IO
    if (user?.id) {
      socketService.connect(user.id);
    }

    // Listen for new messages
    socketService.onNewMessage((message) => {
      console.log("📨 New message received:", message);
      
      // If we're in the chat with this person, add the message
      if (selectedConversation && message.senderId === selectedConversation.id) {
        const newMessage = {
          id: message.id,
          senderId: message.senderId,
          text: message.text,
          timestamp: message.time,
          isMe: false,
        };
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
      
      // Refresh conversations to update last message
      loadConversations();
    });

    // Listen for typing events
    socketService.onUserTyping(({ userId }) => {
      if (selectedConversation && userId === selectedConversation.id) {
        setIsTyping(true);
      }
    });

    socketService.onUserStopTyping(({ userId }) => {
      if (selectedConversation && userId === selectedConversation.id) {
        setIsTyping(false);
      }
    });

    return () => {
      socketService.offNewMessage();
      socketService.offTypingEvents();
    };
  }, [selectedConversation]);

  // Handle typing indicator
  const handleTyping = (text) => {
    setMessageText(text);
    
    if (selectedConversation && text.trim()) {
      socketService.emitTyping(user.id, selectedConversation.id);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emitStopTyping(user.id, selectedConversation.id);
      }, 2000);
    } else if (selectedConversation) {
      socketService.emitStopTyping(user.id, selectedConversation.id);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        const formattedConversations = data.conversations.map(conv => ({
          id: conv.id,
          name: conv.name,
          avatar: conv.avatar,
          lastMessage: conv.lastMessage,
          timestamp: getRelativeTime(conv.createdAt),
          unread: conv.unread,
          online: conv.online,
        }));
        
        setConversations(formattedConversations);
        
        // Update unread count
        const totalUnread = formattedConversations.reduce((sum, conv) => sum + conv.unread, 0);
        onUpdateUnread?.(totalUnread);
      } else {
        console.error("Failed to load conversations:", data.message);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      Alert.alert("Error", "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/messages/${conversationId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          text: msg.text,
          timestamp: msg.time,
          isMe: msg.sender === "me",
        }));
        
        setMessages(formattedMessages);
        
        // Mark messages as read
        await markMessagesAsRead(conversationId);
      } else {
        console.error("Failed to load messages:", data.message);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    try {
      await fetch(`${API_URL}/api/messages/${conversationId}/read`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setView("chat");
    loadMessages(conversation.id);
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversation.id ? { ...conv, unread: 0 } : conv
    );
    setConversations(updatedConversations);
    const totalUnread = updatedConversations.reduce((sum, conv) => sum + conv.unread, 0);
    onUpdateUnread?.(totalUnread);
  };

  const handleBack = () => {
    setView("list");
    setSelectedConversation(null);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (messageText.trim() === "") return;

    // Stop typing indicator
    if (selectedConversation) {
      socketService.emitStopTyping(user.id, selectedConversation.id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/messages/${selectedConversation.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: messageText.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        const newMessage = {
          id: data.message.id,
          senderId: data.message.senderId,
          text: data.message.text,
          timestamp: data.message.time,
          isMe: true,
        };

        setMessages([...messages, newMessage]);
        setMessageText("");
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        
        // Refresh conversations to update last message
        loadConversations();
      } else {
        Alert.alert("Error", "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity style={styles.conversationItem} onPress={() => handleSelectConversation(item)} activeOpacity={0.8}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color="#FFFFFF" />
        </View>
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.conversationTime}>{item.timestamp}</Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text style={[styles.lastMessage, item.unread > 0 && { fontWeight: "600", color: "#424242" }]} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => (
    <View style={[styles.messageRow, item.isMe && styles.messageRowMe]}>
      {!item.isMe && (
        <View style={styles.messageAvatar}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </View>
      )}
      <View style={[styles.messageBubbleContainer, item.isMe && styles.messageBubbleMe]}>
        <Text style={[styles.messageText, item.isMe && styles.messageTextMe]}>{item.text}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Text style={[styles.messageTime, item.isMe && styles.messageTimeMe]}>{item.timestamp}</Text>
          {item.isMe && (
            <Ionicons 
              name="checkmark-done" 
              size={14} 
              color="rgba(255,255,255,0.8)" 
              style={{ marginLeft: 4 }} 
            />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#2E7D32", "#43A047"]} style={styles.header}>
        <View style={styles.headerContent}>
          {view === "chat" && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitle}>
            {view === "list" ? (
              <>
                <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
                <Text style={styles.headerText}>Messages</Text>
              </>
            ) : (
              <>
                <View style={styles.chatHeaderAvatar}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.headerText}>{selectedConversation?.name}</Text>
                  {selectedConversation?.online && <Text style={styles.onlineText}>Online</Text>}
                </View>
              </>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {view === "list" ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.conversationList}
          contentContainerStyle={styles.conversationListContent}
          refreshing={loading}
          onRefresh={loadConversations}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={80} color="#C8E6C9" />
              </View>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                Start messaging with other users to see your conversations here
              </Text>
            </View>
          }
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingIndicator}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
              <Text style={styles.typingText}>{selectedConversation?.name} is typing...</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#9E9E9E"
              value={messageText}
              onChangeText={handleTyping}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, messageText.trim() === "" && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={messageText.trim() === ""}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={20} color={messageText.trim() === "" ? "#BDBDBD" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", zIndex: 1000 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", marginRight: 8 },
  headerTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  headerText: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  closeButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", marginLeft: 8 },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  onlineText: { fontSize: 11, color: "#C8E6C9", marginTop: 2, fontWeight: "500" },
  
  // Conversation List Styles
  conversationList: { flex: 1, backgroundColor: "#F8F9FA" },
  conversationListContent: { paddingVertical: 4 },
  conversationItem: { flexDirection: "row", padding: 16, backgroundColor: "#FFFFFF", marginHorizontal: 8, marginVertical: 4, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  avatarContainer: { position: "relative", marginRight: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center", shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  onlineIndicator: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#4CAF50", borderWidth: 3, borderColor: "#FFFFFF" },
  conversationContent: { flex: 1, justifyContent: "center" },
  conversationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  conversationName: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", letterSpacing: 0.2 },
  conversationTime: { fontSize: 11, color: "#9E9E9E", fontWeight: "500" },
  conversationFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lastMessage: { flex: 1, fontSize: 14, color: "#616161", marginRight: 8, lineHeight: 18 },
  unreadBadge: { backgroundColor: "#2E7D32", borderRadius: 12, minWidth: 22, height: 22, justifyContent: "center", alignItems: "center", paddingHorizontal: 7, shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 3 },
  unreadText: { fontSize: 11, fontWeight: "bold", color: "#FFFFFF" },
  
  // Chat View Styles
  chatContainer: { flex: 1, backgroundColor: "#E8F5E9" },
  messagesList: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: "row", marginBottom: 16, alignItems: "flex-end", maxWidth: "85%" },
  messageRowMe: { justifyContent: "flex-end", alignSelf: "flex-end" },
  messageAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center", marginRight: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  messageBubbleContainer: { maxWidth: "100%", backgroundColor: "#FFFFFF", borderRadius: 18, borderBottomLeftRadius: 6, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  messageBubbleMe: { backgroundColor: "#2E7D32", borderBottomLeftRadius: 18, borderBottomRightRadius: 6, shadowColor: "#2E7D32", shadowOpacity: 0.3 },
  messageText: { fontSize: 15, color: "#212121", lineHeight: 22, letterSpacing: 0.2 },
  messageTextMe: { color: "#FFFFFF" },
  messageTime: { fontSize: 10, color: "#BDBDBD", marginTop: 6, alignSelf: "flex-end", fontWeight: "500" },
  messageTimeMe: { color: "rgba(255,255,255,0.8)" },
  
  // Input Styles
  inputContainer: { flexDirection: "row", padding: 14, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E0E0E0", alignItems: "flex-end", shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 5 },
  input: { flex: 1, backgroundColor: "#F5F5F5", borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: "#212121", maxHeight: 100, marginRight: 10, borderWidth: 1, borderColor: "#E0E0E0" },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center", shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 5 },
  sendButtonDisabled: { backgroundColor: "#E0E0E0", shadowOpacity: 0.1 },
  
  // Empty State
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 140, height: 140, borderRadius: 70, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", marginBottom: 20, shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  emptyText: { fontSize: 20, fontWeight: "700", color: "#424242", marginTop: 20, textAlign: "center" },
  emptySubtext: { fontSize: 14, color: "#9E9E9E", marginTop: 10, textAlign: "center", lineHeight: 20 },
  
  // Typing Indicator
  typingIndicator: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.95)", marginHorizontal: 16, marginBottom: 8, borderRadius: 20, alignSelf: "flex-start", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  typingDots: { flexDirection: "row", alignItems: "center", marginRight: 10 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2E7D32", marginHorizontal: 2 },
  typingDot1: { opacity: 0.4 },
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.8 },
  typingText: { fontSize: 13, color: "#616161", fontStyle: "italic", fontWeight: "500" },
});
