// app/(tabs)/recipes.tsx
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
  Modal,
  ScrollView,
  Dimensions,
  Linking, 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/constants/api";
import { getAuth } from "@/util/utils/auth";

const { width } = Dimensions.get("window");

export default function RecipeRecommendScreen() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // 추천 결과 (리스트로 받음)
  const [modalVisible, setModalVisible] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]); // ✅ 여러 개 저장
  const [aiLoading, setAiLoading] = useState(false);

  const [formattedMap, setFormattedMap] = useState<Record<string, string>>({});
  const [rewriteLoadingMap, setRewriteLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const auth = await getAuth();
      if (!auth) return;
      const res = await fetch(`${API_BASE_URL}/api/ingredients`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIngredients(data);
      }
    } catch (e) { console.error(e); }
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((sid) => sid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  // 3. AI 추천 요청 (POST)
  const handleRecommend = async () => {
    if (selectedIds.length === 0) {
      Alert.alert("알림", "재료를 최소 1개 이상 선택해주세요!");
      return;
    }

    // ✅ [추가] 로그인 토큰 가져오기
    const auth = await getAuth();
    if (!auth) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    // 선택된 재료의 이름만 추출
    const selectedNames = ingredients
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => item.name);

    setAiLoading(true);
    setModalVisible(true);
    setFormattedMap({});       
    setRewriteLoadingMap({});

    try {
      // ✅ 백엔드 API 호출 (헤더에 토큰 추가!)
      const res = await fetch(`${API_BASE_URL}/api/recommend/recipes`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.accessToken}` // 👈 이 줄이 꼭 있어야 합니다!
        },
        body: JSON.stringify({ ingredients: selectedNames, top_k: 10 }),
      });

      if (!res.ok) {
        // 에러 내용을 확인하기 위해 로그 출력
        const errText = await res.text();
        console.log("서버 에러 내용:", errText);
        throw new Error("서버 에러");
      }

      const data = await res.json(); 
      setRecipes(data.results); 
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "AI가 레시피를 생각하다가 잠들었어요. 다시 시도해주세요.");
      setModalVisible(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRewrite = async (recipe: any, key: string) => {
    const auth = await getAuth();
    if (!auth?.accessToken) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    // 이미 정리된 결과가 있으면 재호출 안 함
    if (formattedMap[key]) return;

    // 백엔드에서 내려주는 원문 조리법(둘 중 하나)
    const rawText =
      (recipe.instructions_raw_text ?? "").trim() ||
      (Array.isArray(recipe.instructions_raw_list) ? recipe.instructions_raw_list.join("\n") : "");

    if (!rawText.trim()) {
      Alert.alert("조리법 없음", "이 레시피는 CSV에 조리법 데이터가 없어요.");
      return;
    }

    setRewriteLoadingMap((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/recipes/rewrite-instructions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          title: recipe.title,
          instructions_raw_text: rawText,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.log("rewrite 서버 에러:", errText);
        throw new Error("rewrite 서버 에러");
      }
      

      const data = await res.json();
      const formatted = String(data.formatted ?? "")
        .replace(/\\n/g, "\n")   // ✅ 이게 핵심
        .replace(/\\t/g, "\t")
        .replace(/\*\*(.*?)\*\*/g, "$1");
      setFormattedMap((prev) => ({ ...prev, [key]: data.formatted ?? "" }));
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "조리법 정리에 실패했어요. 다시 시도해주세요.");
    } finally {
      setRewriteLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ✅ 여기 추가 (return 위)
  const openUrl = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("오류", "링크를 열 수 없어요.");
    }
  };

  // 재료 렌더링
  const renderIngredient = ({ item }: { item: any }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.ingCard, isSelected && styles.ingCardSelected]}
        onPress={() => toggleSelection(item.id)}
      >
        <View>
          <Text style={[styles.ingName, isSelected && styles.ingNameSelected]}>{item.name}</Text>
          <Text style={styles.ingMeta}>{item.quantity}{item.unit}</Text>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧑‍🍳 AI 레시피 추천</Text>
        <Text style={styles.subtitle}>재료를 선택하면 AI 셰프가 요리를 제안해요!</Text>
      </View>

      <FlatList
        data={ingredients}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderIngredient}
        numColumns={3} // 바둑판 배열
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.recommendBtn} onPress={handleRecommend}>
          <Ionicons name="sparkles" size={20} color="white" />
          <Text style={styles.btnText}>
            {selectedIds.length}개 재료로 추천받기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 결과 모달 (가로 스크롤) */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>추천 레시피 ({recipes.length})</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {aiLoading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>AI가 최적의 레시피를 분석 중...</Text>
            </View>
          ) : (
            <ScrollView horizontal pagingEnabled style={{ flex: 1 }}>
              {recipes.map((recipe, idx) => {
                const key = String(recipe.recipe_id ?? idx);
                const formatted = formattedMap[key];
                const rewriting = !!rewriteLoadingMap[key];

                return (
                  <ScrollView key={key} style={styles.recipeCard}>
                    <Text style={styles.recipeBadge}>BEST {idx + 1}</Text>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <Text style={styles.calories}>👀 조회수 {recipe.views}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>✅ 내가 가진 재료</Text>
                    <View style={styles.tagRow}>
                      {(recipe.matched_inputs ?? []).map((ing: string, i: number) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>{ing}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>❗ 부족한 재료</Text>
                    <View style={styles.tagRow}>
                      {(recipe.missing_inputs ?? []).map((ing: string, i: number) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>{ing}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.divider} />

                    {/* ✅ 링크 */}
                    <Text style={styles.sectionTitle}>🔗 링크</Text>
                    {recipe.url ? (
                      <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(recipe.url)}>
                        <Ionicons name="link" size={16} color="white" />
                        <Text style={styles.linkText}>레시피 페이지 열기</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.instructions}>링크가 없어요.</Text>
                    )}

                    <View style={styles.divider} />

                    {/* ✅ 조리법(LLM 정리) */}
                    <Text style={styles.sectionTitle}>🍳 조리법</Text>

                    {!formatted && (
                      <Text style={styles.hint}>
                        조리법이 길고 읽기 어려울 수 있어요. 아래 버튼을 누르면 AI가 단계별로 정리해줘요.
                      </Text>
                    )}

                    <TouchableOpacity
                      style={[styles.rewriteBtn, (formatted || rewriting) && { opacity: 0.7 }]}
                      onPress={() => handleRewrite(recipe, key)}
                      disabled={!!formatted || rewriting}
                    >
                      {rewriting ? (
                        <>
                          <ActivityIndicator size="small" color="white" />
                          <Text style={styles.rewriteText}>정리 중...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={16} color="white" />
                          <Text style={styles.rewriteText}>{formatted ? "정리 완료" : "AI로 조리법 정리하기"}</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {!!formatted && <Text style={styles.instructions}>{formatted}</Text>}

                    <View style={{ height: 120 }} />
                  </ScrollView>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "white" },
  subtitle: { color: "#94a3b8", marginTop: 5 },

  ingCard: {
    flex: 1, backgroundColor: "#1e293b", padding: 12, borderRadius: 12,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#334155", minHeight: 70
  },
  ingCardSelected: { borderColor: "#3b82f6", backgroundColor: "#1e293b" },
  ingName: { color: "#e5e7eb", fontWeight: "600" },
  ingNameSelected: { color: "#60a5fa" },
  ingMeta: { color: "#94a3b8", fontSize: 12 },

  bottomBar: { position: "absolute", bottom: 0, width: "100%", padding: 20, backgroundColor: "#0f172a" },
  recommendBtn: { backgroundColor: "#3b82f6", padding: 16, borderRadius: 16, flexDirection: "row", justifyContent: "center", gap: 8 },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },

  modalContainer: { flex: 1, backgroundColor: "#0f172a" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", padding: 20 },
  modalTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#94a3b8", marginTop: 20 },

  recipeCard: { width: width, padding: 20 },
  recipeBadge: { color: "#facc15", fontWeight: "bold", marginBottom: 4 },
  recipeTitle: { color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  calories: { color: "#f87171" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 20 },
  sectionTitle: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: "#334155", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: "#e5e7eb" },
  instructions: { color: "#cbd5e1", lineHeight: 24, fontSize: 16 },

  linkBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  linkText: { color: "white", fontWeight: "bold" },

  hint: { color: "#94a3b8", lineHeight: 20, marginBottom: 10 },

  rewriteBtn: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  rewriteText: { color: "white", fontWeight: "bold" },
});
//ㅁㄴㅇㅁㄴ