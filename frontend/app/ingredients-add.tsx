// app/ingredients-add.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router"; // ✅ useLocalSearchParams 추가
import React, { useState, useEffect } from "react"; // ✅ useEffect 추가
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

import { API_BASE_URL } from "@/constants/api";
import { getAuth } from "@/util/utils/auth";
import { CATEGORIES } from "@/constants/indredientData";

export default function IngredientAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // ✅ 카메라에서 보낸 데이터 받기

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("개");
  const [category, setCategory] = useState("기타");
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ 화면이 켜질 때, 카메라에서 넘어온 데이터가 있으면 자동으로 채우기
  useEffect(() => {
    if (params.autoName) {
      setName(params.autoName as string);
    }
    if (params.autoCategory) {
      setCategory(params.autoCategory as string);
    }
    if (params.autoQuantity) {
      setQuantity(String(params.autoQuantity));
    }
  }, [params]);

  const handleSave = async () => {
    if (!name) {
      Alert.alert("입력 오류", "재료 이름을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const auth = await getAuth();
      if (!auth) {
        Alert.alert("로그인 필요", "로그인이 풀렸습니다.");
        router.replace("/login");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/ingredients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          name: name,
          category: category,
          quantity: parseFloat(quantity) || 1,
          unit: unit,
          expected_expiry: expiry || null,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      Alert.alert("성공", `${name} 냉장고 등록 완료! 🥬`, [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert("저장 실패", "오류가 발생했습니다.\n" + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#e5e7eb" />
            </TouchableOpacity>
            <Text style={styles.title}>재료 추가</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 카메라 버튼 */}
          <TouchableOpacity
            style={styles.cameraCard}
            onPress={() => router.push("/camera")}
          >
            <View style={styles.cameraIconCircle}>
              <Ionicons name="camera" size={32} color="white" />
            </View>
            <View>
              <Text style={styles.cameraTitle}>AI 카메라로 촬영하기</Text>
              <Text style={styles.cameraDesc}>
                영수증이나 식재료를 찍으면 자동으로 입력돼요!
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>또는 직접 입력</Text>

          {/* 입력 폼 */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>재료 이름</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 당근, 우유"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>카테고리</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      category === cat && styles.catChipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catText,
                        category === cat && styles.catTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>수량</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>단위</Text>
                <TextInput
                  style={styles.input}
                  placeholder="개, kg, L"
                  placeholderTextColor="#6b7280"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>소비기한 (선택)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6b7280"
                value={expiry}
                onChangeText={setExpiry}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "냉장고에 넣는 중..." : "냉장고에 넣기"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scrollContent: { padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "white" },
  
  cameraCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  cameraIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cameraTitle: { fontSize: 16, fontWeight: "bold", color: "white", marginBottom: 4 },
  cameraDesc: { fontSize: 12, color: "#94a3b8" },

  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#64748b", marginBottom: 12 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, color: "#e5e7eb", fontWeight: "600" },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    color: "white",
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 12 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    marginRight: 8,
  },
  catChipActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  catText: { color: "#94a3b8", fontSize: 14 },
  catTextActive: { color: "white", fontWeight: "bold" },
  saveButton: {
    marginTop: 40,
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: "#020617", fontSize: 16, fontWeight: "bold" },
});
//ㅁㄴㅇㅁㄴㅇㅁㅇㄴ