import React from "react";
import { Modal, Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme/colors";

export default function VideoModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.icon}>
            <Ionicons name="play" size={30} color={colors.teal} />
          </View>
          <Text style={styles.title}>Meet the judge</Text>
          <Text style={styles.copy}>
            Manju shares what she looks for in a classical dance performance.
            This demo keeps the experience interactive without requiring a video
            service just to run the assignment locally.
          </Text>
          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(12, 29, 48, 0.58)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  modal: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 26,
    alignItems: "center"
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink
  },
  copy: {
    textAlign: "center",
    lineHeight: 22,
    color: colors.muted,
    marginTop: 10,
    marginBottom: 20
  },
  close: {
    backgroundColor: colors.ink,
    paddingVertical: 13,
    paddingHorizontal: 34,
    borderRadius: 14
  },
  closeText: {
    color: colors.white,
    fontWeight: "800"
  }
});
