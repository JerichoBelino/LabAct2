import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../styles/theme';
import { getHistory, isSupabaseConfigured } from '../lib/supabase';

// Mock logs to fallback on if Supabase credentials are not set
const MOCK_HISTORY = [
  {
    id: 'mock-1',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    prompt_type: 'academic',
    gemini_response: {
      objects: ['Scientific Microscope', 'Petri Dishes', 'Glass Pipette', 'Specimen Slides'],
      context: 'A laboratory work station set up for educational biology experiments or cell cultures.',
      activities: ['Conducting cell slide research', 'Examining bacteria development', 'Teaching microscope basics'],
      recommendations: ['Calibrate lens elements', 'Use sterilizing procedures', 'Ensure safety goggles are worn']
    },
    roboflow_response: {
      predictions: [
        { class: 'microscope', confidence: 0.94 },
        { class: 'petri_dish', confidence: 0.88 }
      ]
    }
  },
  {
    id: 'mock-2',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    prompt_type: 'safety',
    gemini_response: {
      objects: ['Hard Hat', 'Safety Goggles', 'Reflective Safety Vest', 'Spill kit'],
      context: 'A construction zone or warehouse inspection scene indicating compliance check safety gear.',
      activities: ['Performing site safety audit', 'Equipping protective gear', 'Marking high-hazard areas'],
      recommendations: ['Inspect harness straps daily', 'Replace cracked hard hats', 'Post visibility signage']
    },
    roboflow_response: {
      predictions: [
        { class: 'hard_hat', confidence: 0.98 },
        { class: 'safety_vest', confidence: 0.95 }
      ]
    }
  },
  {
    id: 'mock-3',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    prompt_type: 'inventory',
    gemini_response: {
      objects: ['Cardboard Boxes', 'Storage Pallets', 'Barcode Scanner', 'Wooden Crates'],
      context: 'A loading dock area containing products prepared for shipment and logistical processing.',
      activities: ['Logging item stock numbers', 'Moving pallets using fork lifts', 'Re-arranging storage shelves'],
      recommendations: ['Maintain aisle clearance', 'Perform manual audits monthly', 'Tag damaged crates']
    },
    roboflow_response: null
  }
];

export default function HistoryScreen() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth > 600;

  const fetchHistoryData = async (showRefresher = false) => {
    if (showRefresher) setRefreshing(true);
    else setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const dbLogs = await getHistory();
        setHistoryList(dbLogs);
      } else {
        // Mock data fallback if Supabase is bypassed
        setHistoryList(MOCK_HISTORY);
      }
    } catch (err) {
      console.warn('Failed to load history, falling back to mock database:', err);
      setHistoryList(MOCK_HISTORY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const formatDate = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBadgeDetails = (type) => {
    switch (type) {
      case 'academic':
        return { label: 'Academic', color: COLORS.primaryLight, bg: 'rgba(168, 85, 247, 0.15)' };
      case 'safety':
        return { label: 'Safety', color: COLORS.error, bg: 'rgba(239, 68, 68, 0.15)' };
      case 'inventory':
        return { label: 'Inventory', color: COLORS.info, bg: 'rgba(59, 130, 246, 0.15)' };
      default:
        return { label: 'General', color: COLORS.text, bg: COLORS.glassEffect };
    }
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // Helper to render bullet lists in details modal
  const renderDetailList = (items, icon, iconColor) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <Text style={styles.modalNoData}>None</Text>;
    }
    return items.map((item, idx) => (
      <View key={idx} style={styles.modalBulletItem}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} style={styles.modalBulletIcon} />
        <Text style={styles.modalBulletText}>{item}</Text>
      </View>
    ));
  };

  const renderHistoryItem = ({ item }) => {
    const badge = getBadgeDetails(item.prompt_type);
    const gemini = item.gemini_response || {};
    const objectsCount = gemini.objects ? gemini.objects.length : 0;
    
    return (
      <TouchableOpacity
        style={[styles.historyCard, isTablet && styles.historyCardTablet]}
        onPress={() => openDetails(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>

        <Text style={styles.cardContext} numberOfLines={2}>
          {gemini.context || 'No description available.'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.footerStat}>
            <MaterialCommunityIcons name="cube-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.footerStatText}>{objectsCount} Objects Identified</Text>
          </View>
          {item.roboflow_response && (
            <View style={styles.footerStat}>
              <MaterialCommunityIcons name="target" size={16} color={COLORS.primaryLight} />
              <Text style={styles.footerStatText}>Locally Tracked</Text>
            </View>
          )}
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {!isSupabaseConfigured() && (
        <View style={styles.warningBanner}>
          <MaterialCommunityIcons name="cloud-off-outline" size={16} color={COLORS.warning} />
          <Text style={styles.warningText}>Supabase Offline. Displaying local cache.</Text>
        </View>
      )}

      {loading ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching analysis logs...</Text>
        </View>
      ) : (
        <FlatList
          data={historyList}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + SIZES.paddingMd }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistoryData(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={[styles.center, { marginTop: 60 }]}>
              <MaterialCommunityIcons name="text-box-search-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Scans Yet</Text>
              <Text style={styles.emptyText}>Run some scans to see history logs here.</Text>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      {selectedItem && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { marginTop: insets.top + 40 }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalSubtitle}>
                    {getBadgeDetails(selectedItem.prompt_type).label} Mode • {formatDate(selectedItem.created_at)}
                  </Text>
                  <Text style={styles.modalTitle}>Scan Report</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                contentContainerStyle={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Context section */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Context Context</Text>
                  <Text style={styles.modalSectionContent}>
                    {selectedItem.gemini_response?.context || 'No context description.'}
                  </Text>
                </View>

                {/* Objects list */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Identified Objects</Text>
                  {renderDetailList(selectedItem.gemini_response?.objects, 'checkbox-marked-circle-outline', COLORS.success)}
                </View>

                {/* Activities list */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Activities</Text>
                  {renderDetailList(selectedItem.gemini_response?.activities, 'play-circle-outline', COLORS.info)}
                </View>

                {/* Recommendations list */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Recommendations</Text>
                  {renderDetailList(selectedItem.gemini_response?.recommendations, 'lightbulb-outline', COLORS.warning)}
                </View>

                {/* Roboflow objects list */}
                {selectedItem.roboflow_response && selectedItem.roboflow_response.predictions && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Local Bounding Detections</Text>
                    <View style={styles.modalDetectionsContainer}>
                      {selectedItem.roboflow_response.predictions.map((pred, idx) => (
                        <View key={idx} style={styles.modalDetectionBadge}>
                          <Text style={styles.modalDetectionText}>
                            {pred.class} ({(pred.confidence * 100).toFixed(0)}%)
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  warningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: SIZES.paddingMd,
    borderBottomWidth: 1,
    borderColor: COLORS.warning,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: SIZES.fontXs,
    fontWeight: '500',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontMd,
    marginTop: SIZES.paddingSm,
  },
  listContainer: {
    padding: SIZES.paddingMd,
    gap: SIZES.paddingMd,
  },
  // Card styles
  historyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  historyCardTablet: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.paddingSm,
  },
  badge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: SIZES.fontXs,
    fontWeight: 'bold',
  },
  cardDate: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontXs,
  },
  cardContext: {
    color: COLORS.text,
    fontSize: SIZES.fontSm,
    lineHeight: 18,
    marginBottom: SIZES.paddingSm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerStatText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontXs,
  },
  // Empty State styles
  emptyTitle: {
    color: COLORS.text,
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    marginTop: SIZES.paddingMd,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    textAlign: 'center',
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.paddingMd,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalSubtitle: {
    color: COLORS.primaryLight,
    fontSize: SIZES.fontXs,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glassEffect,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    padding: SIZES.paddingMd,
    gap: SIZES.paddingLg,
  },
  modalSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSectionTitle: {
    color: COLORS.text,
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    marginBottom: SIZES.paddingSm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
  },
  modalSectionContent: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    lineHeight: 20,
  },
  modalNoData: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    fontStyle: 'italic',
  },
  modalBulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  modalBulletIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  modalBulletText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    flex: 1,
    lineHeight: 18,
  },
  modalDetectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalDetectionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalDetectionText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontXs,
  },
});
