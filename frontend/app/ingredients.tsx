// app/ingredients.tsx
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function IngredientsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🥕 식재료 관리</Text>
        <Text style={styles.desc}>
          - Streamlit의 "식재료 등록 / 관리" 화면에 해당하는 곳입니다.{"\n"}
          - 나중에 여기서 식재료 목록 조회, 추가/수정 기능을 구현합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#e5e7eb", marginBottom: 12 },
  desc: { fontSize: 14, color: "#9ca3af", lineHeight: 20 },
});
