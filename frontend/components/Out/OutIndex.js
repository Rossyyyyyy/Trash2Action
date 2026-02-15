import { Text, View, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal, Animated, Image } from "react-native";
import { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

// Placeholder Register Components (keep these for now)
function UserRegister({ onBack, onLogin }) {
  return (
    <View style={styles.authContainer}>
      <Text style={styles.authTitle}>Community User Register</Text>
      <Text style={styles.authSubtitle}>This screen is under development</Text>
      <TouchableOpacity style={styles.authButton} onPress={onBack}>
        <Text style={styles.authButtonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.authLinkButton} onPress={onLogin}>
        <Text style={styles.authLinkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

function ResponderLogin({ onBack, onRegister }) {
  return (
    <View style={styles.authContainer}>
      <Text style={styles.authTitle}>Responder Login</Text>
      <Text style={styles.authSubtitle}>This screen is under development</Text>
      <TouchableOpacity style={styles.authButton} onPress={onBack}>
        <Text style={styles.authButtonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.authLinkButton} onPress={onRegister}>
        <Text style={styles.authLinkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

function ResponderRegister({ onBack, onLogin }) {
  return (
    <View style={styles.authContainer}>
      <Text style={styles.authTitle}>Responder Register</Text>
      <Text style={styles.authSubtitle}>This screen is under development</Text>
      <TouchableOpacity style={styles.authButton} onPress={onBack}>
        <Text style={styles.authButtonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.authLinkButton} onPress={onLogin}>
        <Text style={styles.authLinkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Home({ navigation }) {
  const [activeTab, setActiveTab] = useState("home");
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef([...Array(4)].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(30),
    scale: new Animated.Value(0.9),
  }))).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Staggered card animations
    const animations = cardAnimations.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 500,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 500,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          friction: 5,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(100, animations).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Handle user type selection
  const handleUserTypeSelect = (type) => {
    setShowUserTypeModal(false);
    if (type === "community") {
      navigation.navigate("UserLogin");
    } else if (type === "responder") {
      navigation.navigate("ResponderLogin");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              <Animated.View 
                style={[
                  styles.header,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                  }
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <MaterialCommunityIcons name="recycle" size={64} color="#2E7D32" />
                </Animated.View>
                <Text style={styles.headerTitle}>Trash2Action</Text>
                <Text style={styles.headerSubtitle}>Community-Driven Creek Protection System</Text>
              </Animated.View>

              {/* Hero Banner */}
              <Animated.View 
                style={[
                  styles.heroBanner,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <LinearGradient
                  colors={["#1B5E20", "#2E7D32", "#43A047"]}
                  style={styles.heroBannerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="water" size={48} color="#FFFFFF" />
                  <Text style={styles.heroBannerText}>Protecting Our Waterways Together</Text>
                  <Text style={styles.heroBannerSubtext}>Clean creeks, healthier communities</Text>
                </LinearGradient>
              </Animated.View>

              {/* System Information Card */}
              <Animated.View 
                style={[
                  styles.card,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                  }
                ]}
              >
                <Text style={styles.cardTitle}>About Our System</Text>
                <Text style={styles.cardDescription}>
                  Trash2Action is an innovative environmental monitoring platform designed to empower 
                  barangay communities in protecting local waterways from illegal dumping. Our system 
                  connects residents with local responders to address environmental violations quickly 
                  and effectively.
                </Text>
              </Animated.View>

              {/* Feature Cards */}
              <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>How It Works</Text>
                
                {[
                  {
                    icon: "location",
                    iconType: "ionicon",
                    title: "Real-Time Location Tracking",
                    desc: "Pinpoint exact locations of illegal dumping sites using GPS technology",
                    gradient: ["#4CAF50", "#66BB6A"],
                  },
                  {
                    icon: "camera-outline",
                    iconType: "ionicon",
                    title: "Photo Documentation",
                    desc: "Capture and submit photo evidence of environmental violations instantly",
                    gradient: ["#2E7D32", "#43A047"],
                  },
                  {
                    icon: "account-group",
                    iconType: "material",
                    title: "Community Collaboration",
                    desc: "Connect with local responders and track cleanup progress together",
                    gradient: ["#1B5E20", "#2E7D32"],
                  },
                  {
                    icon: "chart-line",
                    iconType: "fontawesome",
                    title: "Progress Monitoring",
                    desc: "View statistics and track the impact of community efforts in real-time",
                    gradient: ["#388E3C", "#4CAF50"],
                  }
                ].map((feature, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      {
                        opacity: cardAnimations[index].opacity,
                        transform: [
                          { translateY: cardAnimations[index].translateY },
                          { scale: cardAnimations[index].scale }
                        ]
                      }
                    ]}
                  >
                    <View style={styles.featureCard}>
                      <LinearGradient
                        colors={feature.gradient}
                        style={styles.featureIconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {feature.iconType === "ionicon" && (
                          <Ionicons name={feature.icon} size={40} color="#FFFFFF" />
                        )}
                        {feature.iconType === "material" && (
                          <MaterialCommunityIcons name={feature.icon} size={40} color="#FFFFFF" />
                        )}
                        {feature.iconType === "fontawesome" && (
                          <FontAwesome5 name={feature.icon} size={36} color="#FFFFFF" />
                        )}
                      </LinearGradient>
                      <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDesc}>{feature.desc}</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>

              {/* Login Button */}
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }}
              >
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => setShowUserTypeModal(true)}
                >
                  <Ionicons name="log-in-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Get Started - Login</Text>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.bottomSpacer} />
            </View>
          </ScrollView>
        );

      case "about":
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              <Animated.View 
                style={[
                  styles.header,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                  }
                ]}
              >
                <Ionicons name="information-circle" size={48} color="#2E7D32" />
                <Text style={styles.headerTitle}>About Us</Text>
                <Text style={styles.headerSubtitle}>Our Mission & Values</Text>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.aboutSection,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <Text style={styles.sectionTitle}>Our Mission</Text>
                <Text style={styles.aboutText}>
                  Trash2Action is a community-driven initiative to protect our waterways from illegal dumping. 
                  We empower barangay residents to report and track environmental violations in real-time.
                </Text>

                <Text style={styles.sectionTitle}>What We Do</Text>
                <View style={styles.featureList}>
                  <Animated.View 
                    style={[
                      styles.featureRow,
                      {
                        opacity: cardAnimations[0].opacity,
                        transform: [{ translateX: cardAnimations[0].translateY }]
                      }
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                    <Text style={styles.featureText}>Enable quick photo reporting</Text>
                  </Animated.View>
                  <Animated.View 
                    style={[
                      styles.featureRow,
                      {
                        opacity: cardAnimations[1].opacity,
                        transform: [{ translateX: cardAnimations[1].translateY }]
                      }
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                    <Text style={styles.featureText}>GPS location tracking</Text>
                  </Animated.View>
                  <Animated.View 
                    style={[
                      styles.featureRow,
                      {
                        opacity: cardAnimations[2].opacity,
                        transform: [{ translateX: cardAnimations[2].translateY }]
                      }
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                    <Text style={styles.featureText}>Community collaboration</Text>
                  </Animated.View>
                  <Animated.View 
                    style={[
                      styles.featureRow,
                      {
                        opacity: cardAnimations[3].opacity,
                        transform: [{ translateX: cardAnimations[3].translateY }]
                      }
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                    <Text style={styles.featureText}>Track cleanup progress</Text>
                  </Animated.View>
                </View>

                <Text style={styles.sectionTitle}>Our Impact</Text>
                <Text style={styles.aboutText}>
                  Join thousands of community members working together to keep our creeks and canals 
                  clean. Together, we can make a lasting impact on our environment and create a 
                  healthier community for everyone.
                </Text>
              </Animated.View>

              <View style={styles.bottomSpacer} />
            </View>
          </ScrollView>
        );

      case "team":
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              <Animated.View 
                style={[
                  styles.header,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                  }
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="people" size={48} color="#2E7D32" />
                </Animated.View>
                <Text style={styles.headerTitle}>Our Team</Text>
                <Text style={styles.headerSubtitle}>TUP Taguig - Dedicated to Environmental Protection</Text>
              </Animated.View>

              <View style={styles.teamSection}>
                {/* Team Members */}
                <Animated.View
                  style={[
                    {
                      opacity: cardAnimations[0].opacity,
                      transform: [
                        { translateY: cardAnimations[0].translateY },
                        { scale: cardAnimations[0].scale }
                      ]
                    }
                  ]}
                >
                  <View style={styles.teamMemberCard}>
                    <Image 
                      source={require('../../assets/images/anoos.png')}
                      style={styles.teamPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.teamMemberInfo}>
                      <Text style={styles.teamMemberName}>Roschel Mae E. Ano-os</Text>
                      <Text style={styles.teamMemberRole}>Project Lead, Full Stack Developer</Text>
                      <View style={styles.teamMemberBadge}>
                        <Ionicons name="code-slash" size={16} color="#2E7D32" />
                        <Text style={styles.badgeText}>Lead Developer</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    {
                      opacity: cardAnimations[1].opacity,
                      transform: [
                        { translateY: cardAnimations[1].translateY },
                        { scale: cardAnimations[1].scale }
                      ]
                    }
                  ]}
                >
                  <View style={styles.teamMemberCard}>
                    <Image 
                      source={require('../../assets/images/aldy.png')}
                      style={styles.teamPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.teamMemberInfo}>
                      <Text style={styles.teamMemberName}>John Aldy Delariman</Text>
                      <Text style={styles.teamMemberRole}>AI Fixer / Tester</Text>
                      <View style={styles.teamMemberBadge}>
                        <Ionicons name="bug" size={16} color="#2E7D32" />
                        <Text style={styles.badgeText}>Quality Assurance</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    {
                      opacity: cardAnimations[2].opacity,
                      transform: [
                        { translateY: cardAnimations[2].translateY },
                        { scale: cardAnimations[2].scale }
                      ]
                    }
                  ]}
                >
                  <View style={styles.teamMemberCard}>
                    <Image 
                      source={require('../../assets/images/cabria.png')}
                      style={styles.teamPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.teamMemberInfo}>
                      <Text style={styles.teamMemberName}>Zhaira Mhea Cabria</Text>
                      <Text style={styles.teamMemberRole}>Documentation Specialist</Text>
                      <View style={styles.teamMemberBadge}>
                        <Ionicons name="document-text" size={16} color="#2E7D32" />
                        <Text style={styles.badgeText}>Chapter 1-5 Lead</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    {
                      opacity: cardAnimations[3].opacity,
                      transform: [
                        { translateY: cardAnimations[3].translateY },
                        { scale: cardAnimations[3].scale }
                      ]
                    }
                  ]}
                >
                  <View style={styles.teamMemberCard}>
                    <Image 
                      source={require('../../assets/images/Jm.png')}
                      style={styles.teamPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.teamMemberInfo}>
                      <Text style={styles.teamMemberName}>John Meynard Legayada</Text>
                      <Text style={styles.teamMemberRole}>Documentation Assistant</Text>
                      <View style={styles.teamMemberBadge}>
                        <Ionicons name="document" size={16} color="#2E7D32" />
                        <Text style={styles.badgeText}>Chapter 1-5 Support</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>

                {/* Adviser Section */}
                <Animated.View
                  style={[
                    styles.adviserSection,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }]
                    }
                  ]}
                >
                  <Text style={styles.adviserTitle}>Technical Adviser</Text>
                  <View style={styles.adviserCard}>
                    <Image 
                      source={require('../../assets/images/adviser.jpg')}
                      style={styles.adviserPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.adviserInfo}>
                      <Text style={styles.adviserName}>Prof. Joan Mag-isa</Text>
                      <Text style={styles.adviserRole}>Technical Adviser</Text>
                      <View style={styles.adviserBadge}>
                        <Ionicons name="school" size={16} color="#1565C0" />
                        <Text style={styles.adviserBadgeText}>TUP Taguig</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              </View>

              <View style={styles.bottomSpacer} />
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]}
      style={styles.container}
    >
      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      {/* User Type Selection Modal */}
      <Modal
        visible={showUserTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select User Type</Text>
            <Text style={styles.modalSubtitle}>Choose how you want to access the system</Text>

            <TouchableOpacity
              style={styles.userTypeButton}
              onPress={() => handleUserTypeSelect("community")}
            >
              <View style={styles.userTypeIcon}>
                <Ionicons name="people" size={40} color="#2E7D32" />
              </View>
              <View style={styles.userTypeInfo}>
                <Text style={styles.userTypeTitle}>Community User</Text>
                <Text style={styles.userTypeDesc}>Report environmental violations in your area</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userTypeButton}
              onPress={() => handleUserTypeSelect("responder")}
            >
              <View style={styles.userTypeIcon}>
                <MaterialCommunityIcons name="shield-account" size={40} color="#2E7D32" />
              </View>
              <View style={styles.userTypeInfo}>
                <Text style={styles.userTypeTitle}>Responder</Text>
                <Text style={styles.userTypeDesc}>Respond to and manage community reports</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUserTypeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, activeTab === "home" && styles.footerButtonActive]}
          onPress={() => setActiveTab("home")}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeTab === "home" ? "#2E7D32" : "#757575"} 
          />
          <Text style={[
            styles.footerButtonText,
            activeTab === "home" && styles.footerButtonTextActive
          ]}>
            HOME
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, activeTab === "about" && styles.footerButtonActive]}
          onPress={() => setActiveTab("about")}
        >
          <Ionicons 
            name="information-circle" 
            size={24} 
            color={activeTab === "about" ? "#2E7D32" : "#757575"} 
          />
          <Text style={[
            styles.footerButtonText,
            activeTab === "about" && styles.footerButtonTextActive
          ]}>
            ABOUT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, activeTab === "team" && styles.footerButtonActive]}
          onPress={() => setActiveTab("team")}
        >
          <Ionicons 
            name="people" 
            size={24} 
            color={activeTab === "team" ? "#2E7D32" : "#757575"} 
          />
          <Text style={[
            styles.footerButtonText,
            activeTab === "team" && styles.footerButtonTextActive
          ]}>
            TEAM
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#1B5E20",
    marginTop: 5,
    textAlign: "center",
  },
  heroBanner: {
    marginBottom: 25,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  heroBannerGradient: {
    padding: 30,
    alignItems: "center",
  },
  heroBannerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 15,
    marginBottom: 5,
    textAlign: "center",
  },
  heroBannerSubtext: {
    fontSize: 14,
    color: "#E8F5E9",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 22,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    gap: 15,
  },
  featureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 13,
    color: "#424242",
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    gap: 10,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomSpacer: {
    height: 20,
  },
  aboutSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aboutText: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 22,
    marginBottom: 15,
  },
  featureList: {
    marginTop: 10,
    marginBottom: 15,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#424242",
    flex: 1,
  },
  teamSection: {
    gap: 20,
  },
  teamMemberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    gap: 15,
  },
  teamPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#2E7D32",
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  teamMemberRole: {
    fontSize: 13,
    color: "#424242",
    marginBottom: 8,
    lineHeight: 18,
  },
  teamMemberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 5,
  },
  badgeText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
  },
  adviserSection: {
    marginTop: 20,
  },
  adviserTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: 15,
    textAlign: "center",
  },
  adviserCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1565C0",
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    gap: 15,
  },
  adviserPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#1565C0",
  },
  adviserInfo: {
    flex: 1,
  },
  adviserName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: 4,
  },
  adviserRole: {
    fontSize: 14,
    color: "#424242",
    marginBottom: 8,
  },
  adviserBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 101, 192, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 5,
  },
  adviserBadgeText: {
    fontSize: 11,
    color: "#1565C0",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 25,
  },
  userTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  userTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userTypeInfo: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  userTypeDesc: {
    fontSize: 12,
    color: "#757575",
    lineHeight: 16,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#757575",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  footerButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  footerButtonActive: {
    borderTopWidth: 3,
    borderTopColor: "#2E7D32",
  },
  footerButtonText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
    fontWeight: "600",
  },
  footerButtonTextActive: {
    color: "#2E7D32",
  },
  // Auth screen styles (for placeholders)
  authContainer: {
    flex: 1,
    backgroundColor: "#EAF7F1",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 30,
    textAlign: "center",
  },
  authButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  authLinkButton: {
    padding: 10,
  },
  authLinkText: {
    color: "#2E7D32",
    fontSize: 14,
  },
});