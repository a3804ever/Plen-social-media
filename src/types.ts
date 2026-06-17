/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PilotProfile {
  id: string;
  username: string;
  callsign: string;
  licenseType: 'Student' | 'Private Pilot (PPL)' | 'Commercial Pilot (CPL)' | 'Airline Transport (ATP)' | 'Military Aviator' | 'Aviation Spotter';
  simHours: number;
  homeAirport: string;
  verified: boolean;
}

export interface UserAccount extends PilotProfile {
  passwordHash: string;
}

export interface Comment {
  id: string;
  authorUsername: string;
  authorCallsign: string;
  authorLicense: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  type: 'photo' | 'discussion';
  authorId: string;
  authorUsername: string;
  authorCallsign: string;
  authorLicense: string;
  authorVerified: boolean;
  title: string;
  content: string;
  image?: string;
  aircraftType?: string;
  registration?: string; // e.g. N104AA
  airline?: string;      // e.g. American Airlines
  airport?: string;      // e.g. KJFK
  elevation?: string;    // e.g. 5000 ft
  likes: string[];       // User IDs of those who liked
  savedBy: string[];     // User IDs of those who saved/bookmarked
  category?: string;     // Topic categorization
  timestamp: string;
  comments: Comment[];
}

export interface ForumReply {
  id: string;
  authorUsername: string;
  authorCallsign: string;
  authorLicense: string;
  content: string;
  timestamp: string;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  authorUsername: string;
  authorCallsign: string;
  authorLicense: string;
  timestamp: string;
  replies: ForumReply[];
}

export interface ForumCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface SyncDevice {
  id: string;
  name: string;
  platform: 'PC' | 'Mac' | 'iOS' | 'Android' | 'Web WebApp';
  lastSync: string;
  status: 'Online' | 'Offline';
  ipAddress: string;
}
