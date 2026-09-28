import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";

import Card from "../components/Card";
import SectionTitle from "../components/SectionTitle";
import PrimaryButton from "../components/PrimaryButton";
import VideoModal from "../components/VideoModal";
import { api } from "../api/client";
import { colors, radius } from "../theme/colors";
import { getCountdown, formatDateTime } from "../utils/date";

const USER_ID = "demo-user-001";
const SLUG = "feedants-classical-dance";

export default function CompetitionDetailsScreen() {
  const [payload, setPayload] = useState(null);
  const [tab, setTab] = useState("about");
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const load = async (pullToRefresh = false) => {
    try {
      pullToRefresh ? setRefreshing(true) : setLoading(true);
      const data = await api.getCompetition(SLUG, USER_ID);
      setPayload(data);
    } catch (error) {
      Alert.alert("Couldn't load competition", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!payload?.competition) return;

    const update = () => {
      setCountdown(getCountdown(payload.competition.registrationClosesAt));
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [payload]);

  const competition = payload?.competition;
  const viewer = payload?.viewer;

  const canRegister =
    competition?.lifecycle === "registration_open" &&
    !viewer?.isRegistered &&
    !competition?.isFull;

  const statusLabel = useMemo(() => {
    if (!competition) return "";
    if (viewer?.isRegistered) return "Registered";
    if (competition.lifecycle === "registration_open") return "Registration open";
    if (competition.lifecycle === "submission_open") return "Submissions open";
    if (competition.lifecycle === "closed") return "Competition closed";
    return "Coming soon";
  }, [competition, viewer]);

  async function register() {
    if (!competition || !canRegister) return;

    try {
      setRegistering(true);
      await api.register(competition._id, USER_ID);
      await load(true);
      Alert.alert("You're in!", "Your spot has been reserved successfully.");
    } catch (error) {
      Alert.alert("Registration failed", error.message);
    } finally {
      setRegistering(false);
    }
  }

  async function shareCompetition() {
    await Share.share({
      message: `Join ${competition.title} on Feedants. Use my referral link: https://feedants.com/r/referral123`
    });
  }

  async function copyReferral() {
    await Clipboard.setStringAsync("https://feedants.com/r/referral123");
    Alert.alert("Copied", "Referral link copied to your clipboard.");
  }

  async function uploadSubmission() {
    if (!competition || !viewer?.isRegistered) {
      Alert.alert("Registration required", "Register for the competition before uploading.");
      return;
    }

    if (competition.lifecycle !== "submission_open") {
      Alert.alert(
        "Submission window",
        `Submissions are available from ${formatDateTime(
          competition.submissionStartsAt
        )} to ${formatDateTime(competition.submissionEndsAt)}.`
      );
      return;
    }

    const picked = await DocumentPicker.getDocumentAsync({
      type: ["video/*"],
      copyToCacheDirectory: true
    });

    if (picked.canceled) return;

    try {
      // The assignment backend accepts a video URL. In production this URI would
      // be uploaded to object storage first; this keeps the demo self-contained.
      await api.submit(competition._id, USER_ID, picked.assets[0].uri);
      await load(true);
      Alert.alert("Submission saved", "Your video is now marked as submitted.");
    } catch (error) {
      Alert.alert("Upload failed", error.message);
    }
  }

  if (loading && !competition) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Loading competition...</Text>
      </View>
    );
  }

  if (!competition) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.teal} />
        }
      >
        <View style={styles.topbar}>
          <Pressable style={styles.backButton} onPress={() => Alert.alert("Back", "This is the competition details demo.")}>
            <Ionicons name="arrow-back" size={21} color={colors.ink} />
            <Text style={styles.backText}>Go back</Text>
          </Pressable>

          <View style={styles.language}>
            <View style={styles.langActive}><Text style={styles.langActiveText}>ENG</Text></View>
            <Text style={styles.langHindi}>हिंदी</Text>
          </View>
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroTitleRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{competition.title}</Text>
              <View style={styles.chips}>
                <Text style={styles.chip}>{competition.category}</Text>
                {competition.tags?.map((tag) => <Text key={tag} style={styles.chip}>{tag}</Text>)}
              </View>
            </View>

            <View style={[styles.statusPill, viewer.isRegistered && styles.registeredPill]}>
              <Ionicons
                name={viewer.isRegistered ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={viewer.isRegistered ? colors.teal : colors.muted}
              />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.prizeRow}>
            <View style={styles.prizeBox}>
              <Text style={styles.label}>Prize Pool</Text>
              <Text style={styles.bigValue}>₹ {competition.prizePool.toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.prizeBox}>
              <Text style={styles.label}>Entry Fee</Text>
              <Text style={styles.bigValue}>₹ {competition.entryFee}</Text>
            </View>
            <View style={styles.spotsBox}>
              <View style={styles.spotsTitle}>
                <Ionicons name="people-outline" size={20} color={colors.teal} />
                <Text style={styles.spotsText}>{competition.spotsLeft} spots left</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progress,
                    { width: `${Math.min((competition.registeredCount / competition.maxParticipants) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.booked}>
                {competition.registeredCount} / {competition.maxParticipants} Booked
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.judgeCard}>
          <Image source={{ uri: competition.judge.avatarUrl }} style={styles.judgeAvatar} />
          <View style={styles.judgeInfo}>
            <Text style={styles.eyebrow}>Judge</Text>
            <Text style={styles.judgeName}>{competition.judge.name}</Text>
            <Text style={styles.judgeDetail}>{competition.judge.title}</Text>
            <Text style={styles.judgeDetail}>{competition.judge.experience}</Text>
          </View>
          <Pressable style={styles.playButton} onPress={() => setVideoOpen(true)}>
            <Ionicons name="play" size={24} color={colors.teal} />
          </Pressable>
          <Text style={styles.introText}>Intro{"\n"}Video</Text>
        </Card>

        <LinearGradient
          colors={["#E8F8F6", "#F1FAF9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.countdown}
        >
          <Ionicons name="hourglass-outline" size={22} color={colors.teal} />
          <Text style={styles.countdownLabel}>Registration closes in</Text>
          <Text style={styles.timer}>
            {countdown?.days}d : {countdown?.hours}h : {countdown?.minutes}m : {countdown?.seconds}s
          </Text>
          <Ionicons name="alarm-outline" size={22} color={colors.teal} />
        </LinearGradient>

        <Card>
          <SectionTitle title="Important Dates" />
          <View style={styles.datesGrid}>
            <DateItem icon="calendar-outline" label="Register Before" value={formatDateTime(competition.registrationClosesAt)} />
            <DateItem icon="paper-plane-outline" label="Submission Starts" value={formatDateTime(competition.submissionStartsAt)} />
            <DateItem icon="cloud-upload-outline" label="Submission Ends" value={formatDateTime(competition.submissionEndsAt)} />
            <DateItem icon="trophy-outline" label="Result Date" value={formatDateTime(competition.resultAt)} />
          </View>
        </Card>

        <Card>
          <SectionTitle title="Previous Winners" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.winners}>
            {competition.previousWinners.map((winner) => (
              <View key={`${winner.name}-${winner.position}`} style={styles.winnerCard}>
                <Image source={{ uri: winner.avatarUrl }} style={styles.winnerImage} />
                <View style={styles.winnerCopy}>
                  <Text style={styles.winnerName} numberOfLines={1}>{winner.name}</Text>
                  <Text style={styles.winnerPosition}>{winner.position}</Text>
                </View>
                <View style={styles.winnerPlay}>
                  <Ionicons name="play" size={13} color={colors.teal} />
                </View>
              </View>
            ))}
          </ScrollView>
        </Card>

        <Card style={styles.tabsCard}>
          <View style={styles.tabs}>
            {[
              ["about", "About Competition"],
              ["judging", "Judging Parameters"],
              ["rules", "Rules & Eligibility"]
            ].map(([key, label]) => (
              <Pressable key={key} onPress={() => setTab(key)} style={styles.tab}>
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
                {tab === key && <View style={styles.tabLine} />}
              </Pressable>
            ))}
          </View>

          {tab === "about" && (
            <View>
              <Text style={styles.description}>{competition.description}</Text>
              <Pressable onPress={() => Alert.alert("About this competition", competition.description)}>
                <Text style={styles.viewMore}>View more <Ionicons name="chevron-down" size={14} /></Text>
              </Pressable>
            </View>
          )}

          {tab === "judging" && (
            <View style={styles.list}>
              {competition.judgingParameters.map((item, index) => (
                <View key={item} style={styles.listRow}>
                  <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === "rules" && (
            <View style={styles.list}>
              {competition.rules.map((item) => (
                <View key={item} style={styles.listRow}>
                  <Ionicons name="checkmark-circle-outline" size={21} color={colors.teal} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <SectionTitle title="Rewards" action="All Positions" />
          {competition.rewards.map((reward) => (
            <View key={reward.position} style={styles.rewardRow}>
              <Ionicons
                name={reward.medal === "trophy" ? "trophy" : reward.medal === "silver" ? "medal" : reward.medal === "bronze" ? "ellipse" : "star-outline"}
                size={22}
                color={reward.medal === "trophy" ? "#E89C00" : colors.teal}
              />
              <Text style={styles.rewardName}>{reward.position}</Text>
              <Text style={styles.rewardAmount}>₹ {reward.amount}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={21} color={colors.teal} />
          <Text style={styles.noticeText}>
            Disclaimer: Only contributions from paid participants will be considered for judging.
          </Text>
        </View>

        <View style={styles.bottomInfoRow}>
          <Pressable style={styles.infoTile} onPress={() => Alert.alert("Prize payout", "Prize money is transferred according to the competition's payout process.")}>
            <View style={styles.tileIcon}><Ionicons name="play" size={20} color={colors.teal} /></View>
            <View><Text style={styles.tileTitle}>How will you receive</Text><Text style={styles.tileSub}>prize money?</Text></View>
          </Pressable>

          <View style={styles.infoTile}>
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.ink} />
            <View><Text style={styles.tileTitle}>Refund policy</Text><Text style={styles.tileSub}>Secure payments</Text></View>
          </View>
        </View>

        <LinearGradient colors={["#E2FAF0", "#DDF8EE"]} style={styles.referral}>
          <View style={styles.megaphone}><Ionicons name="megaphone-outline" size={27} color={colors.teal} /></View>
          <View style={{ flex: 1 }}>
            <View style={styles.refHeader}>
              <Text style={styles.refTitle}>Refer & Earn more discount</Text>
              <Pressable onPress={shareCompetition}><Text style={styles.shareText}>Share</Text></Pressable>
            </View>
            <View style={styles.refLinkRow}>
              <Text numberOfLines={1} style={styles.refLink}>https://feedants.com/r/referral123</Text>
              <Pressable style={styles.copyButton} onPress={copyReferral}><Text style={styles.copyText}>Copy Link</Text></Pressable>
            </View>
            <Text style={styles.refSub}>You earn ₹{competition.referralReward} for every signup</Text>
          </View>
        </LinearGradient>

        <Pressable style={styles.usersCard} onPress={() => Alert.alert("Participant feedback", "Participant reviews would be loaded from the feedback service here.")}>
          <View style={styles.chatIcon}><Ionicons name="chatbubble-ellipses-outline" size={23} color={colors.ink} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.usersTitle}>Hear From Our Users</Text>
            <Text style={styles.usersSub}>See what participants say about Feedants</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.ink} />
        </Pressable>

        <View style={styles.adBox}>
          <Ionicons name="megaphone-outline" size={18} color={colors.muted} />
          <Text style={styles.adText}>Ad Here</Text>
        </View>

        <PrimaryButton
          title={
            viewer.isRegistered
              ? viewer.submission
                ? "Submission Saved"
                : competition.lifecycle === "submission_open"
                  ? "Upload Submission"
                  : "Registered"
              : canRegister
                ? `Register for ₹${competition.entryFee}`
                : "Registration Closed"
          }
          onPress={viewer.isRegistered && !viewer.submission ? uploadSubmission : register}
          loading={registering}
          disabled={
            viewer.isRegistered
              ? Boolean(viewer.submission) || (competition.lifecycle !== "submission_open")
              : !canRegister
          }
          style={styles.mainButton}
        />

        <Text style={styles.registeredHint}>
          {viewer.isRegistered
            ? viewer.submission
              ? "Your submission is on record."
              : "You're registered for this competition."
            : "Secure registration • Live availability"}
        </Text>

        <View style={styles.bottomNav}>
          <BottomNav icon="home-outline" label="Home" />
          <BottomNav icon="search-outline" label="Explore" />
          <View style={styles.addCircle}><Ionicons name="add" size={30} color={colors.white} /></View>
          <BottomNav icon="trophy-outline" label="Competitions" active />
          <BottomNav icon="person-circle-outline" label="Profile" />
        </View>
      </ScrollView>

      <VideoModal visible={videoOpen} onClose={() => setVideoOpen(false)} />
    </SafeAreaView>
  );
}

function DateItem({ icon, label, value }) {
  return (
    <View style={styles.dateItem}>
      <Ionicons name={icon} size={25} color={colors.teal} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dateLabel}>{label}</Text>
        <Text style={styles.dateValue}>{value}</Text>
      </View>
    </View>
  );
}

function BottomNav({ icon, label, active }) {
  return (
    <View style={styles.navItem}>
      <Ionicons name={icon} size={25} color={active ? colors.teal : "#8A96A9"} />
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 28, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  loadingText: { marginTop: 12, color: colors.muted, fontWeight: "700" },

  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 },
  backText: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  language: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: 18, padding: 3, borderWidth: 1, borderColor: colors.border },
  langActive: { backgroundColor: colors.teal, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 7 },
  langActiveText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  langHindi: { paddingHorizontal: 11, color: colors.ink, fontWeight: "700" },

  heroCard: { padding: 17 },
  heroTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  titleWrap: { flex: 1 },
  title: { color: colors.ink, fontSize: 23, fontWeight: "900", letterSpacing: -0.4 },
  chips: { flexDirection: "row", gap: 7, marginTop: 9 },
  chip: { backgroundColor: "#F0F3F8", color: colors.ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: "800" },
  statusPill: { backgroundColor: "#F5F7FA", borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 8, maxWidth: 126 },
  registeredPill: { backgroundColor: colors.tealSoft },
  statusText: { color: colors.tealDark, fontSize: 11, fontWeight: "800" },

  prizeRow: { flexDirection: "row", marginTop: 21, gap: 12 },
  prizeBox: { flex: 0.8 },
  spotsBox: { flex: 1.4 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 3 },
  bigValue: { color: colors.tealDark, fontSize: 25, fontWeight: "900" },
  spotsTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  spotsText: { color: colors.tealDark, fontWeight: "800", fontSize: 13 },
  progressTrack: { height: 5, backgroundColor: "#D8EBED", borderRadius: 5, marginTop: 10, overflow: "hidden" },
  progress: { height: 5, backgroundColor: colors.teal, borderRadius: 5 },
  booked: { color: colors.muted, fontSize: 11, marginTop: 6, fontWeight: "700" },

  judgeCard: { flexDirection: "row", alignItems: "center", padding: 14 },
  judgeAvatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.lavender },
  judgeInfo: { flex: 1, marginLeft: 13 },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  judgeName: { color: colors.ink, fontSize: 18, fontWeight: "900", marginTop: 2 },
  judgeDetail: { color: "#687A9B", fontSize: 12, marginTop: 4 },
  playButton: { width: 55, height: 55, borderRadius: 28, backgroundColor: "#EAF8FB", alignItems: "center", justifyContent: "center" },
  introText: { position: "absolute", right: 8, bottom: 7, color: colors.muted, fontSize: 9, fontWeight: "800", textAlign: "center" },

  countdown: { borderRadius: 14, minHeight: 55, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9 },
  countdownLabel: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  timer: { flex: 1, color: colors.tealDark, fontSize: 17, fontWeight: "900", textAlign: "center" },

  datesGrid: { borderWidth: 1, borderColor: colors.border, borderRadius: 13, overflow: "hidden" },
  dateItem: { width: "50%", minHeight: 90, flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderBottomWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  dateLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  dateValue: { color: colors.tealDark, fontSize: 12, fontWeight: "800", marginTop: 4 },

  winners: { gap: 10 },
  winnerCard: { width: 180, minHeight: 80, backgroundColor: "#F6F8FC", borderRadius: 13, padding: 8, flexDirection: "row", alignItems: "center", position: "relative" },
  winnerImage: { width: 58, height: 58, borderRadius: 12 },
  winnerCopy: { flex: 1, paddingHorizontal: 8 },
  winnerName: { color: colors.ink, fontWeight: "800", fontSize: 12 },
  winnerPosition: { color: colors.teal, fontWeight: "700", fontSize: 10, marginTop: 4 },
  winnerPlay: { position: "absolute", left: 49, bottom: 7, backgroundColor: colors.white, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },

  tabsCard: { padding: 14 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: colors.border, marginBottom: 14 },
  tab: { flex: 1, alignItems: "center", paddingBottom: 10 },
  tabText: { color: colors.muted, fontSize: 11, fontWeight: "800", textAlign: "center" },
  tabTextActive: { color: colors.teal },
  tabLine: { position: "absolute", bottom: -1, height: 3, left: 8, right: 8, backgroundColor: colors.teal, borderRadius: 3 },
  description: { color: "#657696", lineHeight: 22, fontSize: 13 },
  viewMore: { textAlign: "center", color: colors.teal, fontWeight: "800", marginTop: 10 },
  list: { gap: 12 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  number: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.tealSoft, alignItems: "center", justifyContent: "center" },
  numberText: { color: colors.tealDark, fontWeight: "900" },
  listText: { flex: 1, color: colors.ink, lineHeight: 20, fontWeight: "600" },

  rewardRow: { flexDirection: "row", alignItems: "center", minHeight: 38, borderBottomWidth: 1, borderColor: "#EFF2F5" },
  rewardName: { flex: 1, marginLeft: 12, color: colors.ink, fontWeight: "800", fontSize: 13 },
  rewardAmount: { color: colors.tealDark, fontWeight: "900", fontSize: 14 },

  notice: { backgroundColor: colors.tealSoft, borderRadius: 12, minHeight: 42, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  noticeText: { flex: 1, color: colors.ink, fontSize: 11, lineHeight: 16 },

  bottomInfoRow: { flexDirection: "row", gap: 10 },
  infoTile: { flex: 1, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  tileIcon: { width: 44, height: 44, backgroundColor: colors.mint, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tileTitle: { color: colors.ink, fontWeight: "800", fontSize: 11 },
  tileSub: { color: colors.muted, fontSize: 10, marginTop: 2 },

  referral: { borderRadius: 17, padding: 13, flexDirection: "row", gap: 11 },
  megaphone: { width: 45, height: 45, borderRadius: 13, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  refHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refTitle: { color: colors.ink, fontWeight: "900", fontSize: 13 },
  shareText: { color: colors.teal, fontWeight: "900", fontSize: 11 },
  refLinkRow: { flexDirection: "row", backgroundColor: colors.white, borderRadius: 9, overflow: "hidden", marginTop: 8, borderWidth: 1, borderColor: "#CFE6E1" },
  refLink: { flex: 1, paddingHorizontal: 8, paddingVertical: 9, color: colors.muted, fontSize: 9 },
  copyButton: { backgroundColor: "#F2FAF7", paddingHorizontal: 10, justifyContent: "center", borderLeftWidth: 1, borderColor: "#CFE6E1" },
  copyText: { color: colors.tealDark, fontWeight: "900", fontSize: 9 },
  refSub: { color: colors.tealDark, fontSize: 10, fontWeight: "700", marginTop: 5 },

  usersCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, flexDirection: "row", alignItems: "center", gap: 11 },
  chatIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.lavender, alignItems: "center", justifyContent: "center" },
  usersTitle: { color: colors.ink, fontWeight: "900", fontSize: 13 },
  usersSub: { color: colors.muted, fontSize: 10, marginTop: 3 },

  adBox: { height: 42, borderRadius: 13, borderWidth: 1, borderStyle: "dashed", borderColor: "#CBD4DE", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  adText: { color: colors.muted, fontWeight: "800", fontSize: 12 },

  mainButton: { marginTop: 0 },
  registeredHint: { color: colors.muted, textAlign: "center", fontSize: 10, fontWeight: "700", marginTop: -3 },

  bottomNav: { marginTop: 3, minHeight: 67, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 6 },
  navItem: { alignItems: "center", gap: 4, width: 65 },
  navLabel: { color: "#8A96A9", fontSize: 9, fontWeight: "700", textAlign: "center" },
  navActive: { color: colors.teal },
  addCircle: { width: 53, height: 53, borderRadius: 18, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center", marginTop: -22, borderWidth: 5, borderColor: colors.background }
});
