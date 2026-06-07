import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // ✅ Tuzatildi: vector-icons
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [menuItems] = React.useState([
    {
      id: 1,
      title: "Video Darslik",
      route: "/home",
      icon: "videocam-outline" as const,
      gradient: ["#FF6B6B", "#EE5A5A"] as const,
      description: "Interaktiv video darslar",
    },
    
    {
      id: 3,
      title: "Masalalar Bazasi",
      route: "/book",
      icon: "desktop-outline" as const,
      gradient: ["#4D96FF", "#357ABD"] as const,
      description: "1000+ amaliy masalalar",
    },
    {
      id: 4,
      title: "Testlar & Quiz",
      route: "/test",
      icon: "checkbox-outline" as const,
      gradient: ["#FFD93D", "#F4C430"] as const,
      description: "Bilimingizni sinab ko‘ring",
    },
    {
      id: 5,
      title: "Statistika",
      route: "/stats",
      icon: "stats-chart-outline" as const,
      gradient: ["#A959FF", "#8B3EE4"] as const,
      description: "Yutuqlaringizni kuzating",
    },
    {
      id: 6,
      title: "Sertifikatlar",
      route: "/expo",
      icon: "ribbon-outline" as const,
      gradient: ["#00D2FF", "#3A7BD5"] as const,
      description: "Yutuqlaringizni tasdiqlang",
    },
  ]);

  const renderMenuItem = (item: typeof menuItems[0], index: number) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const translateY = React.useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.92,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.spring(translateY, {
          toValue: -5,
          useNativeDriver: true,
          friction: 5,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 5,
        }),
      ]).start();
    };

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.menuItemWrapper,
          {
            transform: [{ scale: scaleAnim }, { translateY }],
            opacity: scaleAnim.interpolate({
              inputRange: [0.92, 1],
              outputRange: [0.7, 1],
            }),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => router.push(item.route as any)}
          style={styles.touchable}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuCard}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={42} color="#FFFFFF" />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward-outline" size={20} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2027" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Background Gradient */}
        <LinearGradient
          colors={["#0F2027", "#203A43", "#2C5364"]}
          style={styles.background}
        />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Salom, Talaba!</Text>
            <View style={styles.universityBadge}>
              <Ionicons name="school-outline" size={18} color="#fff" />
              <Text style={styles.universityText}>NDTU</Text>
            </View>
          </View>

          <View style={styles.profileCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
              style={styles.profileGradient}
            >
              <Image 
                source={require("../logo_2.jpg")} 
                style={styles.profileImage} 
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Nukus davlat texnika universiteti</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>24</Text>
                    <Text style={styles.statLabel}>Kurslar</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>156</Text>
                    <Text style={styles.statLabel}>Darslar</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>8.9k</Text>
                    <Text style={styles.statLabel}>Talabalar</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Section Title */}
        {/* <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Asosiy menyu</Text>
          <TouchableOpacity onPress={() => router.push("/all-courses")}>
            <Text style={styles.seeAllText}>Barchasi →</Text>
          </TouchableOpacity>
        </View> */}

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F2027",
  },
  scrollContent: {
    flexGrow: 1,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroSection: {
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  greetingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  universityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  universityText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  profileCard: {
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  profileGradient: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    gap: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD93D",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FFD93D",
    fontWeight: "600",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    gap: 12,
  },
  menuItemWrapper: {
    width: (width - 56) / 2,
    marginBottom: 16,
  },
  touchable: {
    width: "100%",
  },
  menuCard: {
    borderRadius: 24,
    overflow: "hidden",
    height: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardContent: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 14,
  },
  arrowContainer: {
    position: "absolute",
    bottom: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  footerSpace: {
    height: 40,
  },
});