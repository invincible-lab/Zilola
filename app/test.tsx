import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  ProgressBarAndroid,
  Platform,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  duration: number;
  totalPoints: number;
  passingScore: number;
  attempts: number;
  bestScore: number;
  lastAttempt: string | null;
}

interface TestResult {
  testId: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  date: string;
  answers: { questionId: string; selectedAnswer: number; isCorrect: boolean }[];
}

const TESTS_DATA: Test[] = [
  {
    id: "1",
    title: "Kompyuter arxitekturasi asoslari",
    description: "Kompyuterning asosiy qurilmalari va ularning vazifalari haqida test",
    category: "architecture",
    duration: 30,
    totalPoints: 100,
    passingScore: 60,
    attempts: 0,
    bestScore: 0,
    lastAttempt: null,
    questions: [
      {
        id: "q1",
        text: "Kompyuterning markaziy qayta ishlash qurilmasi qanday ataladi?",
        options: ["RAM", "CPU", "GPU", "HDD"],
        correctAnswer: 1,
        explanation: "CPU (Central Processing Unit) kompyuterning miyasi hisoblanadi.",
        category: "hardware",
        difficulty: "easy",
        points: 10,
      },
      {
        id: "q2",
        text: "Operativ xotiraning asosiy vazifasi nima?",
        options: ["Ma'lumotlarni doimiy saqlash", "Ishlayotgan dasturlarni vaqtincha saqlash", "Ma'lumotlarni qayta ishlash", "Grafikani qayta ishlash"],
        correctAnswer: 1,
        explanation: "RAM (Random Access Memory) ishlayotgan dasturlar va ma'lumotlarni vaqtincha saqlaydi.",
        category: "hardware",
        difficulty: "easy",
        points: 10,
      },
      {
        id: "q3",
        text: "Von Neumann arxitekturasining asosiy xususiyati nima?",
        options: ["Ma'lumotlar va dasturlar bir xil xotirada saqlanadi", "Alohida ma'lumotlar va dastur xotirasi", "Parallel hisoblash", "Faqat ma'lumotlarni qayta ishlash"],
        correctAnswer: 0,
        explanation: "Von Neumann arxitekturasida ma'lumotlar va dasturlar bir xil xotirada saqlanadi.",
        category: "architecture",
        difficulty: "medium",
        points: 15,
      },
      {
        id: "q4",
        text: "Cache xotiraning asosiy vazifasi nima?",
        options: ["Ma'lumotlarni arxivlash", "Tez-tez ishlatiladigan ma'lumotlarni saqlash", "Operativ xotirani kengaytirish", "Doimiy saqlash"],
        correctAnswer: 1,
        explanation: "Cache xotira protsessorga tez-tez kerak bo'ladigan ma'lumotlarni tez yetkazib beradi.",
        category: "hardware",
        difficulty: "medium",
        points: 15,
      },
      {
        id: "q5",
        text: "RISC va CISC arxitekturalari orasidagi asosiy farq nima?",
        options: ["Soat chastotasi", "Ko'rsatmalar to'plami murakkabligi", "Xotira hajmi", "Narxi"],
        correctAnswer: 1,
        explanation: "RISC oddiy, tez ko'rsatmalar to'plamiga ega, CISC esa murakkab ko'rsatmalar to'plamiga ega.",
        category: "architecture",
        difficulty: "hard",
        points: 20,
      },
    ],
  },
  {
    id: "2",
    title: "Dasturiy ta'minot evolyutsiyasi",
    description: "Dasturiy ta'minotning rivojlanish tarixi va turlari",
    category: "software",
    duration: 25,
    totalPoints: 100,
    passingScore: 65,
    attempts: 0,
    bestScore: 0,
    lastAttempt: null,
    questions: [
      {
        id: "q6",
        text: "Birinchi dasturlash tili qaysi?",
        options: ["Python", "C", "Assembly", "FORTRAN"],
        correctAnswer: 2,
        explanation: "Assembly tili birinchi dasturlash tillaridan biri hisoblanadi.",
        category: "software",
        difficulty: "easy",
        points: 10,
      },
      {
        id: "q7",
        text: "Operatsion tizimning asosiy vazifasi?",
        options: ["Dasturlarni kompilyatsiya qilish", "Resurslarni boshqarish", "Ma'lumotlar bazasini boshqarish", "Internetga ulanish"],
        correctAnswer: 1,
        explanation: "Operatsion tizim apparat va dasturiy resurslarni boshqaradi.",
        category: "software",
        difficulty: "easy",
        points: 10,
      },
      {
        id: "q8",
        text: "Open Source dasturiy ta'minotning xususiyati?",
        options: ["Pullik litsenziya", "Yopiq kod", "Manba kodi ochiq", "Faqat Windows uchun"],
        correctAnswer: 2,
        explanation: "Open Source dasturlarning manba kodi hamma uchun ochiq.",
        category: "software",
        difficulty: "medium",
        points: 15,
      },
    ],
  },
];

export default function TestScreen() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showResultsModal, setShowResultsModal] = useState(false);
  
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const categories = [
    { id: "all", name: "Barchasi", icon: "apps-outline", color: "#667eea" },
    { id: "architecture", name: "Arxitektura", icon: "layers-outline", color: "#FF6B6B" },
    { id: "software", name: "Dasturiy ta'minot", icon: "code-outline", color: "#6BCB77" },
    { id: "hardware", name: "Qurilmalar", icon: "hardware-chip-outline", color: "#4D96FF" },
  ];

  useEffect(() => {
    loadTests();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      timerInterval.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current!);
            submitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [testStarted]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentQuestionIndex + 1) / (selectedTest?.questions.length || 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex, selectedTest]);

  const loadTests = async () => {
    try {
      const storedTests = await AsyncStorage.getItem("tests");
      if (storedTests) {
        setTests(JSON.parse(storedTests));
      } else {
        setTests(TESTS_DATA);
        await AsyncStorage.setItem("tests", JSON.stringify(TESTS_DATA));
      }
    } catch (error) {
      console.error("Error loading tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTests = async (updatedTests: Test[]) => {
    try {
      await AsyncStorage.setItem("tests", JSON.stringify(updatedTests));
    } catch (error) {
      console.error("Error saving tests:", error);
    }
  };

  const startTest = (test: Test) => {
    setSelectedTest(test);
    setTestStarted(true);
    setTimeRemaining(test.duration * 60);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTestCompleted(false);
    setTestResult(null);
    Vibration.vibrate(100);
  };

  const selectAnswer = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    Vibration.vibrate(50);
  };

  const nextQuestion = () => {
    if (selectedTest && currentQuestionIndex < selectedTest.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      submitTest();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const submitTest = () => {
    if (!selectedTest) return;

    let correctCount = 0;
    const answers: TestResult["answers"] = [];

    selectedTest.questions.forEach((question, index) => {
      const selectedAnswer = selectedAnswers[question.id];
      const isCorrect = selectedAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      answers.push({
        questionId: question.id,
        selectedAnswer: selectedAnswer ?? -1,
        isCorrect,
      });
    });

    const percentage = (correctCount / selectedTest.questions.length) * 100;
    const score = Math.round((correctCount / selectedTest.questions.length) * 100);
    const passed = percentage >= selectedTest.passingScore;

    const result: TestResult = {
      testId: selectedTest.id,
      score: score,
      percentage: percentage,
      correctAnswers: correctCount,
      totalQuestions: selectedTest.questions.length,
      timeSpent: selectedTest.duration * 60 - timeRemaining,
      date: new Date().toISOString(),
      answers: answers,
    };

    setTestResult(result);
    setTestCompleted(true);
    
    // Update test statistics
    const updatedTests = tests.map(test => {
      if (test.id === selectedTest.id) {
        return {
          ...test,
          attempts: test.attempts + 1,
          bestScore: Math.max(test.bestScore, score),
          lastAttempt: new Date().toISOString(),
        };
      }
      return test;
    });
    setTests(updatedTests);
    saveTests(updatedTests);
    
    setShowResultsModal(true);
    if (passed) {
      Vibration.vibrate([500, 200, 500]);
    } else {
      Vibration.vibrate([500, 500]);
    }
  };

  const resetTest = () => {
    setTestStarted(false);
    setSelectedTest(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTestCompleted(false);
    setTestResult(null);
    setShowResultsModal(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case "easy": return "#10B981";
      case "medium": return "#F59E0B";
      case "hard": return "#EF4444";
      default: return "#667eea";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch(difficulty) {
      case "easy": return "Oson";
      case "medium": return "O‘rta";
      case "hard": return "Qiyin";
      default: return difficulty;
    }
  };

  const filteredTests = tests.filter(test => 
    selectedCategory === "all" || test.category === selectedCategory
  );

  const TestCard = ({ test, index }: { test: Test; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.testCard,
          {
            opacity: cardAnim,
            transform: [{
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={["#ffffff", "#f9fafb"]}
          style={styles.testCardGradient}
        >
          <View style={styles.testCardHeader}>
            <View style={[styles.testCategory, { backgroundColor: categories.find(c => c.id === test.category)?.color + "20" }]}>
              <Ionicons 
                name={categories.find(c => c.id === test.category)?.icon as any} 
                size={16} 
                color={categories.find(c => c.id === test.category)?.color} 
              />
              <Text style={[styles.testCategoryText, { color: categories.find(c => c.id === test.category)?.color }]}>
                {categories.find(c => c.id === test.category)?.name}
              </Text>
            </View>
            {test.attempts > 0 && (
              <View style={styles.bestScoreBadge}>
                <Ionicons name="trophy" size={14} color="#FFD700" />
                <Text style={styles.bestScoreText}>Eng yaxshi: {test.bestScore}%</Text>
              </View>
            )}
          </View>

          <Text style={styles.testTitle}>{test.title}</Text>
          <Text style={styles.testDescription}>{test.description}</Text>

          <View style={styles.testStats}>
            <View style={styles.testStat}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.testStatText}>{test.duration} min</Text>
            </View>
            <View style={styles.testStat}>
              <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.testStatText}>{test.questions.length} savol</Text>
            </View>
            <View style={styles.testStat}>
              <Ionicons name="flag-outline" size={16} color="#6B7280" />
              <Text style={styles.testStatText}>O‘tish: {test.passingScore}%</Text>
            </View>
          </View>

          <View style={styles.testFooter}>
            <Text style={styles.attemptsText}>
              {test.attempts > 0 ? `${test.attempts} marta topshirilgan` : "Hali topshirilmagan"}
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => startTest(test)}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Testni boshlash</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const ResultModal = () => (
    <Modal
      visible={showResultsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowResultsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={testResult && testResult.percentage >= (selectedTest?.passingScore || 0) 
              ? ["#10B981", "#059669"] 
              : ["#EF4444", "#DC2626"]}
            style={styles.modalHeader}
          >
            <Ionicons 
              name={testResult && testResult.percentage >= (selectedTest?.passingScore || 0) ? "trophy" : "sad-outline"} 
              size={60} 
              color="#fff" 
            />
            <Text style={styles.modalTitle}>
              {testResult && testResult.percentage >= (selectedTest?.passingScore || 0) 
                ? "Tabriklaymiz!" 
                : "Yaxshiroq tayyorlaning"}
            </Text>
            <Text style={styles.modalSubtitle}>
              Siz {testResult?.correctAnswers}/{testResult?.totalQuestions} to‘g‘ri javob berdingiz
            </Text>
          </LinearGradient>

          <View style={styles.modalBody}>
            <View style={styles.scoreCircle}>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.scoreGradient}
              >
                <Text style={styles.scorePercentage}>{testResult?.percentage.toFixed(0)}%</Text>
                <Text style={styles.scoreLabel}>Umumiy natija</Text>
              </LinearGradient>
            </View>

            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{testResult?.correctAnswers}</Text>
                <Text style={styles.resultStatLabel}>To‘g‘ri javoblar</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{testResult?.totalQuestions - (testResult?.correctAnswers || 0)}</Text>
                <Text style={styles.resultStatLabel}>Noto‘g‘ri javoblar</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{formatTime(testResult?.timeSpent || 0)}</Text>
                <Text style={styles.resultStatLabel}>Sarflangan vaqt</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => {
                setShowResultsModal(false);
                setTestCompleted(true);
              }}
            >
              <Text style={styles.detailsButtonText}>Batafsil natijalar</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={resetTest}
              >
                <Text style={styles.modalActionText}>Boshqa testlar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalActionPrimary]}
                onPress={() => {
                  if (selectedTest) startTest(selectedTest);
                  setShowResultsModal(false);
                }}
              >
                <Text style={[styles.modalActionText, styles.modalActionTextPrimary]}>Qayta urunish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Testlar yuklanmoqda...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (testStarted && selectedTest && !testCompleted) {
    const currentQuestion = selectedTest.questions[currentQuestionIndex];
    const selectedAnswer = selectedAnswers[currentQuestion.id];
    const progress = ((currentQuestionIndex + 1) / selectedTest.questions.length) * 100;

    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.background} />
        
        <View style={styles.testContainer}>
          {/* Header */}
          <View style={styles.testHeader}>
            <TouchableOpacity onPress={resetTest} style={styles.exitButton}>
              <Ionicons name="close-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.testInfo}>
              <Text style={styles.testTitleSmall}>{selectedTest.title}</Text>
              <View style={styles.testProgress}>
                <Text style={styles.questionCount}>
                  {currentQuestionIndex + 1}/{selectedTest.questions.length}
                </Text>
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                  <Text style={styles.timeText}>{formatTime(timeRemaining)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"]
                }) }
              ]} 
            />
          </View>

          {/* Question */}
          <ScrollView style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentQuestion.difficulty) + "20" }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(currentQuestion.difficulty) }]}>
                  {getDifficultyText(currentQuestion.difficulty)}
                </Text>
              </View>
              <Text style={styles.pointsText}>{currentQuestion.points} ball</Text>
            </View>

            <Text style={styles.questionText}>{currentQuestion.text}</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.optionButton, isSelected && styles.optionSelected]}
                    onPress={() => selectAnswer(currentQuestion.id, index)}
                  >
                    <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                      <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.optionCheck} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {showExplanation && (
              <Animated.View style={styles.explanationContainer}>
                <LinearGradient
                  colors={["#F3F4F6", "#E5E7EB"]}
                  style={styles.explanationGradient}
                >
                  <Text style={styles.explanationTitle}>📖 Tushuntirish</Text>
                  <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentQuestionIndex > 0 && (
              <TouchableOpacity style={styles.navButton} onPress={previousQuestion}>
                <Ionicons name="arrow-back" size={20} color="#667eea" />
                <Text style={styles.navButtonText}>Oldingi</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary]}
              onPress={() => {
                if (selectedAnswer !== undefined) {
                  if (currentQuestionIndex === selectedTest.questions.length - 1) {
                    submitTest();
                  } else {
                    nextQuestion();
                  }
                } else {
                  Alert.alert("Diqqat", "Iltimos, javobni tanlang!");
                }
              }}
            >
              <Text style={styles.navButtonTextPrimary}>
                {currentQuestionIndex === selectedTest.questions.length - 1 ? "Yakunlash" : "Keyingi"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {selectedAnswer !== undefined && (
            <TouchableOpacity
              style={styles.explanationToggle}
              onPress={() => setShowExplanation(!showExplanation)}
            >
              <Ionicons name={showExplanation ? "eye-off-outline" : "eye-outline"} size={20} color="#667eea" />
              <Text style={styles.explanationToggleText}>
                {showExplanation ? "Tushuntirishni yopish" : "Tushuntirishni ko‘rish"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (testCompleted && testResult && selectedTest) {
    const passed = testResult.percentage >= selectedTest.passingScore;
    
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.background} />
        
        <ScrollView style={styles.resultContainer}>
          <Animated.View style={[styles.resultCard, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={passed ? ["#10B981", "#059669"] : ["#EF4444", "#DC2626"]}
              style={styles.resultHeader}
            >
              <Ionicons name={passed ? "trophy" : "sad-outline"} size={80} color="#fff" />
              <Text style={styles.resultTitle}>
                {passed ? "Tabriklaymiz!" : "Omad keyingi safar"}
              </Text>
              <Text style={styles.resultSubtitle}>
                Siz {testResult.correctAnswers}/{testResult.totalQuestions} to‘g‘ri javob berdingiz
              </Text>
            </LinearGradient>

            <View style={styles.resultBody}>
              <View style={styles.resultScore}>
                <Text style={styles.resultPercentage}>{testResult.percentage.toFixed(0)}%</Text>
                <Text style={styles.resultGrade}>
                  {passed ? "O‘tdi" : "O‘tmadi"}
                </Text>
              </View>

              <View style={styles.resultStatsGrid}>
                <View style={styles.resultStatItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.resultStatValue}>{testResult.correctAnswers}</Text>
                  <Text style={styles.resultStatLabel}>To‘g‘ri</Text>
                </View>
                <View style={styles.resultStatItem}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                  <Text style={styles.resultStatValue}>{testResult.totalQuestions - testResult.correctAnswers}</Text>
                  <Text style={styles.resultStatLabel}>Noto‘g‘ri</Text>
                </View>
                <View style={styles.resultStatItem}>
                  <Ionicons name="time-outline" size={24} color="#667eea" />
                  <Text style={styles.resultStatValue}>{formatTime(testResult.timeSpent)}</Text>
                  <Text style={styles.resultStatLabel}>Vaqt</Text>
                </View>
              </View>

              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.resultButton} onPress={resetTest}>
                  <Ionicons name="list-outline" size={20} color="#667eea" />
                  <Text style={styles.resultButtonText}>Boshqa testlar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resultButton, styles.resultButtonPrimary]}
                  onPress={() => startTest(selectedTest)}
                >
                  <Ionicons name="refresh-outline" size={20} color="#fff" />
                  <Text style={[styles.resultButtonText, styles.resultButtonTextPrimary]}>
                    Qayta urunish
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.background} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <Text style={styles.title}>📝 Testlar</Text>
            <Text style={styles.subtitle}>Bilimingizni sinab ko‘ring</Text>
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={styles.categoryItem}
              >
                <LinearGradient
                  colors={selectedCategory === category.id
                    ? [category.color, category.color + "CC"]
                    : ["#F3F4F6", "#F3F4F6"]}
                  style={[
                    styles.categoryGradient,
                    selectedCategory === category.id && styles.categoryActive
                  ]}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={selectedCategory === category.id ? "#fff" : "#6B7280"}
                  />
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === category.id && styles.categoryNameActive
                  ]}>
                    {category.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Statistics Summary */}
          <View style={styles.statsSummary}>
            <LinearGradient
              colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
              style={styles.statsCard}
            >
              <View style={styles.statItem}>
                <Ionicons name="checkmark-done-circle" size={24} color="#FFD93D" />
                <Text style={styles.statNumber}>
                  {tests.reduce((sum, test) => sum + test.attempts, 0)}
                </Text>
                <Text style={styles.statLabel}>Umumiy testlar</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={24} color="#FFD93D" />
                <Text style={styles.statNumber}>
                  {Math.max(...tests.map(t => t.bestScore), 0)}%
                </Text>
                <Text style={styles.statLabel}>Eng yaxshi natija</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="star" size={24} color="#FFD93D" />
                <Text style={styles.statNumber}>
                  {tests.filter(t => t.bestScore >= t.passingScore).length}
                </Text>
                <Text style={styles.statLabel}>O‘tilgan testlar</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Tests List */}
          {filteredTests.map((test, index) => (
            <TestCard key={test.id} test={test} index={index} />
          ))}

          {filteredTests.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={80} color="#9CA3AF" />
              <Text style={styles.emptyText}>Testlar topilmadi</Text>
              <Text style={styles.emptySubtext}>Boshqa kategoriyani tanlang</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <ResultModal />
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
  header: {
    padding: 20,
    paddingBottom: 10,
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
  categoriesContainer: {
    marginVertical: 10,
  },
  categoriesContent: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    marginRight: 12,
  },
  categoryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  categoryActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 12,
    color: "#6B7280",
  },
  categoryNameActive: {
    color: "#fff",
    fontWeight: "600",
  },
  statsSummary: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  testCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  testCardGradient: {
    padding: 16,
  },
  testCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  testCategory: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  testCategoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bestScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  bestScoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
  },
  testTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
  },
  testDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 18,
  },
  testStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  testStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  testStatText: {
    fontSize: 12,
    color: "#6B7280",
  },
  testFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  attemptsText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  startButton: {
    overflow: "hidden",
    borderRadius: 10,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
  // Test taking styles
  testContainer: {
    flex: 1,
  },
  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  exitButton: {
    padding: 8,
  },
  testInfo: {
    flex: 1,
  },
  testTitleSmall: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  testProgress: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  questionCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFD93D",
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFD93D",
  },
  questionText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    lineHeight: 30,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: "rgba(16,185,129,0.2)",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionCircleSelected: {
    backgroundColor: "#10B981",
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  optionLetterSelected: {
    color: "#fff",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  optionTextSelected: {
    fontWeight: "600",
  },
  optionCheck: {
    marginLeft: "auto",
  },
  explanationContainer: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  explanationGradient: {
    padding: 16,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  navButtonPrimary: {
    backgroundColor: "#667eea",
    flex: 1,
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  navButtonTextPrimary: {
    color: "#fff",
  },
  explanationToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  explanationToggleText: {
    fontSize: 14,
    color: "#fff",
  },
  // Result styles
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 40,
  },
  resultHeader: {
    alignItems: "center",
    padding: 32,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
  },
  resultSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 8,
    textAlign: "center",
  },
  resultBody: {
    padding: 24,
  },
  resultScore: {
    alignItems: "center",
    marginBottom: 24,
  },
  resultPercentage: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#667eea",
  },
  resultGrade: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 8,
  },
  resultStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  resultStatItem: {
    alignItems: "center",
  },
  resultStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 6,
  },
  resultStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
  },
  resultButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  resultButtonPrimary: {
    backgroundColor: "#667eea",
  },
  resultButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  resultButtonTextPrimary: {
    color: "#fff",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width - 40,
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
  },
  modalHeader: {
    alignItems: "center",
    padding: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 8,
    textAlign: "center",
  },
  modalBody: {
    padding: 24,
  },
  scoreCircle: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  scoreLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  resultStat: {
    alignItems: "center",
  },
  resultDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  detailsButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalActionPrimary: {
    backgroundColor: "#667eea",
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  modalActionTextPrimary: {
    color: "#fff",
  },
});