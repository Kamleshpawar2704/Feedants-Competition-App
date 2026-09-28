import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import CompetitionDetailsScreen from "./src/screens/CompetitionDetailsScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CompetitionDetailsScreen />
    </SafeAreaProvider>
  );
}
