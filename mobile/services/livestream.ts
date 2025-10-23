/**
 * Livestream API service
 */
import api from './api';

export interface Livestream {
  id: string;
  user_id: string;
  booking_id: string;
  title: string;
  viewer_count: number;
  is_active: boolean;
  started_at: string;
  ended_at?: string;
}

export interface LiveComment {
  id: string;
  livestream_id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
}

export interface StartLivestreamRequest {
  booking_id: string;
  title?: string;
}

export interface JoinLivestreamResponse {
  livestream: Livestream;
  stream_url?: string;
  chat_room_id: string;
}

export interface LivestreamListResponse {
  livestreams: Livestream[];
  total: number;
}

/**
 * Start a new livestream
 */
export async function startLivestream(data: StartLivestreamRequest): Promise<Livestream> {
  const response = await api.post<Livestream>('/livestreams/start', data);
  return response.data;
}

/**
 * Stop an active livestream
 */
export async function stopLivestream(livestreamId: string): Promise<Livestream> {
  const response = await api.post<Livestream>(`/livestreams/${livestreamId}/stop`);
  return response.data;
}

/**
 * Get active livestreams
 */
export async function getActiveLivestreams(limit: number = 20, skip: number = 0): Promise<LivestreamListResponse> {
  const response = await api.get<LivestreamListResponse>('/livestreams/active', {
    params: { limit, skip }
  });
  return response.data;
}

/**
 * Join a livestream as a viewer
 */
export async function joinLivestream(livestreamId: string): Promise<JoinLivestreamResponse> {
  const response = await api.get<JoinLivestreamResponse>(`/livestreams/${livestreamId}/join`);
  return response.data;
}

/**
 * Leave a livestream
 */
export async function leaveLivestream(livestreamId: string): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(`/livestreams/${livestreamId}/leave`);
  return response.data;
}

/**
 * Send a comment to a livestream
 */
export async function sendLiveComment(livestreamId: string, message: string): Promise<LiveComment> {
  const response = await api.post<LiveComment>('/livestreams/comments', {
    livestream_id: livestreamId,
    message
  });
  return response.data;
}

/**
 * Get comments for a livestream
 */
export async function getLiveComments(livestreamId: string, limit: number = 50, skip: number = 0): Promise<LiveComment[]> {
  const response = await api.get<LiveComment[]>(`/livestreams/${livestreamId}/comments`, {
    params: { limit, skip }
  });
  return response.data;
}

/**
 * Get livestream details
 */
export async function getLivestream(livestreamId: string): Promise<Livestream> {
  const response = await api.get<Livestream>(`/livestreams/${livestreamId}`);
  return response.data;
}
