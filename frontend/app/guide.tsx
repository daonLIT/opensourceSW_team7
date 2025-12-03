// app/guide.tsx
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function GuideScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>♻ 환경 / 분리배출 가이드</Text>
        <Text style={styles.desc}>
          - Streamlit의 탭/expander로 만든 가이드 화면을{"\n"}
          - RN에서는 아코디언/카드 리스트 형태로 재구성할 예정입니다.
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
