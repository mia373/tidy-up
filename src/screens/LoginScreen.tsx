import React, { useState, useMemo } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { spacing } from "../theme";
import { useTheme } from "../hooks/useTheme";
import type { ColorPalette } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { signIn } from "../services/auth";
import { AuthStackParamList } from "../types/models";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>🌸</Text>
      <Text style={styles.title}>Welcome back</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <PrimaryButton title="Log In" onPress={handleLogin} loading={loading} />
      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate("Signup")}
      >
        <Text style={styles.linkText}>Don&apos;t have an account? Sign up</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: spacing.lg,
      justifyContent: "center",
    },
    emoji: {
      fontSize: 40,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.xl,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: spacing.md,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.md,
    },
    link: {
      marginTop: spacing.lg,
      alignItems: "center",
    },
    linkText: {
      color: colors.primary,
      fontSize: 14,
    },
  });
}
