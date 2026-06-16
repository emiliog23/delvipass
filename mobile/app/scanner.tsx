import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Animated, Vibration, SafeAreaView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { api, setToken } from "../src/lib/api";

type Result = {
  ok: boolean;
  alreadyEntered?: boolean;
  guestName?: string;
  error?: string;
  event?: { name: string };
} | null;

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  function showResult(r: Result) {
    setResult(r);
    setScanning(false);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    Vibration.vibrate(r?.ok ? [0, 80] : [0, 100, 50, 100]);
    setTimeout(() => resetScanner(), 3500);
  }

  function resetScanner() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setResult(null);
      scaleAnim.setValue(0.8);
      setScanning(true);
    });
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    try {
      const res = await api.validateQR(data);
      showResult(res);
    } catch {
      showResult({ ok: false, error: "Error de conexión con el servidor" });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    Alert.alert("Cerrar sesión", "¿Salir de la app?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => { setToken(null); router.replace("/"); } },
    ]);
  }

  if (!permission) return <View style={s.page}><ActivityIndicator color="white" size="large" /></View>;

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.page}>
        <Text style={s.permText}>Se necesita acceso a la cámara</Text>
        <TouchableOpacity style={s.btn} onPress={requestPermission}>
          <Text style={s.btnText}>Permitir cámara</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.page}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Header overlay */}
      <SafeAreaView style={s.headerWrap}>
        <View style={s.header}>
          <Text style={s.headerTitle}>🎟️ Boletero</Text>
          <TouchableOpacity onPress={logout}>
            <Text style={s.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Scanning frame */}
      {!result && (
        <View style={s.frameWrap}>
          <View style={s.frame}>
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
          </View>
          <Text style={s.hint}>{loading ? "Validando..." : "Apuntá al código QR del invitado"}</Text>
          {loading && <ActivityIndicator color="white" size="large" style={{ marginTop: 16 }} />}
        </View>
      )}

      {/* Result overlay */}
      {result && (
        <Animated.View style={[s.resultOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[s.resultCard, { transform: [{ scale: scaleAnim }] }]}>
            {result.ok ? (
              <>
                <Text style={s.resultEmoji}>✅</Text>
                <Text style={[s.resultTitle, { color: "#16a34a" }]}>¡Acceso permitido!</Text>
                <Text style={s.resultName}>{result.guestName}</Text>
                {result.event && <Text style={s.resultEvent}>{result.event.name}</Text>}
              </>
            ) : result.alreadyEntered ? (
              <>
                <Text style={s.resultEmoji}>⚠️</Text>
                <Text style={[s.resultTitle, { color: "#d97706" }]}>Ya ingresó</Text>
                <Text style={s.resultName}>{result.guestName}</Text>
                <Text style={s.resultSub}>Este código ya fue utilizado</Text>
              </>
            ) : (
              <>
                <Text style={s.resultEmoji}>❌</Text>
                <Text style={[s.resultTitle, { color: "#dc2626" }]}>Acceso denegado</Text>
                <Text style={s.resultSub}>{result.error || "Código inválido"}</Text>
              </>
            )}
            <TouchableOpacity style={s.scanAgainBtn} onPress={resetScanner}>
              <Text style={s.scanAgainText}>Escanear otro</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const CORNER = 24;
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" },
  permText: { color: "white", fontSize: 18, marginBottom: 20, textAlign: "center", paddingHorizontal: 32 },
  headerWrap: { position: "absolute", top: 0, left: 0, right: 0 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "rgba(0,0,0,0.6)" },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  logoutText: { color: "rgba(255,255,255,0.7)", fontSize: 15 },
  frameWrap: { alignItems: "center", justifyContent: "center" },
  frame: { width: 260, height: 260, marginBottom: 24 },
  corner: { position: "absolute", width: CORNER, height: CORNER, borderColor: "white", borderWidth: 3 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },
  hint: { color: "white", fontSize: 15, textAlign: "center", opacity: 0.9 },
  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 24 },
  resultCard: { backgroundColor: "white", borderRadius: 24, padding: 36, alignItems: "center", width: "100%", maxWidth: 340, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  resultEmoji: { fontSize: 60, marginBottom: 12 },
  resultTitle: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  resultName: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 4 },
  resultEvent: { fontSize: 14, color: "#888", marginBottom: 4 },
  resultSub: { fontSize: 15, color: "#777", textAlign: "center" },
  scanAgainBtn: { marginTop: 24, backgroundColor: "#667eea", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  scanAgainText: { color: "white", fontWeight: "800", fontSize: 16 },
  btn: { backgroundColor: "#667eea", borderRadius: 12, padding: 16, paddingHorizontal: 32 },
  btnText: { color: "white", fontWeight: "700", fontSize: 16 },
});
