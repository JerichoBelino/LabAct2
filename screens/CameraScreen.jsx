import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../styles/theme';

export default function CameraScreen({ navigation }) {
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const isTablet = windowWidth > 600 || windowHeight > 950;

  // Handle take picture logic
  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false, // Ensure image is fully processed
      });
      
      if (photo && photo.uri) {
        setIsCapturing(false);
        navigation.navigate('Preview', { photoUri: photo.uri });
      }
    } catch (error) {
      setIsCapturing(false);
      console.error('Failed to take picture:', error);
      alert('Error capturing photo. Please try again.');
    }
  };

  // Switch between front and back camera
  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  // Permission State 1: Loading
  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  // Permission State 2: Permission Denied
  if (!permission.granted) {
    const isIos = Platform.OS === 'ios';
    const descriptionText = Platform.select({
      ios: 'iOS requires explicit camera permission. If denied previously, you can enable camera access in Settings > Privacy > Camera.',
      android: 'Android requires camera permission. Please grant camera access so VisionAI can capture and analyze images.',
      default: 'Camera permission is required to run visual analysis.',
    });

    return (
      <View style={[styles.container, styles.permissionContainer, { paddingHorizontal: isTablet ? 64 : 24 }]}>
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-off" size={64} color={COLORS.primary} style={styles.permissionIcon} />
          
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          
          <Text style={styles.permissionDescription}>
            {descriptionText}
          </Text>

          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Permission State 3: Permission Granted (Camera Preview)
  return (
    <View style={styles.container}>
      {/* Background Camera View (no children inside) */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      />

      {/* Foreground UI Overlays (Absolute Positioning) */}
      
      {/* Floating Header */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + SIZES.paddingSm }]}>
        <Text style={styles.appTitle}>VisionAI</Text>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="history" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Floating Camera Side Controls */}
      <View style={[styles.sideControlsOverlay, { top: insets.top + 80 }]}>
        <TouchableOpacity style={styles.sideIconButton} onPress={toggleFacing} activeOpacity={0.7}>
          <MaterialCommunityIcons name="camera-flip" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sideIconButton} onPress={toggleFlash} activeOpacity={0.7}>
          <MaterialCommunityIcons 
            name={flash === 'on' ? 'flash' : 'flash-off'} 
            size={24} 
            color={flash === 'on' ? COLORS.primaryLight : COLORS.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls Overlay */}
      <View style={[styles.bottomControlsOverlay, { paddingBottom: insets.bottom + SIZES.paddingLg }]}>
        <View style={[styles.captureContainer, isTablet && styles.tabletCaptureContainer]}>
          {/* Main Capture Button */}
          <TouchableOpacity
            style={[styles.captureOuterRing, isTablet && styles.tabletCaptureOuterRing]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            <View style={[styles.captureInnerCircle, isCapturing && styles.captureInnerCircleActive]}>
              {isCapturing && <ActivityIndicator color={COLORS.primary} size="small" />}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontMd,
    marginTop: SIZES.paddingSm,
  },
  // Permission Styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  permissionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingLg,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permissionIcon: {
    marginBottom: SIZES.paddingMd,
  },
  permissionTitle: {
    color: COLORS.text,
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    marginBottom: SIZES.paddingSm,
    textAlign: 'center',
  },
  permissionDescription: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.paddingLg,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.paddingSm + 2,
    paddingHorizontal: SIZES.paddingLg + 8,
    borderRadius: SIZES.radiusRound,
    ...SHADOWS.glow,
  },
  permissionButtonText: {
    color: COLORS.text,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  // Camera UI Styles
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLg,
    backgroundColor: 'rgba(18, 11, 36, 0.4)',
  },
  appTitle: {
    color: COLORS.text,
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sideControlsOverlay: {
    position: 'absolute',
    right: SIZES.paddingLg,
    backgroundColor: COLORS.overlay,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingSm,
    gap: SIZES.paddingSm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  sideIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glassEffect,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabletCaptureContainer: {
    transform: [{ scale: 1.2 }],
  },
  captureOuterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...SHADOWS.glow,
  },
  tabletCaptureOuterRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  captureInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});
