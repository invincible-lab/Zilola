import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
  Animated,
  Share,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");

const STORAGE_KEY = "VIDEO_STORAGE";

type Category =
  | "all"
  | "history"
  | "hardware"
  | "software"
  | "architecture"
  | "modern";

interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: Category;
  duration: string;
  views: number;
  likes: number;
  channelName: string;
  uploadDate: string;
  thumbnail: string;
  watched: boolean;
  isFavorite: boolean;
  watchLater: boolean;
  tags: string[];
}

const categories = [
  {
    id: "all",
    name: "Barchasi",
    icon: "apps-outline",
    color: "#5B8CFF",
  },
  {
    id: "history",
    name: "Tarix",
    icon: "time-outline",
    color: "#FF6B6B",
  },
  {
    id: "hardware",
    name: "Hardware",
    icon: "hardware-chip-outline",
    color: "#00C896",
  },
  {
    id: "software",
    name: "Software",
    icon: "code-slash-outline",
    color: "#9B5DE5",
  },
  {
    id: "architecture",
    name: "Arxitektura",
    icon: "layers-outline",
    color: "#FFB703",
  },
  {
    id: "modern",
    name: "AI & Modern",
    icon: "flash-outline",
    color: "#00B4D8",
  },
];

const initialVideos: Video[] = [
  {
    id: "1",
    title: "Kompyuterlar tarixi",
    description:
      "Birinchi kompyuterdan zamonaviy AI kompyuterlargacha.",
    youtubeId: "d86ws7mQYYg",
    category: "history",
    duration: "15:24",
    views: 120000,
    likes: 4500,
    channelName: "Tech History",
    uploadDate: "2025-01-15",
    thumbnail:
      "https://img.youtube.com/vi/d86ws7mQYYg/maxresdefault.jpg",
    watched: false,
    isFavorite: false,
    watchLater: false,
    tags: ["history", "computer"],
  },

  {
    id: "2",
    title: "CPU va RAM qanday ishlaydi?",
    description:
      "Kompyuterning asosiy qurilmalari va ishlash prinsipi.",
    youtubeId: "AkFi90lZmXA",
    category: "hardware",
    duration: "18:10",
    views: 210000,
    likes: 8200,
    channelName: "Hardware Academy",
    uploadDate: "2025-02-01",
    thumbnail:
      "https://img.youtube.com/vi/AkFi90lZmXA/maxresdefault.jpg",
    watched: false,
    isFavorite: false,
    watchLater: false,
    tags: ["cpu", "ram"],
  },

  {
    id: "3",
    title: "Operating Systems Explained",
    description:
      "Windows, Linux va macOS tizimlari haqida.",
    youtubeId: "26QPDBe-nB0",
    category: "software",
    duration: "20:05",
    views: 340000,
    likes: 12000,
    channelName: "OS Explained",
    uploadDate: "2025-02-10",
    thumbnail:
      "https://img.youtube.com/vi/26QPDBe-nB0/maxresdefault.jpg",
    watched: false,
    isFavorite: false,
    watchLater: false,
    tags: ["os", "linux"],
  },

  {
    id: "4",
    title: "Artificial Intelligence Basics",
    description:
      "AI va Machine Learning boshlang‘ich darsligi.",
    youtubeId: "aircAruvnKk",
    category: "modern",
    duration: "30:00",
    views: 500000,
    likes: 24000,
    channelName: "AI World",
    uploadDate: "2025-03-01",
    thumbnail:
      "https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg",
    watched: false,
    isFavorite: false,
    watchLater: false,
    tags: ["ai", "ml"],
  },
];

export default function VideoScreen() {
  const [videos, setVideos] =
    useState<Video[]>(initialVideos);

  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] =
    useState<Category>("all");

  const [search, setSearch] = useState("");

  const [selectedVideo, setSelectedVideo] =
    useState<Video | null>(null);

  const [playerVisible, setPlayerVisible] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    loadVideos();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await AsyncStorage.getItem(
        STORAGE_KEY
      );

      if (data) {
        setVideos(JSON.parse(data));
      } else {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(initialVideos)
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const saveVideos = async (
    updatedVideos: Video[]
  ) => {
    setVideos(updatedVideos);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedVideos)
    );
  };

  const filteredVideos = useMemo(() => {
    let filtered = [...videos];

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (item) =>
          item.category === selectedCategory
      );
    }

    if (search.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          item.description
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [videos, selectedCategory, search]);

  const openVideo = async (video: Video) => {
    const updated = videos.map((v) =>
      v.id === video.id
        ? { ...v, watched: true }
        : v
    );

    await saveVideos(updated);

    setSelectedVideo({
      ...video,
      watched: true,
    });

    setPlayerVisible(true);
  };

  const toggleFavorite = async (
    id: string
  ) => {
    const updated = videos.map((v) =>
      v.id === id
        ? {
            ...v,
            isFavorite: !v.isFavorite,
          }
        : v
    );

    await saveVideos(updated);
  };

  const toggleWatchLater = async (
    id: string
  ) => {
    const updated = videos.map((v) =>
      v.id === id
        ? {
            ...v,
            watchLater: !v.watchLater,
          }
        : v
    );

    await saveVideos(updated);
  };

  const refresh = async () => {
    setRefreshing(true);

    await loadVideos();

    setRefreshing(false);
  };

  const shareVideo = async (video: Video) => {
    try {
      await Share.share({
        message: `https://youtube.com/watch?v=${video.youtubeId}`,
      });
    } catch (error) {
      Alert.alert("Xatolik");
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000)
      return `${(num / 1000000).toFixed(1)}M`;

    if (num >= 1000)
      return `${(num / 1000).toFixed(1)}K`;

    return num.toString();
  };

  const renderVideo = ({
    item,
  }: {
    item: Video;
  }) => {
    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openVideo(item)}
        >
          <View style={styles.thumbnailBox}>
            <Image
              source={{
                uri: item.thumbnail,
              }}
              style={styles.thumbnail}
            />

            <LinearGradient
              colors={[
                "transparent",
                "rgba(0,0,0,0.8)",
              ]}
              style={styles.overlay}
            >
              <Ionicons
                name="play-circle"
                size={60}
                color="#fff"
              />
            </LinearGradient>

            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {item.duration}
              </Text>
            </View>

            {item.watched && (
              <View style={styles.watchedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#00E676"
                />
              </View>
            )}
          </View>

          <LinearGradient
            colors={["#111827", "#1F2937"]}
            style={styles.infoContainer}
          >
            <View style={styles.topRow}>
              <Text
                numberOfLines={2}
                style={styles.videoTitle}
              >
                {item.title}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() =>
                    toggleFavorite(item.id)
                  }
                >
                  <Ionicons
                    name={
                      item.isFavorite
                        ? "heart"
                        : "heart-outline"
                    }
                    size={22}
                    color={
                      item.isFavorite
                        ? "#FF4D6D"
                        : "#fff"
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    toggleWatchLater(item.id)
                  }
                >
                  <Ionicons
                    name={
                      item.watchLater
                        ? "bookmark"
                        : "bookmark-outline"
                    }
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    shareVideo(item)
                  }
                >
                  <Ionicons
                    name="share-social-outline"
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text
              style={styles.description}
              numberOfLines={2}
            >
              {item.description}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                👁 {formatNumber(item.views)}
              </Text>

              <Text style={styles.metaText}>
                ❤️ {formatNumber(item.likes)}
              </Text>

              <Text style={styles.metaText}>
                📅 {item.uploadDate}
              </Text>
            </View>

            <View style={styles.tags}>
              {item.tags.map((tag, index) => (
                <View
                  key={index}
                  style={styles.tag}
                >
                  <Text style={styles.tagText}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#fff"
        />

        <Text style={styles.loadingText}>
          Yuklanmoqda...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
      />

      <LinearGradient
        colors={["#0F172A", "#111827"]}
        style={styles.background}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🎬 Video Darsliklar
        </Text>

        <Text style={styles.headerSubtitle}>
          Dasturiy ta’minot va evolyutsiya
        </Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#94A3B8"
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Video qidirish..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
      </View>

      {/* CATEGORY */}
      <FlatList
        horizontal
        data={categories}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100,
          
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              setSelectedCategory(
                item.id as Category
              )
            }
          >
            <LinearGradient
              colors={
                selectedCategory === item.id
                  ? [item.color, "#111827"]
                  : ["#1F2937", "#1F2937"]
              }
              style={styles.category}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color="#fff"
              />

              <Text style={styles.categoryText}>
                {item.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />

      {/* VIDEOS */}
      <FlatList
        data={filteredVideos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: 30,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#fff"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <Ionicons
              name="videocam-off-outline"
              size={80}
              color="#94A3B8"
            />

            <Text style={styles.emptyTitle}>
              Video topilmadi
            </Text>
          </View>
        )}
      />

      {/* PLAYER */}
      <Modal
        visible={playerVisible}
        animationType="slide"
      >
        <SafeAreaView
          style={styles.playerContainer}
        >
          <View style={styles.playerHeader}>
            <TouchableOpacity
              onPress={() =>
                setPlayerVisible(false)
              }
            >
              <Ionicons
                name="arrow-back"
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <Text
              style={styles.playerTitle}
              numberOfLines={1}
            >
              {selectedVideo?.title}
            </Text>
          </View>

          <View style={styles.webContainer}>
            {selectedVideo && (
              <WebView
                source={{
                  uri: `https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`,
                }}
                allowsFullscreenVideo
                javaScriptEnabled
                mediaPlaybackRequiresUserAction={
                  false
                }
                style={styles.webview}
              />
            )}
          </View>

          <View style={styles.playerInfo}>
            <Text style={styles.playerVideoTitle}>
              {selectedVideo?.title}
            </Text>

            <Text
              style={styles.playerDescription}
            >
              {selectedVideo?.description}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  background: {
    ...StyleSheet.absoluteFillObject,
  },

  loading: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },

  headerSubtitle: {
    color: "#CBD5E1",
    marginTop: 6,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    height: 55,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: "#fff",
    fontSize: 15,
  },

  category: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 12,
    gap: 8,
  },

  categoryText: {
    color: "#fff",
    fontWeight: "600",
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111827",
  },

  thumbnailBox: {
    position: "relative",
  },

  thumbnail: {
    width: "100%",
    height: 220,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  durationBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  watchedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 6,
    borderRadius: 20,
  },

  infoContainer: {
    padding: 16,
  },

  topRow: {
    flexDirection: "row",
  },

  videoTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
  },

  description: {
    color: "#CBD5E1",
    marginTop: 10,
    lineHeight: 20,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  metaText: {
    color: "#94A3B8",
    fontSize: 12,
  },

  tags: {
    flexDirection: "row",
    marginTop: 14,
    flexWrap: "wrap",
  },

  tag: {
    backgroundColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },

  tagText: {
    color: "#fff",
    fontSize: 11,
  },

  emptyBox: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    marginTop: 20,
  },

  playerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  playerTitle: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
    fontWeight: "600",
  },

  webContainer: {
    width: width,
    height: width * 0.56,
    backgroundColor: "#000",
  },

  webview: {
    flex: 1,
  },

  playerInfo: {
    padding: 16,
  },

  playerVideoTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },

  playerDescription: {
    color: "#CBD5E1",
    lineHeight: 22,
  },
});