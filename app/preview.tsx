import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PreviewScreen() {
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (imageUri) {
      // On web, we need to use a different approach
      if (Platform.OS === 'web') {
        const img = new (window as any).Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const displayWidth = SCREEN_WIDTH * 0.9;
          const displayHeight = displayWidth / aspectRatio;
          setImageSize({ width: displayWidth, height: displayHeight });
        };
        img.onerror = () => {
          console.error('Error loading image size on web');
          setImageSize({ width: SCREEN_WIDTH * 0.9, height: SCREEN_WIDTH * 0.9 });
        };
        img.src = imageUri;
      } else {
        Image.getSize(
          imageUri,
          (width, height) => {
            const aspectRatio = width / height;
            const displayWidth = SCREEN_WIDTH * 0.9;
            const displayHeight = displayWidth / aspectRatio;
            setImageSize({ width: displayWidth, height: displayHeight });
          },
          (error) => {
            console.error('Error loading image size:', error);
            // Default size if we can't get the actual size
            setImageSize({ width: SCREEN_WIDTH * 0.9, height: SCREEN_WIDTH * 0.9 });
          }
        );
      }
    }
  }, [imageUri]);

  useEffect(() => {
    scaleAnim.setValue(scale);
  }, [scale]);

  const startX = useRef(0);
  const startY = useRef(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      startX.current = (translateX as any)._value || 0;
      startY.current = (translateY as any)._value || 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onPanResponderMove: (evt: any, gestureState: any) => {
      translateX.setValue(startX.current + gestureState.dx);
      translateY.setValue(startY.current + gestureState.dy);
    },
    onPanResponderRelease: () => {
      const currentX = (translateX as any)._value || 0;
      const currentY = (translateY as any)._value || 0;
      const currentScale = scale;
      const scaledWidth = imageSize.width * currentScale;
      const scaledHeight = imageSize.height * currentScale;
      const maxX = Math.max(0, (scaledWidth - SCREEN_WIDTH * 0.9) / 2);
      const maxY = Math.max(0, (scaledHeight - SCREEN_HEIGHT * 0.9) / 2);

      if (Math.abs(currentX) > maxX || Math.abs(currentY) > maxY || scaledWidth < SCREEN_WIDTH * 0.9) {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: Math.max(-maxX, Math.min(maxX, currentX)),
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: Math.max(-maxY, Math.min(maxY, currentY)),
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const imageStyle = {
    transform: [
      { translateX },
      { translateY },
      { scale: scaleAnim },
    ],
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.5, 3);
    setScale(newScale);
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: newScale, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 0.5);
    setScale(newScale);
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: newScale, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In a real app, this would process/submit the question
    Alert.alert('Success', 'Question captured successfully!');
  };

  if (!imageUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No image found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleRetake}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <Text style={styles.headerButtonText}>Retake</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Image container with drag */}
      <View style={styles.scrollView}>
        <View style={styles.scrollContent}>
          <Animated.View
            style={[styles.imageContainer, imageStyle]}
            {...panResponder.panHandlers}>
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: imageSize.width,
                  height: imageSize.height,
                },
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>

      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Ionicons name="remove" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.retakeButton]} onPress={handleRetake}>
          <Ionicons name="refresh" size={20} color="#007AFF" />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 16,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 60,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: '#f0f0f0',
  },
  retakeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

