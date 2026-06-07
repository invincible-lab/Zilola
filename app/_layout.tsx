import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      {/* Index sahifada header yo'q */}
      <Stack.Screen 
        name="index"
        options={{ headerShown: false }}
      />

      {/* Qolgan sahifalar uchun nom beramiz */}
      <Stack.Screen 
        name="expo"
        options={{ title: "Sertifikat Sahifa" }}
      />

      <Stack.Screen 
        name="book"
        options={{ title: "Masalalar Sahifa" }}
      />

      <Stack.Screen 
        name="test"
        options={{ title: "Test Sahifa" }}
      />

      <Stack.Screen 
        name="home"
        options={{ title: "Video darsliklar" }}
      />
    </Stack>
  );
}
