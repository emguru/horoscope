import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { getTropicalSunSignAbbrev } from "./sunSign";
import {
  SIGN_FULL_NAME,
  SIGN_SUN_DATE_RANGE,
  ZODIAC_WHEEL_SIGN_ABBREVS,
  type TropicalSignAbbrev,
} from "./zodiac-signs";
import type { StoredBirthData } from "./types";

const ZODIAC = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"] as const;

function asTextSymbol(ch: string): string {
  return `${ch}\uFE0E`;
}

const R_SYMBOLS = 78;
const R_TICKS_OUTER = 92;
const R_TICKS_INNER = 58;
const HIT_R = 22;
const WHEEL = 260;

function sunSignFromProfile(data: StoredBirthData | null): TropicalSignAbbrev | null {
  if (!data?.date) return null;
  const parts = data.date.split("-").map(Number);
  const m = parts[1];
  const d = parts[2];
  if (m == null || d == null || Number.isNaN(m) || Number.isNaN(d)) return null;
  return getTropicalSunSignAbbrev(m, d) as TropicalSignAbbrev;
}

function formatBirthLine(data: StoredBirthData): string {
  const date = data.date || "—";
  const time = data.time?.trim() ? ` at ${data.time}` : "";
  return `${date}${time}`;
}

type Props = {
  myBirthData: StoredBirthData | null;
  partnerBirthData: StoredBirthData | null;
};

export function ZodiacWheel({ myBirthData, partnerBirthData }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const spin = useRef(new Animated.Value(0)).current;

  const mySign = useMemo(() => sunSignFromProfile(myBirthData), [myBirthData]);
  const partnerSign = useMemo(() => sunSignFromProfile(partnerBirthData), [partnerBirthData]);

  const selectedAbbrev =
    selectedIdx != null ? ZODIAC_WHEEL_SIGN_ABBREVS[selectedIdx] : null;

  const youMatch = selectedAbbrev != null && mySign === selectedAbbrev;
  const partnerMatch = selectedAbbrev != null && partnerSign === selectedAbbrev;

  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let cancelled = false;
    spinLoopRef.current = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      const loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 56000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoopRef.current = loop;
      loop.start();
    });

    return () => {
      cancelled = true;
      spinLoopRef.current?.stop();
      spinLoopRef.current = null;
    };
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Tap a sign for Sun dates and who in your profiles matches
      </Text>

      <Animated.View
        style={[styles.wheelBox, { transform: [{ rotate }] }]}
        collapsable={false}
      >
        <Svg width={WHEEL} height={WHEEL} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="zwg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="rgb(245,158,11)" stopOpacity={0.55} />
              <Stop offset="50%" stopColor="rgb(245,158,11)" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="rgb(217,119,6)" stopOpacity={0.4} />
            </LinearGradient>
            <RadialGradient id="zhub" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgb(245,158,11)" stopOpacity={0.3} />
              <Stop offset="70%" stopColor="rgb(15,23,42)" stopOpacity={0.5} />
              <Stop offset="100%" stopColor="rgb(15,23,42)" stopOpacity={0.9} />
            </RadialGradient>
          </Defs>

          <Circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="url(#zwg)"
            strokeWidth={1.25}
            opacity={0.9}
          />
          <Circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#f59e0b"
            strokeWidth={0.4}
            opacity={0.4}
            strokeDasharray="3,5"
          />

          {Array.from({ length: 12 }).map((_, i) => {
            const a0 = ((-90 + i * 30) * Math.PI) / 180;
            const x0 = 100 + R_TICKS_INNER * Math.cos(a0);
            const y0 = 100 + R_TICKS_INNER * Math.sin(a0);
            const x1 = 100 + R_TICKS_OUTER * Math.cos(a0);
            const y1 = 100 + R_TICKS_OUTER * Math.sin(a0);
            return (
              <Line
                key={`t-${i}`}
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke="#f59e0b"
                strokeWidth={0.5}
                opacity={0.35}
              />
            );
          })}

          {ZODIAC.map((sym, i) => {
            const angle = ((-90 + i * 30) * Math.PI) / 180;
            const x = 100 + R_SYMBOLS * Math.cos(angle);
            const y = 100 + R_SYMBOLS * Math.sin(angle);
            const isSel = selectedIdx === i;
            return (
              <SvgText
                key={`sym-${sym}`}
                x={x}
                y={y}
                textAnchor="middle"
                alignmentBaseline="central"
                fill={isSel ? "#fcd34d" : "#f59e0b"}
                fontSize={22}
              >
                {asTextSymbol(sym)}
              </SvgText>
            );
          })}

          {ZODIAC.map((_, i) => {
            const angle = ((-90 + i * 30) * Math.PI) / 180;
            const x = 100 + R_SYMBOLS * Math.cos(angle);
            const y = 100 + R_SYMBOLS * Math.sin(angle);
            return (
              <Circle
                key={`hit-${i}`}
                cx={x}
                cy={y}
                r={HIT_R}
                fill="#00000000"
                onPress={() => setSelectedIdx((prev) => (prev === i ? null : i))}
              />
            );
          })}

          <Circle
            cx="100"
            cy="100"
            r="36"
            fill="url(#zhub)"
            stroke="#f59e0b"
            strokeWidth={0.6}
            opacity={0.9}
            onPress={() => setSelectedIdx(null)}
          />
          <SvgText
            x="100"
            y="100"
            textAnchor="middle"
            alignmentBaseline="central"
            fill="#f59e0b"
            fontSize={26}
          >
            {asTextSymbol("☉")}
          </SvgText>
        </Svg>
      </Animated.View>

      {selectedAbbrev != null ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{SIGN_FULL_NAME[selectedAbbrev]}</Text>
          <Text style={styles.panelDates}>
            Typical tropical Sun dates:{" "}
            <Text style={styles.panelDatesBold}>
              {SIGN_SUN_DATE_RANGE[selectedAbbrev]}
            </Text>
          </Text>

          <View style={styles.panelDivider} />

          <Text style={styles.roleLabel}>Me</Text>
          {myBirthData?.date ? (
            youMatch ? (
              <Text style={styles.matchText}>
                <Text style={styles.matchName}>
                  {myBirthData.name?.trim() || "You"}
                </Text>
                {" — "}born {formatBirthLine(myBirthData)}
              </Text>
            ) : (
              <Text style={styles.noMatchText}>
                Your Sun is in {mySign ? SIGN_FULL_NAME[mySign] : "—"} (not this sign).
              </Text>
            )
          ) : (
            <Text style={styles.muted}>No birth date saved for Me in Settings.</Text>
          )}

          <Text style={[styles.roleLabel, { marginTop: 12 }]}>Partner</Text>
          {partnerBirthData?.date ? (
            partnerMatch ? (
              <Text style={styles.matchText}>
                <Text style={styles.matchName}>
                  {partnerBirthData.name?.trim() || "Partner"}
                </Text>
                {" — "}born {formatBirthLine(partnerBirthData)}
              </Text>
            ) : (
              <Text style={styles.noMatchText}>
                Partner's Sun is in{" "}
                {partnerSign ? SIGN_FULL_NAME[partnerSign] : "—"} (not this sign).
              </Text>
            )
          ) : (
            <Text style={styles.muted}>No birth date saved for Partner in Settings.</Text>
          )}

          {!youMatch && !partnerMatch && myBirthData?.date && partnerBirthData?.date ? (
            <Text style={[styles.noMatchText, { marginTop: 10 }]}>
              Neither profile has the Sun in {SIGN_FULL_NAME[selectedAbbrev]}.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  hint: {
    fontSize: 12,
    color: "rgba(253, 230, 138, 0.55)",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  wheelBox: {
    width: WHEEL,
    height: WHEEL,
    alignSelf: "center",
  },
  panel: {
    marginTop: 20,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    padding: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fefce8",
  },
  panelDates: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(254, 243, 199, 0.85)",
  },
  panelDatesBold: {
    color: "#fef3c7",
    fontWeight: "500",
  },
  panelDivider: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(245, 158, 11, 0.15)",
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(251, 191, 36, 0.9)",
  },
  matchText: {
    marginTop: 6,
    fontSize: 14,
    color: "#fef3c7",
  },
  matchName: {
    fontWeight: "600",
    color: "#fefce8",
  },
  noMatchText: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(254, 243, 199, 0.65)",
  },
  muted: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(254, 243, 199, 0.55)",
  },
});
