import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getActiveLivestreams, type Livestream } from '@/services/livestream';
import { showError } from '@/utils/toast';

export default function BrowseLivestreamsScreen() {
  const router = useRouter();
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLivestreams();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchLivestreams(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchLivestreams = async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await getActiveLivestreams(20, 0);
      setLivestreams(response.livestreams);
      setTotal(response.total);
    } catch (error: any) {
      if (!silent) {
        showError(error.response?.data?.detail || 'Failed to load livestreams');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLivestreams();
  };

  const handleJoinLivestream = (livestreamId: string) => {
    router.push(`/watch-livestream?livestreamId=${livestreamId}`);
  };

  const getDuration = (startedAt: string) => {
    const startTime = new Date(startedAt).getTime();
    const now = Date.now();
    const diffSeconds = Math.floor((now - startTime) / 1000);

    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLivestreamItem = ({ item }: { item: Livestream }) => (
    <TouchableOpacity
      style={styles.livestreamCard}
      activeOpacity={0.8}
      onPress={() => handleJoinLivestream(item.id)}
    >
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80' }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        {/* Dark Overlay */}
        <View style={styles.cardOverlay} />

        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Viewer Count */}
        <View style={styles.viewerBadge}>
          <Ionicons name="eye" size={14} color={Colors.white} />
          <Text style={styles.viewerText}>{item.viewer_count.toLocaleString()}</Text>
        </View>

        {/* Duration */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{getDuration(item.started_at)}</Text>
        </View>

        {/* Title */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="videocam-off-outline" size={80} color={Colors.placeholder} />
      <Text style={styles.emptyStateTitle}>No Live Streams</Text>
      <Text style={styles.emptyStateMessage}>
        There are no active livestreams right now. Check back later or start your own ride and go
        live!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Streams</Text>
        <View style={styles.headerRight}>
          {total > 0 && (
            <View style={styles.liveCountBadge}>
              <View style={styles.liveCountDot} />
              <Text style={styles.liveCountText}>{total}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading livestreams...</Text>
        </View>
      ) : (
        <FlatList
          data={livestreams}
          renderItem={renderLivestreamItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            livestreams.length === 0 && styles.listContentEmpty,
          ]}
          columnWrapperStyle={livestreams.length > 0 ? styles.columnWrapper : undefined}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputBorder,
  },
  backButton: {
    padding: 8,
    width: 80,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary,
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  liveCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveCountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  liveCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.placeholder,
  },
  listContent: {
    padding: 12,
  },
  listContentEmpty: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  livestreamCard: {
    width: '48%',
    aspectRatio: 0.75,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageStyle: {
    borderRadius: 12,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  viewerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  durationBadge: {
    position: 'absolute',
    top: 40,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 15,
    color: Colors.placeholder,
    textAlign: 'center',
    lineHeight: 22,
  },
});
