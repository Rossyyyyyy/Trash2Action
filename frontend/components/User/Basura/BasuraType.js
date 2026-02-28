import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../../config';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BasuraType({ token, user, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [realtimeDetections, setRealtimeDetections] = useState([]);
  const [isRealtimeMode, setIsRealtimeMode] = useState(false);
  const cameraRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    requestMediaPermissions();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // Camera permission is handled by useCameraPermissions hook
  };

  // Start real-time detection
  const startRealtimeDetection = () => {
    setIsRealtimeMode(true);
    // Run detection every 2 seconds
    detectionIntervalRef.current = setInterval(() => {
      captureAndDetect();
    }, 2000);
  };

  // Stop real-time detection
  const stopRealtimeDetection = () => {
    setIsRealtimeMode(false);
    setRealtimeDetections([]);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // Capture frame and detect objects
  const captureAndDetect = async () => {
    if (cameraRef.current && isRealtimeMode) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
        });
        
        // Send to backend for detection
        const formData = new FormData();
        formData.append('image', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'frame.jpg',
        });

        const response = await fetch(`${API_URL}/api/detect-waste-realtime`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        
        console.log('🔍 Detection response:', data);
        console.log('📦 Detections count:', data.detections?.length || 0);
        
        if (data.success && data.detections && data.detections.length > 0) {
          console.log('✅ Setting detections:', data.detections);
          setRealtimeDetections(data.detections);
        } else {
          console.log('⚠️ No detections found');
          setRealtimeDetections([]);
        }
      } catch (error) {
        console.error('❌ Real-time detection error:', error);
        setRealtimeDetections([]);
      }
    }
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        setCapturedImage(photo.uri);
        setShowCamera(false);
        analyzeImage(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
        analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeImage = async (imageUri) => {
    setIsAnalyzing(true);
    setDetectionResult(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'waste.jpg',
      });

      const response = await fetch(`${API_URL}/api/detect-waste`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setDetectionResult(data.result);
      } else {
        Alert.alert('Detection Failed', data.message || 'Could not detect waste type');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setDetectionResult(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={64} color="#9E9E9E" />
        <Text style={styles.permissionText}>Camera and media library access required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          {/* Bounding boxes overlay */}
          {isRealtimeMode && realtimeDetections.length > 0 && (
            <Svg style={StyleSheet.absoluteFill}>
              {realtimeDetections.map((detection, index) => {
                const { x, y, width, height, label, confidence } = detection;
                const color = getColorForLabel(label);
                
                return (
                  <React.Fragment key={index}>
                    {/* Bounding box */}
                    <Rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      stroke={color}
                      strokeWidth="3"
                      fill="transparent"
                    />
                    {/* Label background */}
                    <Rect
                      x={x}
                      y={y - 25}
                      width={label.length * 8 + 40}
                      height={25}
                      fill={color}
                    />
                    {/* Label text */}
                    <SvgText
                      x={x + 5}
                      y={y - 8}
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {`${label} ${(confidence * 100).toFixed(0)}%`}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          )}

          {/* Detection counter */}
          {isRealtimeMode && (
            <View style={styles.detectionCounter}>
              <Text style={styles.detectionCounterText}>
                {realtimeDetections.length > 0 
                  ? `${realtimeDetections.length} object${realtimeDetections.length > 1 ? 's' : ''} detected`
                  : 'Scanning...'}
              </Text>
            </View>
          )}

          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                stopRealtimeDetection();
                setShowCamera(false);
              }}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Real-time detection toggle */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={[
                  styles.realtimeButton,
                  isRealtimeMode && styles.realtimeButtonActive
                ]}
                onPress={() => {
                  if (isRealtimeMode) {
                    stopRealtimeDetection();
                  } else {
                    startRealtimeDetection();
                  }
                }}
              >
                <Ionicons 
                  name={isRealtimeMode ? "scan" : "scan-outline"} 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.realtimeButtonText}>
                  {isRealtimeMode ? 'Stop Scan' : 'Live Scan'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => {
                  setFacing(facing === 'back' ? 'front' : 'back');
                }}
              >
                <Ionicons name="camera-reverse" size={32} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={{ width: 60 }} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <Modal visible={true} animationType="slide">
      <LinearGradient colors={['#EAF7F1', '#C8E6C9']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check Basura Type</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!capturedImage ? (
            <View style={styles.uploadSection}>
              <View style={styles.iconContainer}>
                <Ionicons name="scan" size={80} color="#2E7D32" />
              </View>
              <Text style={styles.title}>Scan Your Waste</Text>
              <Text style={styles.subtitle}>
                Take a photo or upload an image to identify waste type
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowCamera(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#2E7D32', '#43A047']}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="camera" size={28} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Take Photo</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#1976D2', '#2196F3']}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="images" size={28} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Upload Image</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>How it works:</Text>
                <View style={styles.infoItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#43A047" />
                  <Text style={styles.infoText}>Take a clear photo of your waste</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#43A047" />
                  <Text style={styles.infoText}>AI analyzes and classifies the waste</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#43A047" />
                  <Text style={styles.infoText}>Get disposal recommendations</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.resultSection}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              </View>

              {isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="large" color="#2E7D32" />
                  <Text style={styles.analyzingText}>Analyzing waste...</Text>
                  <Text style={styles.analyzingSubtext}>Please wait</Text>
                </View>
              ) : detectionResult ? (
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Ionicons name="checkmark-circle" size={32} color="#43A047" />
                    <Text style={styles.resultTitle}>Detection Complete</Text>
                  </View>

                  <View style={styles.wasteTypeCard}>
                    <Text style={styles.wasteTypeLabel}>Waste Type:</Text>
                    <Text style={styles.wasteTypeName}>{detectionResult.wasteType}</Text>
                  </View>

                  <View style={styles.confidenceBar}>
                    <Text style={styles.confidenceLabel}>Confidence:</Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${detectionResult.confidence}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.confidenceValue}>
                      {detectionResult.confidence}%
                    </Text>
                  </View>

                  {detectionResult.category && (
                    <View style={styles.categoryCard}>
                      <Text style={styles.categoryLabel}>Category:</Text>
                      <Text style={styles.categoryValue}>{detectionResult.category}</Text>
                    </View>
                  )}

                  {detectionResult.recommendation && (
                    <View style={styles.recommendationCard}>
                      <Ionicons name="information-circle" size={24} color="#1976D2" />
                      <View style={styles.recommendationContent}>
                        <Text style={styles.recommendationTitle}>Recommendation:</Text>
                        <Text style={styles.recommendationText}>
                          {detectionResult.recommendation}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ) : null}

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleRetake}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="#2E7D32" />
                  <Text style={styles.secondaryButtonText}>Retake</Text>
                </TouchableOpacity>

                {detectionResult && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// Helper function to get color for different waste types
function getColorForLabel(label) {
  const colors = {
    'plastic': '#2196F3',
    'paper': '#4CAF50',
    'metal': '#FF9800',
    'glass': '#9C27B0',
    'organic': '#8BC34A',
    'electronic': '#F44336',
    'battery': '#E91E63',
    'cardboard': '#795548',
    'general': '#9E9E9E',
  };
  
  const lowerLabel = label.toLowerCase();
  for (const key in colors) {
    if (lowerLabel.includes(key)) {
      return colors[key];
    }
  }
  return '#00BCD4'; // Default cyan color
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF7F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  uploadSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#616161',
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  realtimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  realtimeButtonActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.8)',
    borderColor: '#4CAF50',
  },
  realtimeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detectionCounter: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  detectionCounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  resultSection: {
    paddingTop: 20,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 16,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  wasteTypeCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  wasteTypeLabel: {
    fontSize: 12,
    color: '#558B2F',
    marginBottom: 4,
  },
  wasteTypeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  confidenceBar: {
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#43A047',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'right',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#616161',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  recommendationCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#616161',
  },
  permissionText: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  permissionButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
