// app/expiry.tsx
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function ExpiryScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>⏰ 소비기한 알림</Text>
        <Text style={styles.desc}>
          - Streamlit의 "소비기한 알림" 화면에 해당합니다.{"\n"}
          - 백엔드에서 식재료 데이터와 남은 일수를 계산해 받아와서{"\n"}
          - RN 쪽에서는 리스트/메트릭 카드로 보여 줄 예정입니다.
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
