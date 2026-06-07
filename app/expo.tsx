import React, { useState, useEffect, useRef } from "react";
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
  TextInput,
  Image,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get("window");

interface CertificateData {
  id: string;
  userName: string;
  courseName: string;
  score: number;
  percentage: number;
  level: "junior" | "middle" | "senior" | "expert";
  issueDate: string;
  certificateNumber: string;
  testId?: string;
  isValid: boolean;
  qrCode?: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  preview: string;
  colors: string[];
}

export default function CertificateCreatorScreen() {
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [score, setScore] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"junior" | "middle" | "senior" | "expert">("junior");
  const [selectedTemplate, setSelectedTemplate] = useState("premium");
  const [totalPoints, setTotalPoints] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const templates: CertificateTemplate[] = [
    { id: "premium", name: "Premium", preview: "🎓", colors: ["#667eea", "#764ba2"] },
    { id: "gold", name: "Gold", preview: "🏆", colors: ["#FFD700", "#FFA500"] },
    { id: "silver", name: "Silver", preview: "⭐", colors: ["#C0C0C0", "#A8A8A8"] },
    { id: "bronze", name: "Bronze", preview: "🥉", colors: ["#CD7F32", "#B87333"] },
  ];

  const levels = [
    { id: "junior", name: "Junior", minScore: 0, color: "#10B981", icon: "🌱" },
    { id: "middle", name: "Middle", minScore: 60, color: "#3B82F6", icon: "🚀" },
    { id: "senior", name: "Senior", minScore: 75, color: "#F59E0B", icon: "⭐" },
    { id: "expert", name: "Expert", minScore: 90, color: "#EF4444", icon: "🏆" },
  ];

  useEffect(() => {
    loadData();
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
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const loadData = async () => {
    try {
      const storedUserName = await AsyncStorage.getItem("user_name");
      if (storedUserName) setUserName(storedUserName);
      
      const storedCertificates = await AsyncStorage.getItem("certificates");
      if (storedCertificates) {
        setCertificates(JSON.parse(storedCertificates));
      }
      
      const storedPoints = await AsyncStorage.getItem("totalPoints");
      if (storedPoints) {
        setTotalPoints(parseInt(storedPoints));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const generateCertificateNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    return `CERT-${year}-${random.toString().padStart(4, '0')}`;
  };

  const createCertificate = async () => {
    if (!userName.trim()) {
      Alert.alert("Xato", "Ismingizni kiriting!");
      return;
    }
    if (!courseName.trim()) {
      Alert.alert("Xato", "Kurs nomini kiriting!");
      return;
    }
    if (!score.trim() || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100) {
      Alert.alert("Xato", "To'g'ri ball kiriting (0-100)!");
      return;
    }

    const percentage = Number(score);
    let level: "junior" | "middle" | "senior" | "expert" = "junior";
    if (percentage >= 90) level = "expert";
    else if (percentage >= 75) level = "senior";
    else if (percentage >= 60) level = "middle";
    else level = "junior";

    const newCertificate: CertificateData = {
      id: Date.now().toString(),
      userName: userName.trim(),
      courseName: courseName.trim(),
      score: percentage,
      percentage: percentage,
      level: level,
      issueDate: new Date().toISOString(),
      certificateNumber: generateCertificateNumber(),
      isValid: true,
    };

    const updatedCertificates = [newCertificate, ...certificates];
    setCertificates(updatedCertificates);
    await AsyncStorage.setItem("certificates", JSON.stringify(updatedCertificates));
    
    setShowCreatorModal(false);
    setSelectedCertificate(newCertificate);
    setShowCertificateModal(true);
    
    Alert.alert("Muvaffaqiyatli", "Sertifikat yaratildi!");
  };

  const generateCertificateHTML = (cert: CertificateData, template: string): string => {
    const templateColors = templates.find(t => t.id === template)?.colors || ["#667eea", "#764ba2"];
    const levelInfo = levels.find(l => l.id === cert.level);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of Achievement</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: linear-gradient(135deg, ${templateColors[0]} 0%, ${templateColors[1]} 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .certificate {
            width: 900px;
            background: white;
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            position: relative;
            animation: fadeIn 0.8s ease-out;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .certificate-border {
            border: 3px solid ${templateColors[0]};
            margin: 15px;
            border-radius: 20px;
            overflow: hidden;
          }
          .certificate-header {
            background: linear-gradient(135deg, ${templateColors[0]} 0%, ${templateColors[1]} 100%);
            padding: 40px;
            text-align: center;
            position: relative;
          }
          .logo {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
          }
          .certificate-header h1 {
            color: white;
            font-size: 48px;
            letter-spacing: 3px;
            margin-bottom: 10px;
            text-transform: uppercase;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          }
          .certificate-header p {
            color: rgba(255,255,255,0.95);
            font-size: 18px;
          }
          .certificate-body {
            padding: 50px;
            text-align: center;
          }
          .certificate-body h2 {
            color: #333;
            font-size: 28px;
            margin-bottom: 20px;
            font-weight: normal;
          }
          .recipient {
            font-size: 42px;
            color: ${templateColors[0]};
            margin: 20px 0;
            font-weight: bold;
            border-bottom: 3px solid ${templateColors[0]};
            display: inline-block;
            padding-bottom: 10px;
          }
          .achievement-text {
            font-size: 18px;
            color: #666;
            margin: 20px 0;
            line-height: 1.6;
          }
          .score-container {
            margin: 30px 0;
          }
          .score {
            font-size: 64px;
            color: ${templateColors[0]};
            font-weight: bold;
          }
          .score-label {
            font-size: 14px;
            color: #999;
            margin-top: 5px;
          }
          .level-badge {
            display: inline-block;
            padding: 12px 40px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            background: ${levelInfo?.color}20;
            color: ${levelInfo?.color};
          }
          .level-icon {
            font-size: 24px;
            margin-right: 10px;
          }
          .certificate-footer {
            background: #f8f9fa;
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #e0e0e0;
          }
          .signature {
            text-align: center;
          }
          .signature-line {
            width: 200px;
            height: 2px;
            background: #333;
            margin-bottom: 10px;
          }
          .signature-name {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .signature-title {
            font-size: 12px;
            color: #666;
          }
          .stamp {
            text-align: center;
          }
          .stamp-circle {
            width: 100px;
            height: 100px;
            border: 3px solid #EF4444;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #EF4444;
          }
          .stamp-circle div {
            font-size: 12px;
            font-weight: bold;
          }
          .certificate-number {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #999;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .certificate {
              box-shadow: none;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="certificate-border">
            <div class="certificate-header">
              <div class="logo">
                🎓
              </div>
              <h1>CERTIFICATE OF ACHIEVEMENT</h1>
              <p>This certificate is proudly presented to</p>
            </div>
            <div class="certificate-body">
              <h2>for successfully completing</h2>
              <div class="recipient">${cert.userName}</div>
              <div class="achievement-text">
                the course of<br>
                <strong>"${cert.courseName}"</strong><br>
                with outstanding performance
              </div>
              <div class="score-container">
                <div class="score">${cert.percentage}%</div>
                <div class="score-label">Overall Score</div>
              </div>
              <div class="level-badge">
                <span class="level-icon">${levelInfo?.icon}</span>
                ${levelInfo?.name.toUpperCase()} LEVEL
              </div>
              <div class="achievement-text">
                Score: ${cert.score}/100<br>
                Issue Date: ${new Date(cert.issueDate).toLocaleDateString()}
              </div>
            </div>
            <div class="certificate-footer">
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">Dr. John Smith</div>
                <div class="signature-title">Rector</div>
              </div>
              <div class="stamp">
                <div class="stamp-circle">
                  <div>✓</div>
                  <div>OFFICIAL</div>
                  <div>SEAL</div>
                </div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">Prof. Sarah Johnson</div>
                <div class="signature-title">Academic Director</div>
              </div>
            </div>
            <div class="certificate-number">
              Certificate No: ${cert.certificateNumber}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadCertificate = async (certificate: CertificateData) => {
    setLoading(true);
    try {
      const html = generateCertificateHTML(certificate, selectedTemplate);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        await Share.share({
          title: 'Mening sertifikatim',
          message: `Men ${certificate.percentage}% natija bilan ${levels.find(l => l.id === certificate.level)?.name} darajasiga erishdim!`,
          url: uri,
        });
      }
    } catch (error) {
      Alert.alert("Xato", "Sertifikatni yuklab olishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const shareCertificate = async (certificate: CertificateData) => {
    try {
      const html = generateCertificateHTML(certificate, selectedTemplate);
      const { uri } = await Print.printToFileAsync({ html });
      
      await Share.share({
        title: 'Sertifikatim',
        message: `🎉 Men ${certificate.courseName} kursini ${certificate.percentage}% natija bilan tamomladim!`,
        url: uri,
      });
    } catch (error) {
      Alert.alert("Xato", "Sertifikatni ulashishda xatolik");
    }
  };

  const deleteCertificate = async (id: string) => {
    Alert.alert(
      "Sertifikatni o'chirish",
      "Bu sertifikatni o'chirmoqchimisiz?",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: async () => {
            const updatedCertificates = certificates.filter(c => c.id !== id);
            setCertificates(updatedCertificates);
            await AsyncStorage.setItem("certificates", JSON.stringify(updatedCertificates));
            Alert.alert("Muvaffaqiyatli", "Sertifikat o'chirildi");
          }
        }
      ]
    );
  };

  const getLevelInfo = (level: string) => {
    return levels.find(l => l.id === level) || levels[0];
  };

  const CertificateCard = ({ certificate, index }: { certificate: CertificateData; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const levelInfo = getLevelInfo(certificate.level);
    
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
          styles.certificateCard,
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
          style={styles.certificateCardGradient}
        >
          <View style={styles.certificateCardHeader}>
            <View style={[styles.levelBadge, { backgroundColor: levelInfo.color + "20" }]}>
              <Text style={[styles.levelBadgeText, { color: levelInfo.color }]}>
                {levelInfo.icon} {levelInfo.name}
              </Text>
            </View>
            <View style={styles.validBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.validText}>Tasdiqlangan</Text>
            </View>
          </View>

          <Text style={styles.certificateCardTitle}>{certificate.courseName}</Text>
          
          <View style={styles.certificateCardStats}>
            <View style={styles.certificateCardStat}>
              <Text style={styles.certificateCardStatValue}>{certificate.percentage}%</Text>
              <Text style={styles.certificateCardStatLabel}>Natija</Text>
            </View>
            <View style={styles.certificateCardStatDivider} />
            <View style={styles.certificateCardStat}>
              <Text style={styles.certificateCardStatValue}>{certificate.score}/100</Text>
              <Text style={styles.certificateCardStatLabel}>Ball</Text>
            </View>
            <View style={styles.certificateCardStatDivider} />
            <View style={styles.certificateCardStat}>
              <Text style={styles.certificateCardStatValue}>
                {new Date(certificate.issueDate).toLocaleDateString()}
              </Text>
              <Text style={styles.certificateCardStatLabel}>Sana</Text>
            </View>
          </View>

          <View style={styles.certificateCardFooter}>
            <Text style={styles.certificateCardNumber}>{certificate.certificateNumber}</Text>
            <View style={styles.certificateCardActions}>
              <TouchableOpacity
                style={styles.certificateCardAction}
                onPress={() => {
                  setSelectedCertificate(certificate);
                  setShowCertificateModal(true);
                }}
              >
                <Ionicons name="eye-outline" size={20} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.certificateCardAction}
                onPress={() => downloadCertificate(certificate)}
              >
                <Ionicons name="download-outline" size={20} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.certificateCardAction}
                onPress={() => shareCertificate(certificate)}
              >
                <Ionicons name="share-outline" size={20} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.certificateCardAction, styles.deleteAction]}
                onPress={() => deleteCertificate(certificate.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const CertificateModal = () => (
    <Modal
      visible={showCertificateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCertificateModal(false)}
    >
      <View style={styles.modalOverlay}>
      <ScrollView
  style={styles.modalContent}
  showsVerticalScrollIndicator={false}
>
          {selectedCertificate && (
            <>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.modalHeader}
              >
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowCertificateModal(false)}
                >
                  <Ionicons name="close-outline" size={28} color="#fff" />
                </TouchableOpacity>
                <Image 
                  source={require("../logo_2.jpg")} 
                  style={styles.modalLogo}
                />
                <Text style={styles.modalTitle}>Sertifikat</Text>
                <Text style={styles.modalSubtitle}>Muvaffaqiyatli tamomlandi</Text>
              </LinearGradient>

              <View style={styles.modalBody}>
                {/* Certificate Preview */}
                <View style={styles.certificatePreview}>
                  <LinearGradient
                    colors={["#fff", "#f9fafb"]}
                    style={styles.certificatePreviewInner}
                  >
                    <View style={styles.previewHeader}>
                      <Image source={require("../logo_2.jpg")} style={styles.previewLogo} />
                      <Text style={styles.previewTitle}>SERTIFIKAT</Text>
                    </View>

                    <Text style={styles.previewRecipient}>Beriladi:</Text>
                    <Text style={styles.previewName}>{selectedCertificate.userName}</Text>

                    <Text style={styles.previewText}>
                      Ushbu sertifikat bilan tasdiqlanadiki, yuqoridagi nomzod
                    </Text>
                    <Text style={styles.previewCourse}>"{selectedCertificate.courseName}"</Text>
                    <Text style={styles.previewText}>
                      kursini muvaffaqiyatli tamomlab, quyidagi natijalarni ko'rsatdi:
                    </Text>

                    <View style={styles.previewStats}>
                      <View style={styles.previewStat}>
                        <Text style={styles.previewStatValue}>
                          {selectedCertificate.percentage}%
                        </Text>
                        <Text style={styles.previewStatLabel}>Umumiy natija</Text>
                      </View>
                      <View style={styles.previewStat}>
                        <Text style={styles.previewStatValue}>
                          {selectedCertificate.score}/100
                        </Text>
                        <Text style={styles.previewStatLabel}>Test ball</Text>
                      </View>
                    </View>

                    <View style={[styles.previewLevel, { backgroundColor: getLevelInfo(selectedCertificate.level).color + "20" }]}>
                      <Text style={[styles.previewLevelText, { color: getLevelInfo(selectedCertificate.level).color }]}>
                        {getLevelInfo(selectedCertificate.level).icon} {getLevelInfo(selectedCertificate.level).name.toUpperCase()} DARAJASI
                      </Text>
                    </View>

                    <View style={styles.previewFooter}>
                      <View style={styles.previewSignature}>
                        <Text style={styles.signatureName}>Dr. John Smith</Text>
                        <Text style={styles.signatureTitle}>Rektor</Text>
                      </View>
                      <View style={styles.previewStamp}>
                        <View style={styles.stampCircle}>
                          <Ionicons name="checkmark" size={30} color="#EF4444" />
                          <Text style={styles.stampText}>OFFICIAL</Text>
                          <Text style={styles.stampText}>SEAL</Text>
                        </View>
                      </View>
                      <View style={styles.previewSignature}>
                        <Text style={styles.signatureName}>Prof. Sarah Johnson</Text>
                        <Text style={styles.signatureTitle}>Akademik direktor</Text>
                      </View>
                    </View>

                    <Text style={styles.previewNumber}>
                      Sertifikat raqami: {selectedCertificate.certificateNumber}
                    </Text>
                    <Text style={styles.previewDate}>
                      Berilgan sana: {new Date(selectedCertificate.issueDate).toLocaleDateString()}
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => downloadCertificate(selectedCertificate)}
                  >
                    <LinearGradient
                      colors={["#667eea", "#764ba2"]}
                      style={styles.modalButtonGradient}
                    >
                      <Ionicons name="download-outline" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>Yuklab olish</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => shareCertificate(selectedCertificate)}
                  >
                    <LinearGradient
                      colors={["#10B981", "#059669"]}
                      style={styles.modalButtonGradient}
                    >
                      <Ionicons name="share-social" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>Ulashish</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          </ScrollView>
      </View>
    </Modal>
  );

  const CreatorModal = () => (
    <Modal
      visible={showCreatorModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreatorModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.ScrollView
          style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowCreatorModal(false)}
            >
              <Ionicons name="close-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <Ionicons name="create-outline" size={50} color="#fff" />
            <Text style={styles.modalTitle}>Yangi sertifikat</Text>
            <Text style={styles.modalSubtitle}>Ma'lumotlarni to'ldiring</Text>
          </LinearGradient>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ismingiz</Text>
              <TextInput
                style={styles.input}
                placeholder="Ismingizni kiriting"
                placeholderTextColor="#9CA3AF"
                value={userName}
                onChangeText={setUserName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kurs nomi</Text>
              <TextInput
                style={styles.input}
                placeholder="Kurs nomini kiriting"
                placeholderTextColor="#9CA3AF"
                value={courseName}
                onChangeText={setCourseName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ball (0-100)</Text>
              <TextInput
                style={styles.input}
                placeholder="Masalan: 85"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={score}
                onChangeText={setScore}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sertifikat template</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesContainer}>
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateItem,
                      selectedTemplate === template.id && styles.templateSelected
                    ]}
                    onPress={() => setSelectedTemplate(template.id)}
                  >
                    <LinearGradient
                      colors={template.colors}
                      style={styles.templatePreview}
                    >
                      <Text style={styles.templatePreviewIcon}>{template.preview}</Text>
                    </LinearGradient>
                    <Text style={styles.templateName}>{template.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Daraja</Text>
              <View style={styles.levelContainer}>
                {levels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.levelOption,
                      selectedLevel === level.id && { backgroundColor: level.color + "20", borderColor: level.color }
                    ]}
                    onPress={() => setSelectedLevel(level.id as any)}
                  >
                    <Text style={styles.levelIcon}>{level.icon}</Text>
                    <Text style={[styles.levelName, selectedLevel === level.id && { color: level.color }]}>
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreatorModal(false)}
              >
                <Text style={styles.cancelButtonText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={createCertificate}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.modalButtonGradient}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.modalButtonText}>Yaratish</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.background} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <Text style={styles.title}>🏆 Sertifikatlar</Text>
            <Text style={styles.subtitle}>Sizning yutuqlaringiz va sertifikatlaringiz</Text>
          </View>

          {/* Stats Card */}
          <Animated.View style={[styles.statsCard, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
              style={styles.statsGradient}
            >
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Ionicons name="ribbon-outline" size={24} color="#FFD700" />
                  <Text style={styles.statNumber}>{certificates.length}</Text>
                  <Text style={styles.statLabel}>Sertifikatlar</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Ionicons name="star-outline" size={24} color="#FFD700" />
                  <Text style={styles.statNumber}>{totalPoints}</Text>
                  <Text style={styles.statLabel}>Umumiy ball</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Ionicons name="trophy-outline" size={24} color="#FFD700" />
                  <Text style={styles.statNumber}>
                    {certificates.filter(c => c.percentage >= 90).length}
                  </Text>
                  <Text style={styles.statLabel}>Expert</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreatorModal(true)}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.createButtonText}>Yangi sertifikat yaratish</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Certificates List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📜 Mening sertifikatlarim</Text>
            <Text style={styles.sectionCount}>{certificates.length} ta</Text>
          </View>

          {certificates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={80} color="#9CA3AF" />
              <Text style={styles.emptyText}>Hali sertifikatlar yo‘q</Text>
              <Text style={styles.emptySubtext}>
                Yuqoridagi "Yangi sertifikat yaratish" tugmasini bosib, birinchi sertifikatingizni yarating!
              </Text>
            </View>
          ) : (
            certificates.map((cert, index) => (
              <CertificateCard key={cert.id} certificate={cert} index={index} />
            ))
          )}
        </Animated.View>
      </ScrollView>

      <CertificateModal />
      <CreatorModal />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
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
  statsCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statsGradient: {
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  createButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  sectionCount: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  certificateCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  certificateCardGradient: {
    padding: 16,
  },
  certificateCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  validBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  validText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "600",
  },
  certificateCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  certificateCardStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  certificateCardStat: {
    alignItems: "center",
    flex: 1,
  },
  certificateCardStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#667eea",
  },
  certificateCardStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  certificateCardStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#F3F4F6",
  },
  certificateCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  certificateCardNumber: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  certificateCardActions: {
    flexDirection: "row",
    gap: 12,
  },
  certificateCardAction: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  deleteAction: {
    backgroundColor: "#FEE2E2",
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
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 24,
    overflow: "hidden",
  },
  modalHeader: {
    alignItems: "center",
    padding: 32,
    position: "relative",
  },
  modalClose: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  modalLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#fff",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  modalBody: {
    padding: 20,
  },
  certificatePreview: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  certificatePreviewInner: {
    padding: 24,
  },
  previewHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  previewLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#667eea",
    letterSpacing: 2,
  },
  previewRecipient: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  previewName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginVertical: 8,
  },
  previewText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 4,
  },
  previewCourse: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#667eea",
    textAlign: "center",
    marginVertical: 8,
  },
  previewStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginVertical: 16,
  },
  previewStat: {
    alignItems: "center",
  },
  previewStatValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#667eea",
  },
  previewStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  previewLevel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    marginVertical: 16,
  },
  previewLevelText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  previewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  previewSignature: {
    alignItems: "center",
  },
  signatureName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
  },
  signatureTitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  previewStamp: {
    alignItems: "center",
  },
  stampCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  stampText: {
    fontSize: 8,
    color: "#EF4444",
    fontWeight: "bold",
  },
  previewNumber: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
  },
  previewDate: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 12,
  },
  modalButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  templatesContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  templateItem: {
    alignItems: "center",
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
  },
  templateSelected: {
    backgroundColor: "#F3F4F6",
  },
  templatePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  templatePreviewIcon: {
    fontSize: 32,
  },
  templateName: {
    fontSize: 12,
    color: "#6B7280",
  },
  levelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  levelOption: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  levelIcon: {
    fontSize: 20,
  },
  levelName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});