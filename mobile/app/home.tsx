import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { api, setToken, StatsResult } from "../src/lib/api";

type EventStat = StatsResult["events"][number];

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchIdRef = useRef(0); // in-flight guard: ignores stale responses

  const loadStats = useCallback(async () => {
    const id = ++fetchIdRef.current;
    try {
      const data = await api.getStats();
      if (id !== fetchIdRef.current) return; // stale response, discard
      setStats(data);
    } catch (err: any) {
      if (id !== fetchIdRef.current) return;
      // 401 → token expired or invalid, force logout
      if (err?.message?.includes("401") || err?.message?.includes("autorizado")) {
        setToken(null);
        router.replace("/");
        return;
      }
      // other errors: silently keep previous stats
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadStats();
    }, [loadStats])
  );

  function logout() {
    Alert.alert("Cerrar sesión", "¿Salir de la app?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => {
          setToken(null);
          router.replace("/");
        },
      },
    ]);
  }

  const entered = stats?.entered ?? 0;
  const total = stats?.total ?? 0;
  const pct = total > 0 ? entered / total : 0;

  return (
    <SafeAreaView style={s.page}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Boletero</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={s.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stats?.events ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStats();
            }}
            tintColor="#7c3aed"
          />
        }
        ListHeaderComponent={
          <View style={s.counterCard}>
            {loading ? (
              <ActivityIndicator color="#7c3aed" size="large" style={{ paddingVertical: 32 }} />
            ) : (
              <>
                <Text style={s.counterLabel}>Entradas ingresadas</Text>
                <View style={s.counterRow}>
                  <Text style={s.counterEntered}>{entered}</Text>
                  <Text style={s.counterSep}> / </Text>
                  <Text style={s.counterTotal}>{total}</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${Math.round(pct * 100)}%` }]} />
                </View>
                <Text style={s.counterPct}>
                  {total > 0 ? `${Math.round(pct * 100)}% del aforo` : "Sin entradas cargadas"}
                </Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={s.empty}>No hay eventos creados</Text>
          ) : null
        }
        renderItem={({ item }: { item: EventStat }) => {
          const epct = item.total > 0 ? item.entered / item.total : 0;
          return (
            <View style={s.eventRow}>
              <View style={s.eventInfo}>
                <Text style={s.eventName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={s.eventVenue} numberOfLines={1}>
                  {item.venue}
                </Text>
              </View>
              <View style={s.eventCountWrap}>
                <Text style={s.eventCount}>
                  {item.entered}
                  <Text style={s.eventCountSep}> / </Text>
                  {item.total}
                </Text>
                <View style={s.miniBarBg}>
                  <View style={[s.miniBarFill, { width: `${Math.round(epct * 100)}%` }]} />
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={s.list}
      />

      <View style={s.footer}>
        <TouchableOpacity style={s.scanBtn} onPress={() => router.push("/scanner")}>
          <Text style={s.scanBtnText}>Comenzar escaneo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0d0d0d" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerTitle: { color: "#f0f0f0", fontSize: 20, fontWeight: "800" },
  logoutText: { color: "#888", fontSize: 15 },

  list: { padding: 16, paddingBottom: 100 },

  counterCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  counterLabel: { color: "#888", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  counterRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 20 },
  counterEntered: { color: "#7c3aed", fontSize: 64, fontWeight: "800", lineHeight: 68 },
  counterSep: { color: "#555", fontSize: 36, fontWeight: "300", lineHeight: 56 },
  counterTotal: { color: "#f0f0f0", fontSize: 36, fontWeight: "600", lineHeight: 56 },
  barBg: { height: 8, backgroundColor: "#2a2a2a", borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  barFill: { height: 8, backgroundColor: "#7c3aed", borderRadius: 4 },
  counterPct: { color: "#888", fontSize: 13 },

  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  eventInfo: { flex: 1, marginRight: 16 },
  eventName: { color: "#f0f0f0", fontSize: 15, fontWeight: "700" },
  eventVenue: { color: "#666", fontSize: 12, marginTop: 2 },
  eventCountWrap: { alignItems: "flex-end", minWidth: 80 },
  eventCount: { color: "#f0f0f0", fontSize: 16, fontWeight: "700" },
  eventCountSep: { color: "#555", fontWeight: "300" },
  miniBarBg: { height: 4, width: 80, backgroundColor: "#2a2a2a", borderRadius: 2, overflow: "hidden", marginTop: 6 },
  miniBarFill: { height: 4, backgroundColor: "#7c3aed", borderRadius: 2 },

  empty: { color: "#555", textAlign: "center", marginTop: 32, fontSize: 15 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    backgroundColor: "#0d0d0d",
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  scanBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  scanBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
});
