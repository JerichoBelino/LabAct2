import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../styles/theme';
import { imageToBase64 } from '../lib/gemini';

export default function PreviewScreen({ route, navigation }) {
  const { photoUri } = route.params;
  const [selectedPrompt, setSelectedPrompt] = useState('academic');
  const [isProcessing, setIsProcessing] = useState(false);

  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth > 600 || windowHeight > 950;

  const promptOptions = [
    {
      key: 'academic',
      title: 'Academic',
      description: 'Analyze educational contexts, subjects, and study tools.',
      icon: 'school',
    },
    {
      key: 'safety',
      title: 'Safety & Hazard',
      description: 'Detect safety gear, compliance issues, and general risks.',
      icon: 'shield-alert',
    },
    {
      key: 'inventory',
      title: 'Inventory Count',
      description: 'Analyze quantities, stock checks, and organization.',
      icon: 'clipboard-list',
    },
  ];

  const handleAnalyze = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      // Convert to Base64 using expo-file-system
      const base64Str = await imageToBase64(photoUri);
      setIsProcessing(false);
      
      // Navigate to Result screen with data
      navigation.navigate('Result', {
        base64Image: base64Str,
        promptKey: selectedPrompt,
      });
    } catch (error) {
      setIsProcessing(false);
      console.error('Error during image processing:', error);
      alert('Failed to process image: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Photo Preview Container */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
      </View>

      {/* Control Panel Area */}
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + SIZES.paddingLg }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Select Analysis Mode</Text>
        
        {/* Prompts Selector */}
        <View style={[styles.optionsContainer, isTablet && styles.optionsContainerTablet]}>
          {promptOptions.map((option) => {
            const isSelected = selectedPrompt === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  isTablet && styles.optionCardTablet
                ]}
                onPress={() => setSelectedPrompt(option.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={24} 
                    color={isSelected ? COLORS.text : COLORS.primaryLight} 
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={[styles.buttonRow, isTablet && styles.buttonRowTablet]}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="camera-retake" size={20} color={COLORS.primaryLight} />
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAnalyze}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.text} />
            <Text style={styles.primaryButtonText}>Analyze</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Converting image formats...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageWrapper: {
    height: '40%',
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    padding: SIZES.paddingMd,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    marginBottom: SIZES.paddingSm,
    letterSpacing: 0.5,
  },
  optionsContainer: {
    gap: SIZES.paddingSm,
    marginBottom: SIZES.paddingLg,
  },
  optionsContainerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSm,
    ...SHADOWS.card,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  optionCardTablet: {
    width: '48%',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusSm,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  optionTitleSelected: {
    color: COLORS.text,
  },
  optionDescription: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontXs,
    marginTop: 2,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SIZES.paddingMd,
    marginTop: SIZES.paddingSm,
  },
  buttonRowTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusRound,
    paddingVertical: SIZES.paddingMd - 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.glow,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusRound,
    paddingVertical: SIZES.paddingMd - 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: COLORS.primaryLight,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.paddingMd,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: SIZES.fontMd,
    fontWeight: '500',
  },
});
