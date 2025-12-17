// app/(tabs)/waste-analysis.tsx
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BackHeader from "../../components/BackHeader"; // ✅ 공통 뒤로가기 헤더

import { API_BASE_URL } from "@/constants/api";
import { getAuth } from "@/util/utils/auth";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function WasteAnalysisScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "안녕하세요! 🧹 분리수거 도우미에요.\n궁금한 쓰레기 종류를 적어주시면,\n어떻게 분리배출해야 하는지 알려드릴게요.\n\n예) \"피자 박스는 어떻게 버려?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ 서버로 메시지 보내기
  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    // 1) 내 메시지 추가
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {

      const auth = await getAuth();
        if (!auth?.accessToken) {
          const botMsg: ChatMessage = {
            id: Date.now().toString() + "-login",
            role: "assistant",
            content: "로그인이 필요해요! 먼저 로그인 해주세요.",
          };
          setMessages((prev) => [...prev, botMsg]);
          setLoading(false);
          return;
        }
      // 2) 서버에 요청 (조장님이 맞춰서 구현하면 됨)
      const res = await fetch(`${API_BASE_URL}/api/waste/qa`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        Authorization: `Bearer ${auth.accessToken}`
       },
        body: JSON.stringify({ question }),
      });

      let replyText =
        "서버에서 응답을 받지 못했어요. 나중에 다시 시도해 주세요.";

      if (res.ok) {
        const data = await res.json();
        // 🔹 백엔드에서 { reply: "..." } 형태로 보내준다고 가정
        replyText = data.answer ?? replyText;
      }

      // 3) AI 답변 추가
      const botMsg: ChatMessage = {
        id: Date.now().toString() + "-bot",
        role: "assistant",
        content: replyText,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const botMsg: ChatMessage = {
        id: Date.now().toString() + "-error",
        role: "assistant",
        content:
          "오류가 발생했어요. 네트워크 상태를 확인하거나, 잠시 후 다시 시도해 주세요.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubbleRow,
          isUser
            ? { justifyContent: "flex-end" }
            : { justifyContent: "flex-start" },
        ]}
      >
        {/* 봇일 때만 아이콘 표시 */}
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons name="leaf" size={18} color="#22c55e" />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          {isUser ? (
            <Text style={styles.userText}>{item.content}</Text>
          ) : (
            <Markdown style={mdStyles}>{item.content}</Markdown>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.container}>
          {/* 🔙 공통 뒤로가기 + 제목 헤더 */}
          <BackHeader title="분리수거 AI 도우미" />

          {/* 채팅 리스트 */}
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

          {/* 로딩 표시 */}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>
                AI가 답변을 작성 중이에요...
              </Text>
            </View>
          )}

          {/* 입력창 */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="예: 우유팩은 어떻게 버려?"
              placeholderTextColor="#6b7280"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!input.trim() || loading) && { opacity: 0.4 },
              ]}
              disabled={!input.trim() || loading}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  listContent: {
    paddingVertical: 8,
    gap: 6,
  },
  bubbleRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#022c22",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userBubble: {
    backgroundColor: "#3b82f6",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#111827",
    borderBottomLeftRadius: 4,
  },
  userText: { color: "#f9fafb", fontSize: 14 },
  botText: { color: "#e5e7eb", fontSize: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    maxHeight: 90,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#020617",
    color: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#1f2937",
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 12,
  },
});

const mdStyles = {
  body: { color: "#e5e7eb", fontSize: 14, lineHeight: 20 },
  strong: { color: "#ffffff" },        // **굵게**
  em: { color: "#e5e7eb" },            // *기울임*
  bullet_list: { color: "#e5e7eb" },
  ordered_list: { color: "#e5e7eb" },
  heading1: { color: "#ffffff", fontSize: 18 },
  heading2: { color: "#ffffff", fontSize: 16 },
  code_inline: { backgroundColor: "#0b1220", color: "#e5e7eb" },
};
//ㅁㄴㅇㅁㄴㅇ