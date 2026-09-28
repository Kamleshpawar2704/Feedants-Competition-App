import React from "react";
import { ActivityIndicator, Pressable, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/colors";

export default function PrimaryButton({ title, onPress, disabled, loading, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    transform: [{ scale: 0.985 }]
  }
});
