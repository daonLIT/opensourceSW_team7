// app/(tabs)/mypage.tsx
//123123
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ [수정 1] 없는 함수들(getUser 등) 대신 있는 함수(getAuth 등)로 교체
import { clearAuth, getAuth, saveAuth } from "@/util/utils/auth";
// ✅ [수정 2] 서버 주소 가져오기
import { API_BASE_URL } from "@/constants/api";

// (타입 정의는 그대로 둠)
type UserProfile = {
  userId: string;
  nickname: string;
  email?: string;
  level: number;
  points: number;
  nextLevelPoints: number;
};

// ... LEVEL_META 그대로 유지 ...
const LEVEL_META: Record<
  number,
  { name: string; emoji: string; description: string }
> = {
  1: { name: "씨앗", emoji: "🌱", description: "이제 막 시작한 친환경 러버" },
  2: { name: "새싹", emoji: "🌿", description: "분리수거에 슬슬 눈을 뜨는 중" },
  3: { name: "꽃", emoji: "🌸", description: "환경수호가 일상이 된 단계" },
  4: { name: "나무", emoji: "🌳", description: "주변까지 함께 이끄는 고수" },
  5: { name: "큰 나무", emoji: "🌲", description: "우리 동네 환경 히어로" },
};

export default function MyPageScreen() {
  const router = useRouter();

  // LoggedInUser 타입은 auth.ts에 정의된 대로 사용 (any로 처리하거나 타입 맞춤)
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newNickname, setNewNickname] = useState("");

  // 1) 로그인 유저 불러오기
  useEffect(() => {
    const init = async () => {
      // ✅ [수정 3] getAuth() 사용
      const auth = await getAuth();
      if (!auth || !auth.user) {
        router.replace("/login");
        return;
      }
      setUser(auth.user);
      // id가 숫자라면 문자로 변환해서 전달
      await fetchProfile(String(auth.user.id), auth.accessToken);
    };
    init();
  }, []);

  // 프로필 요청
  const fetchProfile = async (userId: string, token: string) => {
    try {
      setLoading(true);

      // ✅ [수정 4] YOUR_SERVER_URL -> API_BASE_URL 로 변경
      // 현재 백엔드에는 /api/profile 이 없으므로 /auth/me 를 대신 호출해서 기본 정보만 가져옴
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let data: any = {};
      if (res.ok) {
        data = await res.json();
      }

      // 백엔드에 레벨/포인트 기능이 없으므로 기본값(1레벨)으로 설정됨
      const finalProfile: UserProfile = {
        userId,
        nickname: data.name || userId, // 서버의 name을 닉네임으로 사용
        email: data.email || undefined,
        level: (data.level as number) || 1, 
        points: (data.points as number) || 0,
        nextLevelPoints: (data.nextLevelPoints as number) || 5,
      };

      setProfile(finalProfile);
      setLoading(false);

      await checkLevelUpToast(userId, finalProfile.level);
    } catch (e) {
      console.log(e);
      // 실패 시 더미 데이터
      const dummy: UserProfile = {
        userId,
        nickname: userId,
        level: 1,
        points: 0,
        nextLevelPoints: 5,
      };
      setProfile(dummy);
      setLoading(false);
    }
  };

  // 레벨업 축하 알림
  const checkLevelUpToast = async (userId: string, currentLevel: number) => {
    const key = `levelSeen_${userId}`;
    const raw = await AsyncStorage.getItem(key);
    const lastLevel = raw ? parseInt(raw, 10) : 0;

    if (currentLevel > lastLevel) {
      const meta = LEVEL_META[currentLevel] || LEVEL_META[1];
      Alert.alert(
        "🎉 레벨 업!",
        `${meta.emoji} 축하합니다!\n지금은 '${meta.name}' 단계에 도달했어요.`,
        [{ text: "확인" }]
      );
      await AsyncStorage.setItem(key, String(currentLevel));
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          // ✅ [수정 5] clearAuth() 사용
          await clearAuth();
          router.replace("/login");
        },
      },
    ]);
  };

  // 닉네임 수정 열기
  const openEditNickname = () => {
    if (!user) return;
    setNewNickname(user.name || ""); // user.nickname 대신 user.name 사용
    setEditModalVisible(true);
  };

  // 닉네임 수정 저장 (지금 백엔드에는 기능이 없어서 로컬만 바뀜)
  const saveNickname = async () => {
    if (!user || !newNickname.trim()) {
      Alert.alert("오류", "닉네임을 입력해 주세요.");
      return;
    }

    try {
      // ✅ [수정 6] API_BASE_URL 사용 (백엔드 구현 전이라 에러 날 수 있음 -> catch로 이동)
      /* await fetch(`${API_BASE_URL}/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: newNickname.trim() }),
      });
      */

      // 로컬 로그인 정보 업데이트
      const updatedUser = {
        ...user,
        name: newNickname.trim(), // nickname -> name
      };
      
      // ✅ [수정 7] saveAuth 사용
      const auth = await getAuth();
      if (auth) {
        await saveAuth({ ...auth, user: updatedUser });
      }
      
      setUser(updatedUser);

      if (profile) {
        setProfile({
          ...profile,
          nickname: newNickname.trim(),
        });
      }

      setEditModalVisible(false);
      Alert.alert("완료", "닉네임이 변경되었습니다. (로컬 반영)");
    } catch (e) {
      console.log(e);
      Alert.alert("오류", "닉네임 변경 중 문제가 발생했습니다.");
    }
  };

  if (!user || loading || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>마이페이지 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { level, points, nextLevelPoints } = profile;
  const meta = LEVEL_META[level] || LEVEL_META[1];
  const progress =
    nextLevelPoints > 0 ? Math.min(points / nextLevelPoints, 1) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 🔙 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)")}>
            <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>마이페이지</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={30} color="#0f172a" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.nicknameText}>
                {profile.nickname || user.id}
              </Text>
              <Text style={styles.idText}>ID: {user.id}</Text>
              <Text style={styles.emailText}>
                이메일:{" "}
                {profile.email ?? user.email ?? "등록된 이메일이 없습니다."}
              </Text>
            </View>

            <TouchableOpacity style={styles.editBtn} onPress={openEditNickname}>
              <Ionicons name="pencil" size={16} color="#e5e7eb" />
              <Text style={styles.editBtnText}>닉네임 수정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 레벨 카드 */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelEmoji}>{meta.emoji}</Text>
            <View>
              <Text style={styles.levelName}>
                {meta.name} · LV.{level}
              </Text>
              <Text style={styles.levelDesc}>{meta.description}</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { flex: progress }]} />
            <View style={{ flex: 1 - progress }} />
          </View>
          <Text style={styles.progressText}>
            {points} / {nextLevelPoints} 포인트
          </Text>

          <Text style={styles.tipText}>
            1주일 동안 식재료를 버리지 않을수록 포인트가 쌓이고, 레벨이 올라가요! 🌍
          </Text>
        </View>

        {/* 기타 액션들 */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow}>
            <Ionicons name="stats-chart" size={20} color="#60a5fa" />
            <Text style={styles.actionText}>나의 분리수거/절약 기록 (추후)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow}>
            <Ionicons name="information-circle" size={20} color="#a78bfa" />
            <Text style={styles.actionText}>앱 정보 / 팀 소개 (추후)</Text>
          </TouchableOpacity>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fecaca" />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 닉네임 수정 모달 */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>닉네임 수정</Text>
            <TextInput
              style={styles.modalInput}
              value={newNickname}
              onChangeText={setNewNickname}
              placeholder="새 닉네임"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={saveNickname}
              >
                <Text style={styles.modalConfirmText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// 스타일은 그대로 유지 (변경 없음)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 20, gap: 16 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#e5e7eb", marginTop: 8, fontSize: 13 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: { color: "#e5e7eb", fontSize: 20, fontWeight: "700" },

  profileCard: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  nicknameText: { color: "#f9fafb", fontSize: 18, fontWeight: "700" },
  idText: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  emailText: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1d4ed8",
  },
  editBtnText: { color: "#e5e7eb", fontSize: 12, fontWeight: "500" },

  levelCard: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  levelEmoji: { fontSize: 32 },
  levelName: { color: "#f9fafb", fontSize: 18, fontWeight: "700" },
  levelDesc: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
  progressBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 6,
  },
  progressFill: {
    backgroundColor: "#22c55e",
  },
  progressText: {
    color: "#e5e7eb",
    fontSize: 12,
    textAlign: "right",
    marginBottom: 6,
  },
  tipText: { color: "#9ca3af", fontSize: 12, lineHeight: 18 },

  actionsCard: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  actionText: { color: "#e5e7eb", fontSize: 14 },

  logoutBtn: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  logoutText: { color: "#fecaca", fontSize: 14, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "80%",
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  modalTitle: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#e5e7eb",
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  modalCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  modalCancelText: { color: "#9ca3af", fontSize: 13 },
  modalConfirm: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
  },
  modalConfirmText: { color: "#f9fafb", fontSize: 13, fontWeight: "600" },
});