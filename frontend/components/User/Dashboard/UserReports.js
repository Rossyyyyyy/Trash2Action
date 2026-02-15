//Trash2Action/components/User/Dashboard/UserReports.js
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { label: "Pending",    color: "#FB8C00", bg: "#FFF3E0", icon: "time-outline" },
  verified:   { label: "Verified",   color: "#43A047", bg: "#E8F5E9", icon: "checkmark-circle-outline" },
  inProgress: { label: "In Progress",color: "#2196F3", bg: "#E3F2FD", icon: "reload-circle-outline" },
  completed:  { label: "Completed",  color: "#2E7D32", bg: "#E8F5E9", icon: "checkmark-done-outline" },
  rejected:   { label: "Rejected",   color: "#D32F2F", bg: "#FFEBEE", icon: "close-circle-outline" },
};

// ─── Waste category config ───────────────────────────────────────────────────
const WASTE_CATEGORIES = {
  plastic:    { emoji: "🧴", color: "#FF7043" },
  paper:      { emoji: "📄", color: "#8D6E63" },
  electronic:{ emoji: "📱", color: "#5C6BC0" },
  organic:    { emoji: "🌿", color: "#66BB6A" },
  hazardous:  { emoji: "☢️",  color: "#D32F2F" },
  general:    { emoji: "🗑️",  color: "#78909C" },
};

// ─── Sample reports ──────────────────────────────────────────────────────────
const SAMPLE_REPORTS = [
  {
    id: "r1",
    reportNo: "#1042",
    title: "Illegal Dumping Near BGC",
    location: "Bonifacio Global City, Taguig",
    category: "general",
    status: "verified",
    pointsEarned: 50,
    date: "Jan 28, 2025",
    description: "Found a large pile of mixed waste near the parking area of SM Aura.",
  },
  {
    id: "r2",
    reportNo: "#1041",
    title: "Plastic Waste on Roadside",
    location: "C. P. Garcia Ave, Taguig",
    category: "plastic",
    status: "completed",
    pointsEarned: 30,
    date: "Jan 25, 2025",
    description: "Scattered plastic bottles and bags found on the roadside near the market.",
  },
  {
    id: "r3",
    reportNo: "#1040",
    title: "E-Waste Dumped in Alley",
    location: "Sta. Ana, Taguig",
    category: "electronic",
    status: "inProgress",
    pointsEarned: 0,
    date: "Jan 23, 2025",
    description: "Old computers and broken appliances dumped in a narrow alley.",
  },
  {
    id: "r4",
    reportNo: "#1039",
    title: "Overflowing Bin at Park",
    location: "Promenade Park, BGC",
    category: "general",
    status: "pending",
    pointsEarned: 0,
    date: "Jan 20, 2025",
    description: "The public bin near the jogging path is overflowing. Needs immediate attention.",
  },
  {
    id: "r5",
    reportNo: "#1038",
    title: "Organic Waste Near School",
    location: "Taguig City High School",
    category: "organic",
    status: "rejected",
    pointsEarned: 0,
    date: "Jan 18, 2025",
    description: "Reported organic waste near the school entrance. Report was rejected — missing photo evidence.",
  },
  {
    id: "r6",
    reportNo: "#1037",
    title: "Paper Waste Pile",
    location: "Quezon Circle, Taguig",
    category: "paper",
    status: "completed",
    pointsEarned: 25,
    date: "Jan 15, 2025",
    description: "Large amount of torn newspapers and cardboard boxes near the circle.",
  },
];

export default function UserReports({ token, user }) {
  const [reports] = useState(SAMPLE_REPORTS);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const tabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Done" },
  ];

  const filteredReports = reports.filter((r) => {
    if (activeTab === "active") return ["pending", "inProgress", "verified"].includes(r.status);
    if (activeTab === "completed") return ["completed", "rejected"].includes(r.status);
    return true;
  });

  const totalPoints = reports.reduce((sum, r) => sum + r.pointsEarned, 0);

  return (
    <LinearGradient colors={["#EAF7F1", "#C8E6C9", "#A5D6A7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity
          style={styles.newReportBtn}
          onPress={() => Alert.alert("New Report", "Feature coming soon!")}
        >
          <Ionicons name="add-circle" size={22} color="#FFFFFF" />
          <Text style={styles.newReportText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <SummaryItem icon="document-text" value={reports.length.toString()} label="Total" color="#2E7D32" />
        <View style={styles.summaryDivider} />
        <SummaryItem icon="trophy" value={totalPoints.toString()} label="Points" color="#FB8C00" />
        <View style={styles.summaryDivider} />
        <SummaryItem
          icon="checkmark-done"
          value={reports.filter((r) => r.status === "completed").length.toString()}
          label="Done"
          color="#43A047"
        />
      </View>

      {/* Tab filter */}
      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabPill, activeTab === t.id && styles.tabPillActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Report list */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredReports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#A5D6A7" />
            <Text style={styles.emptyText}>No reports in this category.</Text>
          </View>
        ) : (
          filteredReports.map((report) => {
            const status = STATUS_CONFIG[report.status];
            const waste = WASTE_CATEGORIES[report.category];
            const isExpanded = expandedId === report.id;

            return (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => setExpandedId(isExpanded ? null : report.id)}
                activeOpacity={0.9}
              >
                {/* Top row */}
                <View style={styles.reportTopRow}>
                  <View style={styles.reportLeft}>
                    <View style={[styles.wasteIcon, { backgroundColor: waste.color + "15" }]}>
                      <Text style={styles.wasteEmoji}>{waste.emoji}</Text>
                    </View>
                    <View>
                      <View style={styles.reportTitleRow}>
                        <Text style={styles.reportNo}>{report.reportNo}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: status.bg, borderColor: status.color },
                          ]}
                        >
                          <Ionicons name={status.icon} size={12} color={status.color} />
                          <Text style={[styles.statusText, { color: status.color }]}>
                            {status.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#9E9E9E"
                  />
                </View>

                {/* Location + date (always visible) */}
                <View style={styles.reportMeta}>
                  <Ionicons name="location-outline" size={13} color="#9E9E9E" />
                  <Text style={styles.reportLocation}>{report.location}</Text>
                  <Text style={styles.reportDot}>•</Text>
                  <Text style={styles.reportDate}>{report.date}</Text>
                </View>

                {/* Expanded detail */}
                {isExpanded && (
                  <View style={styles.reportDetail}>
                    <Text style={styles.reportDescription}>{report.description}</Text>
                    {report.pointsEarned > 0 && (
                      <View style={styles.pointsRow}>
                        <Ionicons name="trophy" size={15} color="#FB8C00" />
                        <Text style={styles.pointsText}>+{report.pointsEarned} points earned</Text>
                      </View>
                    )}
                    {report.status === "rejected" && (
                      <View style={styles.rejectedNote}>
                        <Ionicons name="alert-circle" size={15} color="#D32F2F" />
                        <Text style={styles.rejectedText}>
                          This report was rejected. Please resubmit with required photo evidence.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Summary item ────────────────────────────────────────────────────────────
function SummaryItem({ icon, value, label, color }) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1B5E20" },
  newReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newReportText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 12,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: { fontSize: 18, fontWeight: "bold", marginTop: 4 },
  summaryLabel: { fontSize: 11, color: "#757575", marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: "#E0E0E0" },

  // Tab filter
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  tabPillActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  tabText: { fontSize: 13, color: "#424242", fontWeight: "500" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "600" },

  // Scroll
  scrollView: { flex: 1, paddingHorizontal: 20 },

  // Empty
  emptyContainer: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, color: "#757575", marginTop: 12 },

  // Report card
  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },

  // Top row
  reportTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  reportLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  wasteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  wasteEmoji: { fontSize: 20 },

  reportTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  reportNo: { fontSize: 12, fontWeight: "bold", color: "#2E7D32" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: "600" },
  reportTitle: { fontSize: 14, fontWeight: "600", color: "#212121", marginTop: 3 },

  // Meta
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  reportLocation: { fontSize: 12, color: "#757575" },
  reportDot: { fontSize: 12, color: "#BDBDBD" },
  reportDate: { fontSize: 12, color: "#757575" },

  // Expanded detail
  reportDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  reportDescription: { fontSize: 13, color: "#616161", lineHeight: 18, marginBottom: 10 },

  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pointsText: { fontSize: 13, color: "#FB8C00", fontWeight: "600" },

  rejectedNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  rejectedText: { fontSize: 12, color: "#D32F2F", flex: 1, lineHeight: 17 },
});