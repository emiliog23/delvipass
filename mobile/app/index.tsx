import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { api, setToken } from "../src/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Campos requeridos", "Ingresá usuario y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const { token } = await api.login(username.trim(), password.trim());
      setToken(token);
      router.replace("/home");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.emoji}>🎟️</Text>
          <Text style={s.title}>Boletero</Text>
          <Text style={s.subtitle}>Ingresá con tu cuenta de organizador</Text>
        </View>
        <View style={s.card}>
          <Text style={s.label}>Usuario</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="tu_usuario"
            returnKeyType="next"
          />
          <Text style={s.label}>Contraseña</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••"
            returnKeyType="go"
            onSubmitEditing={login}
          />
          <TouchableOpacity style={s.btn} onPress={login} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={s.btnText}>Ingresar</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#667eea" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "800", color: "white" },
  subtitle: { fontSize: 15, color: "rgba(255,255,255,0.8)", marginTop: 6 },
  card: { backgroundColor: "white", borderRadius: 20, padding: 28, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  label: { fontSize: 14, fontWeight: "700", color: "#555", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: "#667eea", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4 },
  btnText: { color: "white", fontWeight: "800", fontSize: 17 },
});
