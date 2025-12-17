// app/register.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
    ScrollView
} from "react-native";

import { API_BASE_URL } from "@/constants/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState(""); // 이름(닉네임)
  const [loading, setLoading] = useState(false);

  // 👉 회원가입 버튼 클릭 시
  const handleRegister = async () => {
    if (!email || !password || !nickname) {
      Alert.alert("입력 오류", "이메일, 비밀번호, 닉네임을 모두 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // ✅ 수정 포인트: /api를 빼고 /auth/register 로 요청
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          name: nickname, // 백엔드 스키마(UserCreate)에 name 필드가 있음
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        Alert.alert("회원가입 실패", errorData.detail || "이미 가입된 이메일이거나 오류가 발생했습니다.");
        return;
      }

      // 성공 시
      Alert.alert("가입 성공", "회원가입이 완료되었습니다! 로그인해주세요.", [
        {
          text: "확인",
          onPress: () => router.replace("/login"),
        },
      ]);

    } catch (e) {
      console.error(e);
      Alert.alert("연결 오류", "서버와 연결할 수 없습니다. IP주소나 포트를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* 상단 제목 */}
          <View style={styles.header}>
            <Text style={styles.logoEmoji}>👋</Text>
            <Text style={styles.title}>환영합니다!</Text>
            <Text style={styles.subtitle}>
              회원가입하고 나만의 스마트한 냉장고를 만들어보세요.
            </Text>
          </View>

          {/* 입력 폼 */}
          <View style={styles.form}>
            {/* 이메일 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="이메일 (example@email.com)"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* 닉네임 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="닉네임 (이름)"
                placeholderTextColor="#6b7280"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            {/* 비밀번호 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* 회원가입 버튼 */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? "가입 중..." : "회원가입"}
              </Text>
            </TouchableOpacity>

            {/* 로그인으로 돌아가기 */}
            <TouchableOpacity
              style={styles.loginLinkButton}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.loginLinkText}>이미 계정이 있으신가요? 로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 32 },
  logoEmoji: { fontSize: 48, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#e5e7eb", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  form: { gap: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  input: { flex: 1, color: "white", fontSize: 16 },
  registerButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { backgroundColor: "#1d4ed8", opacity: 0.7 },
  registerButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  loginLinkButton: { alignItems: "center", marginTop: 12 },
  loginLinkText: { color: "#60a5fa", fontSize: 14 },
});