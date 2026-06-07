import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Masala turi
type Problem = {
  id: string;
  title: string;
  description: string;
  solution?: string; // Yechim matni
  category: string;
  difficulty: "Oson" | "O'rta" | "Qiyin";
  solved: boolean;
};

// Dastlabki 20 ta masala
const initialProblems: Problem[] = [
  { id: "1", title: "1-masala", description: "2 sonni qo‘shish", category: "Matematika", difficulty: "Oson", solved: false },
  { id: "2", title: "2-masala", description: "3 sonni 5 ga ko‘paytirish", category: "Matematika", difficulty: "Oson", solved: false },
  { id: "3", title: "3-masala", description: "To‘liq sonlar yig‘indisi", category: "Matematika", difficulty: "O'rta", solved: false },
  { id: "4", title: "4-masala", description: "Arraydagi eng katta elementni topish", category: "Dasturlash", difficulty: "O'rta", solved: false },
  { id: "5", title: "5-masala", description: "Stringni teskariga o‘zgartirish", category: "Dasturlash", difficulty: "Oson", solved: false },
];

const BookScreen = () => {
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [search, setSearch] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [solutionModalVisible, setSolutionModalVisible] = useState<boolean>(false);
  const [newProblem, setNewProblem] = useState<Partial<Problem>>({});
  const [solutionText, setSolutionText] = useState<string>("");
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");

  // AsyncStorage dan yuklash
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem("problems");
        if (stored) setProblems(JSON.parse(stored));
      } catch (error) {
        console.log("AsyncStorage load error:", error);
      }
    };
    loadData();
  }, []);

  // AsyncStorage ga saqlash
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("problems", JSON.stringify(problems));
      } catch (error) {
        console.log("AsyncStorage save error:", error);
      }
    };
    saveData();
  }, [problems]);

  // Yangi masala qo'shish
  const addProblem = () => {
    if (!newProblem.title || !newProblem.description) {
      Alert.alert("Ogohlantirish", "Sarlavha va tavsif kiritilishi shart!");
      return;
    }

    const problem: Problem = {
      id: Date.now().toString(),
      title: newProblem.title,
      description: newProblem.description,
      category: newProblem.category || "Umumiy",
      difficulty: (newProblem.difficulty as "Oson" | "O'rta" | "Qiyin") || "Oson",
      solved: false,
    };

    setProblems((prev) => [problem, ...prev]);
    setNewProblem({});
    setModalVisible(false);
  };

  // Masala yechildi va yechim qo'shish
  const markSolved = (id: string) => {
    if (!solutionText) {
      Alert.alert("Eslatma", "Iltimos, yechim matnini kiriting!");
      return;
    }
    setProblems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, solved: true, solution: solutionText } : p
      )
    );
    setSolutionText("");
    setSolutionModalVisible(false);
  };

  const toggleSolutionModal = (id: string) => {
    setSelectedProblemId(id);
    const problem = problems.find((p) => p.id === id);
    setSolutionText(problem?.solution || "");
    setSolutionModalVisible(true);
  };

  // Masalani o'chirish
  const deleteProblem = (id: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== id));
  };

  // Qidiruv
  const filteredProblems = problems.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.solution && p.solution.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Masalalar</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Qidiruv..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        style={{ flex: 1 }}
        data={filteredProblems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 150 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            {item.solved && item.solution && (
              <Text style={{ color: "green", marginVertical: 5 }}>
                Yechim: {item.solution}
              </Text>
            )}
            <Text style={styles.category}>Kategoriya: {item.category}</Text>
            <Text style={styles.difficulty}>Murakkablik: {item.difficulty}</Text>
            <Text style={{ color: item.solved ? "green" : "red" }}>
              {item.solved ? "Yechilgan" : "Yechilmagan"}
            </Text>

            <View style={styles.buttonRow}>
              {!item.solved && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "green" }]}
                  onPress={() => toggleSolutionModal(item.id)}
                >
                  <Text style={styles.buttonText}>Yechildi</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "red" }]}
                onPress={() => deleteProblem(item.id)}
              >
                <Text style={styles.buttonText}>O`chirish</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={{ color: "white", fontSize: 28 }}>+</Text>
      </TouchableOpacity>

      {/* Modal: Yangi Masala */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalHeader}>Yangi Masala Qo`shish</Text>

          <TextInput
            placeholder="Sarlavha"
            style={styles.input}
            value={newProblem.title}
            onChangeText={(text) => setNewProblem({ ...newProblem, title: text })}
          />
          <TextInput
            placeholder="Tavsif"
            style={[styles.input, { height: 100 }]}
            multiline
            value={newProblem.description}
            onChangeText={(text) =>
              setNewProblem({ ...newProblem, description: text })
            }
          />
          <TextInput
            placeholder="Kategoriya"
            style={styles.input}
            value={newProblem.category}
            onChangeText={(text) =>
              setNewProblem({ ...newProblem, category: text })
            }
          />
          <TextInput
            placeholder="Murakkablik (Oson, O'rta, Qiyin)"
            style={styles.input}
            value={newProblem.difficulty}
            onChangeText={(text) =>
              setNewProblem({
                ...newProblem,
                difficulty: text as "Oson" | "O'rta" | "Qiyin",
              })
            }
          />

          <TouchableOpacity style={styles.addButton} onPress={addProblem}>
            <Text style={{ color: "white", fontWeight: "bold" }}>Qo`shish</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Bekor qilish</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* Modal: Yechim kiritish */}
      <Modal visible={solutionModalVisible} animationType="slide" transparent>
        <View style={styles.solutionModalContainer}>
          <View style={styles.solutionModalContent}>
            <Text style={styles.modalHeader}>Yechimni kiriting</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              placeholder="Yechim matni"
              value={solutionText}
              onChangeText={setSolutionText}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => markSolved(selectedProblemId)}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Saqlash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSolutionModalVisible(false)}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BookScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f2f2f2" },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  searchInput: { backgroundColor: "white", padding: 10, borderRadius: 8, marginBottom: 10 },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  description: { fontSize: 14, marginVertical: 5 },
  category: { fontSize: 12, fontStyle: "italic" },
  difficulty: { fontSize: 12, fontStyle: "italic" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  button: { padding: 10, borderRadius: 8 },
  buttonText: { color: "white", fontWeight: "bold" },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "blue",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { flex: 1, padding: 20, backgroundColor: "#fff" },
  modalHeader: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  addButton: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "red", padding: 15, borderRadius: 8, alignItems: "center" },
  solutionModalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  solutionModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
});
