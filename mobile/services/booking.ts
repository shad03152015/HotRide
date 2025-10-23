import api from './api';

/**
 * Booking API calls
 */

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

export interface CreateBookingRequest {
  pickup_location: Location;
  destination: Location;
  distance: number;
  estimated_time: number;
  base_fare: number;
  gratuity: number;
  total_fare: number;
  notes?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  driver_id?: string;
  pickup_location: Location;
  destination: Location;
  distance: number;
  estimated_time: number;
  base_fare: number;
  gratuity: number;
  total_fare: number;
  notes: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
}

/**
 * Create a new ride booking
 */
export async function createBooking(data: CreateBookingRequest): Promise<Booking> {
  const response = await api.post<Booking>('/bookings/create', data);
  return response.data;
}

/**
 * Get current user's booking history
 */
export async function getMyBookings(limit: number = 20, skip: number = 0): Promise<BookingListResponse> {
  const response = await api.get<BookingListResponse>('/bookings/my-bookings', {
    params: { limit, skip },
  });
  return response.data;
}

/**
 * Get specific booking details
 */
export async function getBooking(bookingId: string): Promise<Booking> {
  const response = await api.get<Booking>(`/bookings/${bookingId}`);
  return response.data;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/bookings/${bookingId}`);
  return response.data;
}
