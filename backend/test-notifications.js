// Test script for notification endpoints
const API_URL = "http://localhost:5000";

async function testNotifications() {
  try {
    console.log("Testing notification endpoint...");
    
    // Test with dummy data
    const response = await fetch(
      `${API_URL}/api/notifications?userId=507f1f77bcf86cd799439011&userType=responder`
    );
    
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers.get("content-type"));
    
    const text = await response.text();
    console.log("Response body:", text);
    
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:", json);
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

testNotifications();
