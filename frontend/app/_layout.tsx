// app/_layout.tsx
//asdadasdasdads
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: 'index', // 첫 화면은 index (검사)
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* ✅ 로그인/회원가입 화면 부활! */}
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        {/* Ingredients Add 등 다른 화면들도 자동으로 잡힘 */}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
//ㅁㅇㅁㄴㅇ