import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../styles/theme';
import { analyzeImage, PROMPTS } from '../lib/gemini';
import { detectObjects } from '../lib/roboflow';
import { saveAnalysis, isSupabaseConfigured } from '../lib/supabase';

export default function ResultScreen({ route, navigation }) {
  const { base64Image, promptKey } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geminiData, setGeminiData] = useState(null);
  const [roboflowData, setRoboflowData] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth > 768;

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedPromptText = PROMPTS[promptKey];
      if (!selectedPromptText) {
        throw new Error(`Invalid prompt key: ${promptKey}`);
      }

      // Execute Gemini and optional Roboflow calls concurrently
      const [geminiResult, roboflowResult] = await Promise.all([
        analyzeImage(base64Image, selectedPromptText),
        detectObjects(base64Image),
      ]);

      setGeminiData(geminiResult);
      setRoboflowData(roboflowResult);

      // Attempt to save to Supabase history if configured
      if (isSupabaseConfigured()) {
        try {
          await saveAnalysis(promptKey, geminiResult, roboflowResult);
          setIsSaved(true);
        } catch (dbError) {
          console.warn('Failed to save to database history:', dbError.message);
          // Don't fail the entire screen if only DB save fails
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [base64Image, promptKey]);

  const handleLoadDemo = () => {
    setError(null);
    setLoading(false);
    
    const demoData = {
      academic: {
        objects: ['Scientific Microscope', 'Petri Dishes', 'Glass Pipette', 'Specimen Slides'],
        context: 'A laboratory work station set up for educational biology experiments or cell cultures (Loaded in Demo Mode due to API limits).',
        activities: ['Conducting cell slide research', 'Examining bacteria development', 'Teaching microscope basics'],
        recommendations: ['Calibrate lens elements', 'Use sterilizing procedures', 'Ensure safety goggles are worn']
      },
      safety: {
        objects: ['Hard Hat', 'Safety Goggles', 'Reflective Safety Vest', 'Spill kit'],
        context: 'A construction zone or warehouse inspection scene indicating compliance check safety gear (Loaded in Demo Mode due to API limits).',
        activities: ['Performing site safety audit', 'Equipping protective gear', 'Marking high-hazard areas'],
        recommendations: ['Inspect harness straps daily', 'Replace cracked hard hats', 'Post visibility signage']
      },
      inventory: {
        objects: ['Cardboard Boxes', 'Storage Pallets', 'Barcode Scanner', 'Wooden Crates'],
        context: 'A loading dock area containing products prepared for shipment and logistical processing (Loaded in Demo Mode due to API limits).',
        activities: ['Logging item stock numbers', 'Moving pallets using fork lifts', 'Re-arranging storage shelves'],
        recommendations: ['Maintain aisle clearance', 'Perform manual audits monthly', 'Tag damaged crates']
      }
    };
    
    setGeminiData(demoData[promptKey] || demoData.academic);
    setRoboflowData({
      predictions: [
        { class: 'sample_object', confidence: 0.90 }
      ]
    });
  };

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>VisionAI is analyzing the scene...</Text>
        <Text style={styles.subLoadingText}>Generating objects, context, and recommendations</Text>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={[styles.container, styles.center, { padding: SIZES.paddingLg }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        
        <TouchableOpacity style={styles.retryButton} onPress={runAnalysis}>
          <MaterialCommunityIcons name="refresh" size={20} color={COLORS.text} />
          <Text style={styles.retryButtonText}>Retry Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.demoButton} onPress={handleLoadDemo}>
          <MaterialCommunityIcons name="eye-outline" size={20} color={COLORS.primaryLight} />
          <Text style={styles.demoButtonText}>Load Demo Data (Skip API)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Camera')}>
          <Text style={styles.backButtonText}>Return to Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helper to render bullet lists
  const renderBulletList = (items, icon, iconColor) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <Text style={styles.noDataText}>None detected</Text>;
    }
    return items.map((item, idx) => (
      <View key={idx} style={styles.bulletItem}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} style={styles.bulletIcon} />
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ));
  };

  const promptBadgeTitle = promptKey.charAt(0).toUpperCase() + promptKey.slice(1);

  // Success State
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + SIZES.paddingLg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View style={styles.promptBadge}>
              <Text style={styles.promptBadgeText}>{promptBadgeTitle} Mode</Text>
            </View>
            {isSaved && (
              <View style={styles.saveBadge}>
                <MaterialCommunityIcons name="cloud-check" size={14} color={COLORS.success} />
                <Text style={styles.saveBadgeText}>Logged</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>AI Scene Insights</Text>
        </View>

        {/* Responsive Grid/Flex View */}
        <View style={[styles.gridContainer, isTablet && styles.gridContainerTablet]}>
          
          {/* Main Context Card */}
          <View style={[styles.card, isTablet && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="earth" size={22} color={COLORS.primaryLight} />
              <Text style={styles.cardTitle}>Context Description</Text>
            </View>
            <Text style={styles.contextText}>
              {geminiData?.context || 'No context description generated.'}
            </Text>
          </View>

          {/* Objects Detected Card */}
          <View style={[styles.card, isTablet && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="google-circles-extended" size={22} color={COLORS.primaryLight} />
              <Text style={styles.cardTitle}>Objects Identified</Text>
            </View>
            {renderBulletList(geminiData?.objects, 'check-circle-outline', COLORS.success)}
          </View>

          {/* Activities Card */}
          <View style={[styles.card, isTablet && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="run" size={22} color={COLORS.primaryLight} />
              <Text style={styles.cardTitle}>Observed Activities</Text>
            </View>
            {renderBulletList(geminiData?.activities, 'play-circle-outline', COLORS.info)}
          </View>

          {/* Recommendations Card */}
          <View style={[styles.card, isTablet && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={22} color={COLORS.primaryLight} />
              <Text style={styles.cardTitle}>Recommendations</Text>
            </View>
            {renderBulletList(geminiData?.recommendations, 'star-outline', COLORS.warning)}
          </View>

        </View>

        {/* Optional Roboflow Object Detection Results */}
        {roboflowData && roboflowData.predictions && (
          <View style={styles.roboflowCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="target" size={22} color={COLORS.primaryLight} />
              <Text style={styles.cardTitle}>Local Object Detections (Roboflow)</Text>
            </View>
            
            {roboflowData.predictions.length === 0 ? (
              <Text style={styles.noDataText}>No localized bounding boxes detected.</Text>
            ) : (
              <View style={styles.detectionsGrid}>
                {roboflowData.predictions.map((pred, index) => (
                  <View key={index} style={styles.detectionItem}>
                    <Text style={styles.detectionClass}>{pred.class}</Text>
                    <Text style={styles.detectionConf}>{(pred.confidence * 100).toFixed(0)}% Match</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Bottom Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.8}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>

      </ScrollView>
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
  scrollContainer: {
    padding: SIZES.paddingMd,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    marginTop: SIZES.paddingMd,
  },
  subLoadingText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    marginTop: 6,
    textAlign: 'center',
  },
  // Error Styles
  errorTitle: {
    color: COLORS.error,
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    marginTop: SIZES.paddingMd,
    marginBottom: SIZES.paddingSm,
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontMd,
    textAlign: 'center',
    marginBottom: SIZES.paddingLg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SIZES.paddingSm + 2,
    paddingHorizontal: SIZES.paddingLg,
    borderRadius: SIZES.radiusRound,
    ...SHADOWS.glow,
    marginBottom: SIZES.paddingMd,
  },
  retryButtonText: {
    color: COLORS.text,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SIZES.paddingSm + 2,
    paddingHorizontal: SIZES.paddingLg,
    borderRadius: SIZES.radiusRound,
    marginBottom: SIZES.paddingMd,
  },
  demoButtonText: {
    color: COLORS.primaryLight,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: SIZES.paddingSm,
  },
  backButtonText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    textDecorationLine: 'underline',
  },
  // Header styles
  headerCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    marginBottom: SIZES.paddingMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SIZES.paddingSm,
    marginBottom: 8,
  },
  promptBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  promptBadgeText: {
    color: COLORS.primaryLight,
    fontSize: SIZES.fontXs,
    fontWeight: 'bold',
  },
  saveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveBadgeText: {
    color: COLORS.success,
    fontSize: SIZES.fontXs,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: SIZES.font2xl,
    fontWeight: 'bold',
  },
  // Grid layout styles
  gridContainer: {
    gap: SIZES.paddingMd,
  },
  gridContainerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardHalf: {
    width: '48%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SIZES.paddingSm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
  },
  contextText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    lineHeight: 20,
  },
  noDataText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    fontStyle: 'italic',
  },
  // Bullet lists
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  bulletText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    flex: 1,
    lineHeight: 18,
  },
  // Roboflow detections
  roboflowCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    marginTop: SIZES.paddingMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  detectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detectionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detectionClass: {
    color: COLORS.text,
    fontSize: SIZES.fontSm,
    fontWeight: '600',
  },
  detectionConf: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontXs,
    marginTop: 2,
  },
  // Bottom Done Button
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusRound,
    paddingVertical: SIZES.paddingMd - 2,
    alignItems: 'center',
    marginTop: SIZES.paddingLg,
    ...SHADOWS.glow,
  },
  doneButtonText: {
    color: COLORS.text,
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
  },
});
