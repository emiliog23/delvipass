import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Animated, Vibration, SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { api } from "../src/lib/api";

type Result = {
  ok: boolean;
  alreadyEntered?: boolean;
  guestName?: string;
  error?: string;
  event?: { name: string };
} | null;

const FRAME_SIZE = 260;

export default function ScannerScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  function isInFrame(bounds?: { origin: { x: number; y: number }; size: { width: number; height: number } }) {
    if (!bounds) return true;
    const cx = bounds.origin.x + bounds.size.width / 2;
    const cy = bounds.origin.y + bounds.size.height / 2;
    const frameLeft = (screenWidth - FRAME_SIZE) / 2;
    const frameTop = (screenHeight - FRAME_SIZE) / 2;
    return cx >= frameLeft && cx <= frameLeft + FRAME_SIZE && cy >= frameTop && cy <= frameTop + FRAME_SIZE;
  }

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

  async function handleBarCodeScanned({ data, bounds }: { data: string; bounds?: { origin: { x: number; y: number }; size: { width: number; height: number } } }) {
    if (!scanning || loading) return;
    if (!isInFrame(bounds)) return;
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

      {/* Overlay oscuro con hueco central */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Franja superior */}
        <View style={[s.mask, { height: (screenHeight - FRAME_SIZE) / 2 }]} />
        {/* Franja media: lados izquierdo y derecho */}
        <View style={{ flexDirection: "row", height: FRAME_SIZE }}>
          <View style={[s.mask, { width: (screenWidth - FRAME_SIZE) / 2 }]} />
          <View style={{ width: FRAME_SIZE }} />
          <View style={[s.mask, { width: (screenWidth - FRAME_SIZE) / 2 }]} />
        </View>
        {/* Franja inferior */}
        <View style={[s.mask, { flex: 1 }]} />
      </View>

      {/* Header overlay */}
      <SafeAreaView style={s.headerWrap}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace("/home")} style={s.backBtn}>
            <Text style={s.backText}>Volver</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Escanear QR</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      {/* Marco con esquinas y hint */}
      {!result && (
        <View style={s.frameWrap} pointerEvents="none">
          <View style={[s.frame, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
          </View>
          <Text style={s.hint}>{loading ? "Validando..." : "Apuntá al código QR del invitado"}</Text>
          {loading && <ActivityIndicator color="white" size="large" style={{ marginTop: 16 }} />}
        </View>
      )}

      {/* Resultado */}
      {result && (
        <Animated.View style={[s.resultOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[s.resultCard, { transform: [{ scale: scaleAnim }] }]}>
            {result.ok ? (
              <>
                <Text style={s.resultEmoji}>✅</Text>
                <Text style={[s.resultTitle, { color: "#16a34a" }]}>Acceso permitido</Text>
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
  mask: { backgroundColor: "rgba(0,0,0,0.6)" },
  permText: { color: "white", fontSize: 18, marginBottom: 20, textAlign: "center", paddingHorizontal: 32 },

  headerWrap: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backBtn: { width: 60 },
  backText: { color: "#7c3aed", fontSize: 16, fontWeight: "700" },
  headerTitle: { color: "white", fontSize: 17, fontWeight: "700" },

  frameWrap: { alignItems: "center", justifyContent: "center" },
  frame: { marginBottom: 24 },
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
  scanAgainBtn: { marginTop: 24, backgroundColor: "#7c3aed", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  scanAgainText: { color: "white", fontWeight: "800", fontSize: 16 },
  btn: { backgroundColor: "#7c3aed", borderRadius: 12, padding: 16, paddingHorizontal: 32 },
  btnText: { color: "white", fontWeight: "700", fontSize: 16 },
});
