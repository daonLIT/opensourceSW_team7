import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "auth";
const USER_KEY = "loggedInUser";

/** 백엔드 UserOut과 동일 */
export type User = {
  id: number;
  email: string;
  name?: string;
};

export type AuthState = {
  accessToken: string;
  user: User;
};

export async function saveAuth(auth: AuthState) {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export async function getAuth(): Promise<AuthState | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearAuth() {
  await AsyncStorage.removeItem(AUTH_KEY);
}

export type LoggedInUser = {
  id: string;        // 아이디
  nickname: string;  // 닉네임 (지금은 임시로라도 저장)
  email?: string;
};

// 유저 저장
export async function saveUser(user: LoggedInUser) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

// 유저 불러오기
export async function getUser(): Promise<LoggedInUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 유저 삭제(로그아웃용)
export async function clearUser() {
  await AsyncStorage.removeItem(USER_KEY);
}