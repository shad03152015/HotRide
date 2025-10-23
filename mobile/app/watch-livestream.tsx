import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  joinLivestream,
  leaveLivestream,
  sendLiveComment,
  getLiveComments,
  getLivestream,
  type Livestream,
  type LiveComment,
  type JoinLivestreamResponse,
} from '@/services/livestream';
import { showError, showSuccess } from '@/utils/toast';

export default function WatchLivestreamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const livestreamId = params.livestreamId as string;

  const [livestream, setLivestream] = useState<Livestream | null>(null);
  const [joinData, setJoinData] = useState<JoinLivestreamResponse | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    handleJoinLivestream();

    // Fetch comments periodically
    const commentsInterval = setInterval(() => {
      fetchComments();
    }, 3000);

    // Update livestream data periodically
    const livestreamInterval = setInterval(() => {
      fetchLivestreamData();
    }, 5000);

    return () => {
      clearInterval(commentsInterval);
      clearInterval(livestreamInterval);
      handleLeaveLivestream();
    };
  }, []);

  const handleJoinLivestream = async () => {
    try {
      const data = await joinLivestream(livestreamId);
      setJoinData(data);
      setLivestream(data.livestream);
      setIsLoading(false);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to join livestream');
      router.back();
    }
  };

  const handleLeaveLivestream = async () => {
    try {
      await leaveLivestream(livestreamId);
    } catch (error) {
      console.error('Failed to leave livestream:', error);
    }
  };

  const fetchLivestreamData = async () => {
    try {
      const data = await getLivestream(livestreamId);
      setLivestream(data);

      // If livestream ended, navigate back
      if (!data.is_active) {
        showSuccess('Livestream has ended');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch livestream data:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const fetchedComments = await getLiveComments(livestreamId, 20);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSendComment = async () => {
    if (commentText.trim() === '') return;

    try {
      const newComment = await sendLiveComment(livestreamId, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (error: any) {
      showError('Failed to send comment');
    }
  };

  const handleLeave = () => {
    router.back();
  };

  const getDuration = () => {
    if (!livestream) return '00:00';

    const startTime = new Date(livestream.started_at).getTime();
    const now = Date.now();
    const diffSeconds = Math.floor((now - startTime) / 1000);

    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderComment = ({ item }: { item: LiveComment }) => (
    <View style={styles.commentItem}>
      <Text style={styles.commentUsername}>{item.username}</Text>
      <Text style={styles.commentMessage}>{item.message}</Text>
    </View>
  );

  if (isLoading || !livestream) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Joining livestream...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video View Placeholder - In production, this would be WebRTC video */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80' }}
        style={styles.videoView}
        resizeMode="cover"
      >
        {/* Dark Overlay */}
        <View style={styles.overlay} />

        {/* Top Controls */}
        <View style={styles.topControls}>
          {/* Live Indicator */}
          <View style={styles.liveContainer}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.durationText}>{getDuration()}</Text>
          </View>

          {/* Viewer Count */}
          <View style={styles.viewerContainer}>
            <Ionicons name="eye" size={18} color={Colors.white} />
            <Text style={styles.viewerCount}>{livestream.viewer_count.toLocaleString()}</Text>
          </View>
        </View>

        {/* Stream Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.streamTitle}>{livestream.title}</Text>
        </View>

        {/* Leave Button */}
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          {/* Comments List */}
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            inverted={false}
          />

          {/* Comment Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.commentInput}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={commentText}
                onChangeText={setCommentText}
                maxLength={200}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  commentText.trim() === '' && styles.sendButtonDisabled,
                ]}
                onPress={handleSendComment}
                disabled={commentText.trim() === ''}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={commentText.trim() === '' ? 'rgba(255, 255, 255, 0.4)' : Colors.white}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.white,
  },
  videoView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  liveText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  viewerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  titleContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  leaveButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  commentsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    zIndex: 10,
  },
  commentsList: {
    maxHeight: 250,
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%',
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  commentMessage: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 18,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
    paddingVertical: 10,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
