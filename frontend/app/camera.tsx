// app/camera.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { API_BASE_URL } from "@/constants/api";
import { getAuth } from "@/util/utils/auth";

export default function CameraScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false); // 분석 중 로딩 상태

  // 1. 카메라 촬영
  const handleOpenCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "카메라 권한을 허용해 주세요.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // 2. 갤러리 선택
  const handleOpenGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한을 허용해 주세요.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // 3. 사진 지우기
  const handleClear = () => {
    setImageUri(null);
  };

  // 🚀 4. YOLO 서버로 사진 전송 및 분석 요청
  const handleAnalyze = async () => {
    if (!imageUri) return;

    setAnalyzing(true);
    try {
      const auth = await getAuth();
      if (!auth) {
        Alert.alert("오류", "로그인이 필요합니다.");
        router.replace("/login");
        return;
      }

      // FormData 생성 (사진 파일 담기)
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "food_image.jpg",
        type: "image/jpeg",
      } as any);

      console.log("📤 분석 요청 보냄:", `${API_BASE_URL}/api/ingredients/analyze`);

      // 백엔드 분석 API 호출
      const res = await fetch(`${API_BASE_URL}/api/ingredients/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("분석에 실패했습니다. (서버 에러)");
      }

      const data = await res.json();
      
      // 분석 성공 시 재료 추가 화면으로 이동 (데이터 전달)
      Alert.alert("분석 완료!", `AI가 찾은 재료: ${data.name || "알 수 없음"}`, [
        {
          text: "확인",
          onPress: () => {
            // 결과값을 들고 '재료 추가' 화면으로 이동
            router.push({
              pathname: "/ingredients_add",
              params: {
                autoName: data.name,
                autoCategory: data.category,
                autoQuantity: data.quantity,
              },
            });
          },
        },
      ]);

    } catch (e) {
      console.error(e);
      Alert.alert("실패", "사진 분석 중 오류가 발생했습니다.\n서버가 켜져 있는지 확인해주세요.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 상단바 */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <Text style={styles.title}>📷 AI 음식 분석</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* 메인 영역 */}
        <View style={styles.previewBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="images-outline" size={60} color="#334155" />
              <Text style={styles.previewText}>
                음식 사진을 찍거나 올려주세요.{"\n"}AI가 재료를 자동으로 분석합니다.
              </Text>
            </View>
          )}
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.bottomArea}>
          {imageUri ? (
            // ✅ 사진이 있을 때만 이 버튼들이 나옵니다!
            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryButton} onPress={handleClear} disabled={analyzing}>
                <Text style={styles.secondaryText}>다시 선택</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.analyzeButton, analyzing && styles.disabledBtn]} 
                onPress={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="white" />
                    <Text style={styles.analyzeText}>AI 분석하기</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            // 사진 없을 때: 촬영 & 갤러리 버튼
            <View style={styles.buttonRow}>
              <Pressable style={styles.primaryButton} onPress={handleOpenCamera}>
                <Ionicons name="camera" size={20} color="#0f172a" />
                <Text style={styles.primaryText}>카메라로 촬영</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleOpenGallery}>
                <Ionicons name="image" size={20} color="#e5e7eb" />
                <Text style={styles.secondaryText}>갤러리 선택</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "700", color: "#e5e7eb" },
  
  previewBox: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  image: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", gap: 10 },
  previewText: { color: "#94a3b8", textAlign: "center", lineHeight: 22 },

  bottomArea: { height: 80, justifyContent: "center" },
  buttonRow: { flexDirection: "row", gap: 12 },
  actionRow: { flexDirection: "row", gap: 12 },

  primaryButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#0f172a", fontSize: 16, fontWeight: "bold" },

  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#475569",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: "#e5e7eb", fontSize: 16, fontWeight: "600" },

  analyzeButton: {
    flex: 2, // 더 크게
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  analyzeText: { color: "white", fontSize: 16, fontWeight: "bold" },
  disabledBtn: { opacity: 0.7 },
});
//ㅁㄴㅇㅁㄴㅇ