import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { CropBox } from '@/components/CropBox';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoDimensions, setPhotoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [autoBoxEnabled, setAutoBoxEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Auto-detect question box
  const detectQuestionBox = (imageWidth: number, imageHeight: number): CropRegion => {
    const padding = 0.1;
    const width = imageWidth * 0.8;
    const height = imageHeight * 0.4;
    const x = (imageWidth - width) / 2;
    const y = imageHeight * 0.15;

    return { x, y, width, height };
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setPhoto(photo.uri);
        setPhotoDimensions({ width: photo.width, height: photo.height });

        if (autoBoxEnabled) {
          const detectedBox = detectQuestionBox(photo.width, photo.height);
          setCropRegion(detectedBox);
        } else {
          const defaultBox = detectQuestionBox(photo.width, photo.height);
          setCropRegion(defaultBox);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const handleContinue = async () => {
    if (!photo || !cropRegion || !photoDimensions) return;

    setIsProcessing(true);
    try {
      let imageWidth = photoDimensions.width;
      let imageHeight = photoDimensions.height;

      if (!imageWidth || !imageHeight) {
        if (Platform.OS === 'web') {
          const img = new (window as any).Image();
          await new Promise((resolve, reject) => {
            img.onload = () => {
              imageWidth = img.width;
              imageHeight = img.height;
              resolve(true);
            };
            img.onerror = reject;
            img.src = photo;
          });
        } else {
          await new Promise<void>((resolve, reject) => {
            Image.getSize(
              photo,
              (width, height) => {
                imageWidth = width;
                imageHeight = height;
                resolve();
              },
              reject
            );
          });
        }
      }

      const scaleX = imageWidth / SCREEN_WIDTH;
      const scaleY = imageHeight / SCREEN_HEIGHT;

      const cropData = {
        originX: cropRegion.x * scaleX,
        originY: cropRegion.y * scaleY,
        width: cropRegion.width * scaleX,
        height: cropRegion.height * scaleY,
      };

      // Crop the image
      const croppedImage = await manipulateAsync(
        photo,
        [
          {
            crop: cropData,
          },
        ],
        { compress: 0.9, format: SaveFormat.JPEG }
      );

      router.push({
        pathname: '/preview',
        params: { imageUri: croppedImage.uri },
      });
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    setPhotoDimensions(null);
    setCropRegion(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!permission) {
  return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please allow camera access to capture questions
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (photo) {
    // Show captured photo with crop box
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Image source={{ uri: photo }} style={styles.previewImage} resizeMode="contain" />
        
        <View style={styles.overlay}>
          <CropBox
            cropRegion={cropRegion!}
            onCropRegionChange={setCropRegion}
            imageWidth={SCREEN_WIDTH}
            imageHeight={SCREEN_HEIGHT}
          />
        </View>

        <View style={styles.controlsContainer}>
        <TouchableOpacity
            style={[styles.controlButton, styles.retakeButton]}
            onPress={handleRetake}
            disabled={isProcessing}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Retake</Text>
        </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.confirmButton]}
            onPress={handleContinue}
            disabled={isProcessing || !cropRegion}>
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.controlButtonText}>Confirm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="picture"
      >
        <View style={styles.cameraOverlay}>
          {/* Header with toggle */}
          <View style={styles.header}>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Auto Box</Text>
              <TouchableOpacity
                style={[styles.toggle, autoBoxEnabled && styles.toggleActive]}
                onPress={() => {
                  setAutoBoxEnabled(!autoBoxEnabled);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}>
                <View style={[styles.toggleThumb, autoBoxEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Camera guide overlay */}
          <View style={styles.guideOverlay}>
            <View style={styles.guideBox} />
            <Text style={styles.guideText}>Position question in frame</Text>
              </View>

          {/* Capture button */}
          <View style={styles.captureContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  guideOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guideBox: {
    width: SCREEN_WIDTH - 80,
    height: (SCREEN_WIDTH - 80) * 0.6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  captureContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
