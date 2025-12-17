// app/(tabs)/ingredients.tsx
// (또는 app/ingredients.tsx - 파일 위치에 맞게 수정하세요)

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { API_BASE_URL } from "@/constants/api";
import { getAuth } from "@/util/utils/auth";

type Ingredient = {
  id: number;
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expected_expiry?: string;
};

export default function IngredientsScreen() {
  const router = useRouter();

  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(""); // 에러 메시지 저장용

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // 1. 로그인 정보 확인
      const auth = await getAuth();
      console.log("🔑 현재 저장된 토큰:", auth);
      if (!auth) {
        Alert.alert("로그인 필요", "다시 로그인 해주세요.");
        router.replace("/login");
        return;
      }

      // 2. 요청 주소 확인 (화면에 띄워보려고 변수에 담음)
      const url = `${API_BASE_URL}/api/ingredients`;
      console.log("Fetching URL:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });


      // 3. 응답 에러 체크
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`서버 응답 오류 (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      // 에러 내용을 화면에 보여줌 (흰색 화면 방지)
      setErrorMsg(`불러오기 실패:\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteIngredient = async (id: number) => {
      // (기존 삭제 로직과 동일 - 생략 가능하거나 필요시 추가)
      // 테스트를 위해 일단 생략, 필요하면 이전 코드 복사해서 넣으세요.
      Alert.alert("알림", "삭제 기능은 리스트가 보이면 테스트합시다!");
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // 🚨 1. 에러 발생 시 보여줄 화면 (디버깅용)
  if (errorMsg) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="warning" size={50} color="#ef4444" />
        <Text style={styles.errorTitle}>문제가 발생했어요!</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.debugText}>요청 주소: {API_BASE_URL}/api/ingredients</Text>
        
        <TouchableOpacity style={styles.retryBtn} onPress={fetchIngredients}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ⏳ 2. 로딩 중 화면
  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>냉장고 문 여는 중...</Text>
      </SafeAreaView>
    );
  }

  // ✅ 3. 정상 화면 (리스트)
  const renderItem = ({ item }: { item: Ingredient }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.category ?? "기타"} · {item.quantity ?? 1}{item.unit ?? "개"}
        </Text>
        {item.expected_expiry && (
          <Text style={styles.expiry}>D-Day: {item.expected_expiry}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => deleteIngredient(item.id)}>
        <Ionicons name="trash" size={22} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>나의 냉장고</Text>
        <TouchableOpacity onPress={() => router.push("/ingredients-add" as any)}>
          <Ionicons name="add-circle" size={30} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>냉장고가 텅 비었어요! 🥬</Text>
            <Text style={styles.emptySubText}>+ 버튼을 눌러 재료를 추가해보세요.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  
  // 에러/로딩 화면 스타일 (가운데 정렬)
  centerContainer: { 
    flex: 1, 
    backgroundColor: "#0f172a", 
    justifyContent: "center", 
    alignItems: "center",
    padding: 20 
  },
  errorTitle: { color: "white", fontSize: 22, fontWeight: "bold", marginTop: 10 },
  errorText: { color: "#fca5a5", fontSize: 16, marginTop: 10, textAlign: "center", lineHeight: 24 },
  debugText: { color: "#64748b", fontSize: 12, marginTop: 20 },
  loadingText: { color: "#94a3b8", marginTop: 10 },
  retryBtn: { marginTop: 30, backgroundColor: "#3b82f6", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  retryText: { color: "white", fontWeight: "bold", fontSize: 16 },

  // 기존 스타일
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#e5e7eb" },
  card: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1e293b", padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: "#334155" },
  name: { fontSize: 16, fontWeight: "600", color: "#e5e7eb" },
  meta: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  expiry: { fontSize: 12, color: "#f97316", marginTop: 4 },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#9ca3af", fontSize: 18, fontWeight: "bold" },
  emptySubText: { color: "#64748b", fontSize: 14, marginTop: 8 },
});
//ㅁㄴㅇㅁㅇㄴㅁㅇ