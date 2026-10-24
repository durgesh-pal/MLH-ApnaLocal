export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
}

export interface CustomerProfile {
  userId: string;
  phoneNumber?: string;
  locality?: string;
  preferredLanguage?: string;
  address?: string;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface ProviderProfile {
  userId: string;
  businessName?: string;
  bio?: string;
  categoryIds?: string[];
  skills?: string[];
  locality?: string;
  serviceAreas?: string[];
  workingHours?: Record<string, any>;
  verificationStatus: VerificationStatus;
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  priceGuidance?: string;
}

export type BookingStatus = 
  | 'pending' 
  | 'accepted' 
  | 'rejected' 
  | 'reschedule_requested' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  status: BookingStatus;
  scheduledAt: string;
  problemDescription: string;
  address: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  type: 'recommendation' | 'lost-found' | 'help' | 'announcement';
  title: string;
  content: string;
  locality: string;
  createdAt: string;
  expiresAt?: string;
}
