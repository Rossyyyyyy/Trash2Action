import { Text, View, StyleSheet, TouchableOpacity, Dimensions, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";

// Navigation
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import Home from "./components/Out/OutIndex";
import UserLogin from "./components/User/UserLogin";
import UserRegister from "./components/User/UserRegister";
import ResponderLogin from "./components/Responders/ResponderLogin";
import ResponderRegister from "./components/Responders/ResponderRegister";
import AdminDashboard from "./components/Responders/Admin/AdminDashboard";
import AdminRequest from "./components/Responders/Admin/AdminRequest";
import AdminNewsfeed from "./components/Responders/Admin/AdminNewsfeed";
import AdminNotif from "./components/Responders/Admin/AdminNotif";
import UserDashboard from "./components/User/Dashboard/UserDashboard";
import UserNF from "./components/User/Dashboard/UserNF";


const Stack = createNativeStackNavigator();
const { width } = Dimensions.get("window");

/* ─────────────────────────────────────────────
   SPLASH SCREEN
───────────────────────────────────────────── */
function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: scaleAnim }, { rotate: spin }] },
          ]}
        >
          <MaterialIcons name="recycling" size={64} color="#2E7D32" />
        </Animated.View>

        <Animated.Text style={[styles.title, { transform: [{ scale: scaleAnim }] }]}>
          Trash2Action
        </Animated.Text>

        <Text style={styles.subtitle}>
          Report trash. Take action. Protect creeks.
        </Text>

        <View style={styles.missionBox}>
          <Text style={styles.missionText}>
            Join your barangay in keeping waterways clean. Report illegal dumping in creeks and canals.
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.replace("Home")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Let's Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.features}>
          <Feature icon="location-sharp" text="Pinpoint Location" />
          <Feature icon="camera" text="Photo Evidence" />
          <Feature icon="rocket" text="Quick Response" />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────────
   FEATURE ICON
───────────────────────────────────────────── */
function Feature({ icon, text }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={26} color="#2E7D32" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="UserLogin" component={UserLogin} />
        <Stack.Screen name="UserRegister" component={UserRegister} />
        <Stack.Screen name="ResponderLogin" component={ResponderLogin} />
        <Stack.Screen name="ResponderRegister" component={ResponderRegister} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminRequest" component={AdminRequest} />
        <Stack.Screen name="AdminNewsfeed" component={AdminNewsfeed} />
        <Stack.Screen name="AdminNotif" component={AdminNotif} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
        <Stack.Screen name="UserNF" component={UserNF} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(46,125,50,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 36, fontWeight: "bold", color: "#2E7D32" },
  subtitle: { fontSize: 18, color: "#1B5E20", marginBottom: 20, textAlign: "center" },
  missionBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  missionText: { textAlign: "center", color: "#424242" },
  button: {
    flexDirection: "row",
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
    gap: 8,
    marginBottom: 30,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  features: { flexDirection: "row", width: "100%", justifyContent: "space-around" },
  featureItem: { alignItems: "center" },
  featureText: { fontSize: 12, color: "#1B5E20", marginTop: 6 },
});