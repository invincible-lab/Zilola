import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get("window");

type TestResult = {
  id: string;
  date: string;
  score: number;
  total?: number;
  correct?: number;
  testTitle?: string;
  category?: string;
};

type CourseProgress = {
  id: string;
  title: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  lastAccessed?: string;
  category?: string;
};

type DailyActivity = {
  date: string;
  lessonsCompleted: number;
  testsTaken: number;
  timeSpent: number; // minutes
  points: number;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
};

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // AsyncStorage keys
  const KEY_USER = "user_name";
  const KEY_COURSES = "courses_progress";
  const KEY_TESTS = "tests_results";
  const KEY_DAILY = "daily_activities";
  const KEY_ACHIEVEMENTS = "achievements";

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, c, t, d, a] = await Promise.all([
        AsyncStorage.getItem(KEY_USER),
        AsyncStorage.getItem(KEY_COURSES),
        AsyncStorage.getItem(KEY_TESTS),
        AsyncStorage.getItem(KEY_DAILY),
        AsyncStorage.getItem(KEY_ACHIEVEMENTS),
      ]);

      setUserName(u);
      setCourses(c ? JSON.parse(c) : []);
      setTests(t ? JSON.parse(t).sort((a: TestResult, b: TestResult) => 
        +new Date(b.date) - +new Date(a.date)) : []);
      setDailyActivities(d ? JSON.parse(d) : generateMockDailyActivities());
      setAchievements(a ? JSON.parse(a) : generateMockAchievements());

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.warn("Stats load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mock data generator for initial load
  const generateMockDailyActivities = (): DailyActivity[] => {
    const activities: DailyActivity[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      activities.push({
        date: date.toISOString(),
        lessonsCompleted: Math.floor(Math.random() * 5),
        testsTaken: Math.floor(Math.random() * 3),
        timeSpent: Math.floor(Math.random() * 120) + 30,
        points: Math.floor(Math.random() * 200) + 50,
      });
    }
    return activities;
  };

  const generateMockAchievements = (): Achievement[] => {
    return [
      { id: "1", title: "Birinchi qadam", description: "Birinchi darsni tugatdingiz", icon: "star-outline", unlocked: true, unlockedAt: new Date().toISOString() },
      { id: "2", title: "Tezkor o‘quvchi", description: "Bir kunda 5+ dars tugatish", icon: "flash-outline", unlocked: false, progress: 3, target: 5 },
      { id: "3", title: "Test ustasi", description: "10 ta test topshirish", icon: "trophy-outline", unlocked: false, progress: 4, target: 10 },
      { id: "4", title: "Marafonchi", description: "7 kun ketma-ket o‘qish", icon: "calendar-outline", unlocked: false, progress: 3, target: 7 },
      { id: "5", title: "100%", description: "Biror kursni to‘liq tugatish", icon: "ribbon-outline", unlocked: false },
    ];
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Today's statistics
  const today = new Date().toISOString().split('T')[0];
  const todayActivity = dailyActivities.find(d => d.date.split('T')[0] === today);
  
  const todayLessons = todayActivity?.lessonsCompleted || 0;
  const todayTests = todayActivity?.testsTaken || 0;
  const todayTime = todayActivity?.timeSpent || 0;
  const todayPoints = todayActivity?.points || 0;

  // General statistics
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.lessonsCompleted >= c.lessonsTotal && c.lessonsTotal > 0).length;
  const totalLessonsCompleted = courses.reduce((s, c) => s + (c.lessonsCompleted || 0), 0);
  const totalLessons = courses.reduce((s, c) => s + (c.lessonsTotal || 0), 0);
  const progressPercent = totalLessons === 0 ? 0 : Math.round((totalLessonsCompleted / totalLessons) * 100);
  
  const testsCount = tests.length;
  const avgScore = testsCount === 0 ? 0 : Math.round(tests.reduce((s, t) => s + (t.score || 0), 0) / testsCount);
  const bestScore = tests.length > 0 ? Math.max(...tests.map(t => t.score)) : 0;

  // Weekly statistics
  const last7Days = dailyActivities.slice(0, 7);
  const weeklyLessons = last7Days.reduce((s, d) => s + d.lessonsCompleted, 0);
  const weeklyTests = last7Days.reduce((s, d) => s + d.testsTaken, 0);
  const weeklyTime = last7Days.reduce((s, d) => s + d.timeSpent, 0);
  const weeklyPoints = last7Days.reduce((s, d) => s + d.points, 0);

  // Streak calculation
  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < dailyActivities.length; i++) {
      const activityDate = new Date(dailyActivities[i].date);
      activityDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === streak && (dailyActivities[i].lessonsCompleted > 0 || dailyActivities[i].testsTaken > 0)) {
        streak++;
      } else if (dayDiff > streak) {
        break;
      }
    }
    return streak;
  };
  
  const currentStreak = calculateStreak();

  const resetStats = () => {
    Alert.alert(
      "Statistikani tozalash",
      "Barcha statistika va yutuqlar o‘chirilsinmi? Bu qaytarib bo‘lmaydi.",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O‘chirilsin",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([KEY_COURSES, KEY_TESTS, KEY_DAILY, KEY_ACHIEVEMENTS]);
              setCourses([]);
              setTests([]);
              setDailyActivities(generateMockDailyActivities());
              setAchievements(generateMockAchievements());
              Alert.alert("Tayyor", "Statistika o‘chirib tashlandi.");
            } catch (err) {
              Alert.alert("Xato", "Statistikani o‘chirishda xato yuz berdi.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Statistika yuklanmoqda...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.background} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📊 Statistika</Text>
              <Text style={styles.subtitle}>
                {userName ? `${userName}ning yutuqlari` : "Sizning yutuqlaringiz"}
              </Text>
            </View>
            <TouchableOpacity style={styles.reloadBtn} onPress={loadAll}>
              <Ionicons name="sync-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Today's Stats Card */}
          <LinearGradient
            colors={["#FF6B6B", "#EE5A5A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.todayCard}
          >
            <Text style={styles.todayTitle}>📅 Bugungi faollik</Text>
            <View style={styles.todayStats}>
              <View style={styles.todayStat}>
                <Ionicons name="book-outline" size={24} color="#fff" />
                <Text style={styles.todayStatValue}>{todayLessons}</Text>
                <Text style={styles.todayStatLabel}>Dars</Text>
              </View>
              <View style={styles.todayStat}>
                <Ionicons name="checkbox-outline" size={24} color="#fff" />
                <Text style={styles.todayStatValue}>{todayTests}</Text>
                <Text style={styles.todayStatLabel}>Test</Text>
              </View>
              <View style={styles.todayStat}>
                <Ionicons name="time-outline" size={24} color="#fff" />
                <Text style={styles.todayStatValue}>{formatTime(todayTime)}</Text>
                <Text style={styles.todayStatLabel}>Vaqt</Text>
              </View>
              <View style={styles.todayStat}>
                <Ionicons name="star-outline" size={24} color="#fff" />
                <Text style={styles.todayStatValue}>{todayPoints}</Text>
                <Text style={styles.todayStatLabel}>Ball</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Main Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.statGradient}>
                <Ionicons name="trending-up" size={30} color="#fff" />
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Kunlik streak</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient colors={["#50C878", "#3DA8D0"]} style={styles.statGradient}>
                <Ionicons name="checkmark-circle" size={30} color="#fff" />
                <Text style={styles.statValue}>{progressPercent}%</Text>
                <Text style={styles.statLabel}>Umumiy progress</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient colors={["#FFA500", "#FF6347"]} style={styles.statGradient}>
                <Ionicons name="trophy" size={30} color="#fff" />
                <Text style={styles.statValue}>{avgScore}%</Text>
                <Text style={styles.statLabel}>O‘rtacha ball</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Weekly Summary */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📈 Haftalik statistika</Text>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyValue}>{weeklyLessons}</Text>
                <Text style={styles.weeklyLabel}>Dars</Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyValue}>{weeklyTests}</Text>
                <Text style={styles.weeklyLabel}>Test</Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyValue}>{formatTime(weeklyTime)}</Text>
                <Text style={styles.weeklyLabel}>Vaqt</Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyItem}>
                <Text style={styles.weeklyValue}>{weeklyPoints}</Text>
                <Text style={styles.weeklyLabel}>Ball</Text>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🏆 Yutuqlar</Text>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View style={[
                  styles.achievementIcon,
                  achievement.unlocked && styles.achievementUnlocked
                ]}>
                  <Ionicons 
                    name={achievement.icon as any} 
                    size={24} 
                    color={achievement.unlocked ? "#FFD700" : "#9CA3AF"} 
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  {achievement.progress !== undefined && (
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${(achievement.progress / (achievement.target || 1)) * 100}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{achievement.progress}/{achievement.target}</Text>
                    </View>
                  )}
                </View>
                {achievement.unlocked && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </View>
            ))}
          </View>

          {/* Recent Tests */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📝 So‘nggi testlar</Text>
            {tests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={50} color="#9CA3AF" />
                <Text style={styles.emptyText}>Siz hali test topshirmagansiz</Text>
              </View>
            ) : (
              tests.slice(0, 5).map((test) => (
                <View key={test.id} style={styles.testItem}>
                  <View style={styles.testInfo}>
                    <Text style={styles.testTitle}>{test.testTitle || "Test"}</Text>
                    <Text style={styles.testDate}>{formatDate(test.date)}</Text>
                  </View>
                  <View style={[styles.testScoreBadge, { backgroundColor: test.score >= 70 ? "#10B981" : "#F59E0B" }]}>
                    <Text style={styles.testScore}>{test.score}%</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Courses Progress */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📚 Kurslar progressi</Text>
            {courses.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="library-outline" size={50} color="#9CA3AF" />
                <Text style={styles.emptyText}>Siz hali kurs boshlamagansiz</Text>
              </View>
            ) : (
              courses.map((course) => {
                const pct = course.lessonsTotal === 0 ? 0 : Math.round((course.lessonsCompleted / course.lessonsTotal) * 100);
                return (
                  <View key={course.id} style={styles.courseItem}>
                    <View style={styles.courseHeader}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.coursePercent}>{pct}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: pct === 100 ? "#10B981" : "#667eea" }]} />
                    </View>
                    <Text style={styles.courseDetail}>{course.lessonsCompleted}/{course.lessonsTotal} dars</Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Reset Button */}
          <TouchableOpacity style={styles.resetBtn} onPress={resetStats}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.resetText}>Statistikani tozalash</Text>
          </TouchableOpacity>
          
          <View style={styles.footer} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#667eea",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  container: {
    padding: 16,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  reloadBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 12,
  },
  todayCard: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  todayStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  todayStat: {
    alignItems: "center",
  },
  todayStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 6,
  },
  todayStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  sectionCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  weeklyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  weeklyItem: {
    alignItems: "center",
    flex: 1,
  },
  weeklyValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#667eea",
  },
  weeklyLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  weeklyDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  achievementUnlocked: {
    backgroundColor: "#FEF3C7",
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  achievementDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
  },
  progressText: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  testItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  testDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  testScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  testScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  courseItem: {
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
  },
  coursePercent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  courseDetail: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 6,
  },
  emptyBox: {
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  resetBtn: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  resetText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    height: 40,
  },
});