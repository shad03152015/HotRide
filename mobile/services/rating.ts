/**
 * Rating API service
 */
import api from './api';

export interface Rating {
  id: string;
  booking_id: string;
  user_id: string;
  driver_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SubmitRatingRequest {
  booking_id: string;
  rating: number;
  comment?: string;
}

export interface DriverRatingStats {
  driver_id: string;
  average_rating: number;
  total_ratings: number;
  rating_breakdown: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
}

/**
 * Submit a rating for a completed ride
 */
export async function submitRating(data: SubmitRatingRequest): Promise<Rating> {
  const response = await api.post<Rating>('/ratings/submit', data);
  return response.data;
}

/**
 * Get rating statistics for a driver
 */
export async function getDriverRatingStats(driverId: string): Promise<DriverRatingStats> {
  const response = await api.get<DriverRatingStats>(`/ratings/driver/${driverId}/stats`);
  return response.data;
}

/**
 * Get rating for a specific booking
 */
export async function getBookingRating(bookingId: string): Promise<Rating> {
  const response = await api.get<Rating>(`/ratings/booking/${bookingId}`);
  return response.data;
}

/**
 * Get all ratings submitted by current user
 */
export async function getMyRatings(limit: number = 20, skip: number = 0): Promise<Rating[]> {
  const response = await api.get<Rating[]>('/ratings/my-ratings', {
    params: { limit, skip }
  });
  return response.data;
}
