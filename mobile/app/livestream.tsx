import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  startLivestream,
  stopLivestream,
  sendLiveComment,
  getLiveComments,
  type Livestream,
  type LiveComment,
} from '@/services/livestream';
import { showError, showSuccess } from '@/utils/toast';

export default function LivestreamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isMuted, setIsMuted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [livestream, setLivestream] = useState<Livestream | null>(null);
  const [duration, setDuration] = useState(0); // in seconds
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (permission?.granted) {
      handleStartLivestream();
    }
  }, [permission]);

  useEffect(() => {
    if (isStreaming) {
      // Duration timer
      const durationInterval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Fetch comments periodically
      const commentsInterval = setInterval(() => {
        fetchComments();
      }, 3000);

      // Update viewer count periodically (in production, this would be WebSocket)
      const viewerInterval = setInterval(() => {
        if (livestream) {
          // Simulate viewer count changes
          setViewerCount((prev) => Math.max(0, prev + Math.floor(Math.random() * 10) - 3));
        }
      }, 5000);

      return () => {
        clearInterval(durationInterval);
        clearInterval(commentsInterval);
        clearInterval(viewerInterval);
      };
    }
  }, [isStreaming, livestream]);

  const handleStartLivestream = async () => {
    try {
      const stream = await startLivestream({
        booking_id: bookingId,
        title: 'Live Ride',
      });
      setLivestream(stream);
      setIsStreaming(true);
      setViewerCount(0);
      showSuccess('Livestream started!');
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to start livestream');
      router.back();
    }
  };

  const handleStopLivestream = () => {
    Alert.alert(
      'Stop Livestream',
      'Are you sure you want to end your livestream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: confirmStopLivestream,
        },
      ]
    );
  };

  const confirmStopLivestream = async () => {
    try {
      if (livestream) {
        await stopLivestream(livestream.id);
        showSuccess('Livestream ended');
        router.back();
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to stop livestream');
    }
  };

  const fetchComments = async () => {
    if (!livestream) return;

    try {
      const fetchedComments = await getLiveComments(livestream.id, 20);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSendComment = async () => {
    if (!livestream || commentText.trim() === '') return;

    try {
      const newComment = await sendLiveComment(livestream.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (error: any) {
      showError('Failed to send comment');
    }
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm livestreaming my HotRide! Join me: hotride://livestream/${livestream?.id}`,
        title: 'Join my livestream',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderComment = ({ item }: { item: LiveComment }) => (
    <View style={styles.commentItem}>
      <Text style={styles.commentUsername}>{item.username}</Text>
      <Text style={styles.commentMessage}>{item.message}</Text>
    </View>
  );

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera" size={80} color={Colors.placeholder} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionMessage}>
          HotRide needs access to your camera to livestream your ride experience.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        enableTorch={false}
        mode="video"
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          {/* Live Indicator */}
          <View style={styles.liveContainer}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>

          {/* Viewer Count */}
          <View style={styles.viewerContainer}>
            <Ionicons name="eye" size={18} color={Colors.white} />
            <Text style={styles.viewerCount}>{viewerCount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Right Side Controls */}
        <View style={styles.rightControls}>
          {/* Flip Camera */}
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
            <Ionicons name="camera-reverse" size={28} color={Colors.white} />
          </TouchableOpacity>

          {/* Mute/Unmute */}
          <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={28}
              color={isMuted ? Colors.error : Colors.white}
            />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.controlButton} onPress={handleShare}>
            <Ionicons name="share-social" size={28} color={Colors.white} />
          </TouchableOpacity>

          {/* Stop Livestream */}
          <TouchableOpacity style={styles.stopButton} onPress={handleStopLivestream}>
            <View style={styles.stopInner} />
          </TouchableOpacity>
        </View>

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

          {/* Safety Message */}
          <View style={styles.safetyMessage}>
            <Ionicons name="alert-circle" size={16} color={Colors.white} />
            <Text style={styles.safetyText}>
              Safety first! Please hold on securely while streaming.
            </Text>
          </View>

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
      </CameraView>
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#000',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 24,
    marginBottom: 12,
  },
  permissionMessage: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
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
  rightControls: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 24,
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  stopInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  commentsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  commentsList: {
    maxHeight: 200,
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
  safetyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 51, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.white,
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
