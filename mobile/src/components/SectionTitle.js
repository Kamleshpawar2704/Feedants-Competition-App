import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function SectionTitle({ title, action }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800"
  },
  action: {
    color: colors.teal,
    fontWeight: "700"
  }
});
