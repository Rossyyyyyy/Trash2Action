//Trash2Action/components/User/Dashboard/UserReports.js
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// ─── Taguig Barangays & Creeks ──────────────────────────────────────────────
const TAGUIG_BARANGAYS = {
  "Ligid-Tipas": {
    creeks: ["Creek A - Ligid", "Creek B - Ligid", "Creek C - Ligid"],
    heatmapAreas: ["Zone 1", "Zone 2", "Zone 3"],
  },
  "Palingod-Tipas": {
    creeks: ["Creek A - Palingod", "Creek B - Palingod", "Creek C - Palingod"],
    heatmapAreas: ["Zone 1", "Zone 2", "Zone 3"],
  },
};

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
  const [reports, setReports] = useState(SAMPLE_REPORTS);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  
  // New report modal states
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [reportDescription, setReportDescription] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [showBarangayMenu, setShowBarangayMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);

  const tabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Done" },
  ];

  // ─── Media picker ────────────────────────────────────────────────────────
  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your media library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadedMedia([...uploadedMedia, ...result.assets]);
    }
  };

  const removeMedia = (index) => {
    setUploadedMedia(uploadedMedia.filter((_, i) => i !== index));
  };

  // ─── Reset new report form ───────────────────────────────────────────────
  const resetNewReportForm = () => {
    setSelectedCity(null);
    setSelectedBarangay(null);
    setSelectedLocation(null);
    setReportDescription("");
    setUploadedMedia([]);
    setShowBarangayMenu(false);
    setShowLocationMenu(false);
  };

  // ─── Submit new report ───────────────────────────────────────────────────
  const handleSubmitReport = () => {
    if (!selectedCity || !selectedBarangay || !selectedLocation) {
      Alert.alert("Incomplete", "Please select city, barangay, and location.");
      return;
    }
    if (uploadedMedia.length === 0) {
      Alert.alert("Media Required", "Please upload at least one photo or video.");
      return;
    }
    if (!reportDescription.trim()) {
      Alert.alert("Description Required", "Please provide a description.");
      return;
    }

    // Create new report
    const newReport = {
      id: `r${Date.now()}`,
      reportNo: `#${1043 + reports.length}`,
      title: `Report at ${selectedLocation}`,
      location: `${selectedBarangay}, ${selectedCity}`,
      category: "general",
      status: "pending",
      pointsEarned: 0,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      description: reportDescription,
      media: uploadedMedia,
    };

    setReports([newReport, ...reports]);
    setShowNewReportModal(false);
    resetNewReportForm();
    Alert.alert("Success", "Your report has been submitted!");
  };

  // ─── Delete/Cancel report ────────────────────────────────────────────────
  const handleDeleteReport = (reportId, reportNo) => {
    Alert.alert(
      "Delete Report",
      `Are you sure you want to delete report ${reportNo}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setReports((prev) => prev.filter((r) => r.id !== reportId));
            Alert.alert("Success", "Report deleted successfully");
          },
        },
      ]
    );
  };

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
          onPress={() => setShowNewReportModal(true)}
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
                    
                    {/* Status tracking */}
                    <View style={styles.trackingSection}>
                      <Text style={styles.trackingTitle}>Status Tracking</Text>
                      <View style={styles.trackingSteps}>
                        <TrackingStep 
                          label="Submitted" 
                          completed={true} 
                          active={report.status === "pending"}
                        />
                        <TrackingStep 
                          label="Verified" 
                          completed={["verified", "inProgress", "completed"].includes(report.status)} 
                          active={report.status === "verified"}
                        />
                        <TrackingStep 
                          label="In Progress" 
                          completed={["inProgress", "completed"].includes(report.status)} 
                          active={report.status === "inProgress"}
                        />
                        <TrackingStep 
                          label="Completed" 
                          completed={report.status === "completed"} 
                          active={report.status === "completed"}
                        />
                      </View>
                    </View>

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

                    {/* Action buttons */}
                    <View style={styles.reportActions}>
                      {["pending", "verified"].includes(report.status) && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => Alert.alert("Edit Report", "Edit feature coming soon!")}
                        >
                          <Ionicons name="create-outline" size={18} color="#2196F3" />
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={() => handleDeleteReport(report.id, report.reportNo)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                        <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                          {["pending"].includes(report.status) ? "Cancel" : "Delete"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* New Report Modal */}
      <Modal
        visible={showNewReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowNewReportModal(false);
          resetNewReportForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Report</Text>
                <TouchableOpacity onPress={() => {
                  setShowNewReportModal(false);
                  resetNewReportForm();
                }}>
                  <Ionicons name="close" size={28} color="#424242" />
                </TouchableOpacity>
              </View>

              {/* City Selection */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>City</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => {
                    setSelectedCity("Taguig");
                    setShowBarangayMenu(true);
                    setSelectedBarangay(null);
                    setSelectedLocation(null);
                  }}
                >
                  <Text style={selectedCity ? styles.selectButtonTextSelected : styles.selectButtonText}>
                    {selectedCity || "Select City"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#757575" />
                </TouchableOpacity>
              </View>

              {/* Barangay Selection */}
              {showBarangayMenu && (
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Barangay</Text>
                  {Object.keys(TAGUIG_BARANGAYS).map((barangay) => (
                    <TouchableOpacity
                      key={barangay}
                      style={[
                        styles.menuItem,
                        selectedBarangay === barangay && styles.menuItemSelected
                      ]}
                      onPress={() => {
                        setSelectedBarangay(barangay);
                        setShowLocationMenu(true);
                        setSelectedLocation(null);
                      }}
                    >
                      <Text style={[
                        styles.menuItemText,
                        selectedBarangay === barangay && styles.menuItemTextSelected
                      ]}>
                        {barangay}
                      </Text>
                      {selectedBarangay === barangay && (
                        <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Location Selection (Creeks/Heatmap) */}
              {showLocationMenu && selectedBarangay && (
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Location (Creek/Area)</Text>
                  {[
                    ...TAGUIG_BARANGAYS[selectedBarangay].creeks,
                    ...TAGUIG_BARANGAYS[selectedBarangay].heatmapAreas
                  ].map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.menuItem,
                        selectedLocation === location && styles.menuItemSelected
                      ]}
                      onPress={() => setSelectedLocation(location)}
                    >
                      <Text style={[
                        styles.menuItemText,
                        selectedLocation === location && styles.menuItemTextSelected
                      ]}>
                        {location}
                      </Text>
                      {selectedLocation === location && (
                        <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Description */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe the waste issue..."
                  placeholderTextColor="#9E9E9E"
                  multiline
                  numberOfLines={4}
                  value={reportDescription}
                  onChangeText={setReportDescription}
                />
              </View>

              {/* Media Upload */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Upload Photo/Video</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={pickMedia}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#2E7D32" />
                  <Text style={styles.uploadButtonText}>Choose Media</Text>
                </TouchableOpacity>

                {/* Media Preview */}
                {uploadedMedia.length > 0 && (
                  <View style={styles.mediaPreviewContainer}>
                    {uploadedMedia.map((media, index) => (
                      <View key={index} style={styles.mediaPreviewItem}>
                        <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
                        <TouchableOpacity
                          style={styles.removeMediaButton}
                          onPress={() => removeMedia(index)}
                        >
                          <Ionicons name="close-circle" size={24} color="#D32F2F" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitReport}
              >
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

// ─── Tracking step ───────────────────────────────────────────────────────────
function TrackingStep({ label, completed, active }) {
  return (
    <View style={styles.trackingStep}>
      <View style={[
        styles.trackingDot,
        completed && styles.trackingDotCompleted,
        active && styles.trackingDotActive
      ]}>
        {completed && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <Text style={[
        styles.trackingLabel,
        completed && styles.trackingLabelCompleted,
        active && styles.trackingLabelActive
      ]}>
        {label}
      </Text>
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

  // Tracking
  trackingSection: { marginBottom: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  trackingTitle: { fontSize: 13, fontWeight: "600", color: "#424242", marginBottom: 12 },
  trackingSteps: { flexDirection: "row", justifyContent: "space-between" },
  trackingStep: { alignItems: "center", flex: 1 },
  trackingDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#E0E0E0", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  trackingDotCompleted: { backgroundColor: "#43A047" },
  trackingDotActive: { backgroundColor: "#2196F3", borderWidth: 2, borderColor: "#BBDEFB" },
  trackingLabel: { fontSize: 10, color: "#9E9E9E", textAlign: "center" },
  trackingLabelCompleted: { color: "#43A047", fontWeight: "600" },
  trackingLabelActive: { color: "#2196F3", fontWeight: "600" },

  // Actions
  reportActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#2196F3", backgroundColor: "#E3F2FD" },
  actionButtonDanger: { borderColor: "#FFCDD2", backgroundColor: "#FFEBEE" },
  actionButtonText: { fontSize: 14, color: "#2196F3", fontWeight: "600" },
  actionButtonTextDanger: { color: "#D32F2F" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B5E20",
  },

  // Form
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectButtonText: {
    fontSize: 14,
    color: "#9E9E9E",
  },
  selectButtonTextSelected: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  menuItemSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
  },
  menuItemText: {
    fontSize: 14,
    color: "#424242",
  },
  menuItemTextSelected: {
    fontSize: 14,
    color: "#1B5E20",
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#212121",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    textAlignVertical: "top",
    minHeight: 100,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  mediaPreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  mediaPreviewItem: {
    position: "relative",
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeMediaButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});