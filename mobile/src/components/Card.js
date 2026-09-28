import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radius } from "../theme/colors";

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E8EEF3",
    padding: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  }
});
