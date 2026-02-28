import { io } from "socket.io-client";
import { API_URL } from "../config";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userId) {
    if (this.socket && this.connected) {
      console.log("Socket already connected");
      return;
    }

    // Extract base URL - remove /api if present
    let baseURL = API_URL;
    if (baseURL.endsWith('/api')) {
      baseURL = baseURL.slice(0, -4);
    }
    
    console.log("🔌 Connecting to Socket.IO at:", baseURL);
    
    this.socket = io(baseURL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
      this.connected = true;
      
      // Join user's room
      if (userId) {
        this.socket.emit("join", userId);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      this.connected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log("Socket disconnected manually");
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  // Remove message listener
  offNewMessage() {
    if (this.socket) {
      this.socket.off("new_message");
    }
  }

  // Emit typing event
  emitTyping(senderId, receiverId) {
    if (this.socket && this.connected) {
      this.socket.emit("typing", { senderId, receiverId });
    }
  }

  // Emit stop typing event
  emitStopTyping(senderId, receiverId) {
    if (this.socket && this.connected) {
      this.socket.emit("stop_typing", { senderId, receiverId });
    }
  }

  // Listen for typing events
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  // Listen for stop typing events
  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on("user_stop_typing", callback);
    }
  }

  // Remove typing listeners
  offTypingEvents() {
    if (this.socket) {
      this.socket.off("user_typing");
      this.socket.off("user_stop_typing");
    }
  }

  // Listen for new notifications
  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on("new_notification", callback);
    }
  }

  // Remove notification listener
  offNewNotification() {
    if (this.socket) {
      this.socket.off("new_notification");
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
export default new SocketService();
