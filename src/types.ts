export type CategoryType = 
  | 'Verbal' 
  | 'Physical' 
  | 'Digital' 
  | 'Stalking' 
  | 'Quid-Pro-Quo' 
  | 'Financial / Economic'
  | 'Intimidation / Non-verbal'
  | 'Other';

export interface PersonInvolved {
  id: string;
  name: string;
  roleOrRelationship: string; // e.g. "Manager", "Senior Lead", "Delivery Executive", "Peer"
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video';
  dataUrl?: string; // Base64 data URL for images/video/audio
  size?: number;
  uploadedAt: string;
  isLiveCapture?: boolean;
  captureMethod?: 'camera' | 'upload' | 'voice_recording';
}

export interface StructuredNarrative {
  summary: string;
  context: string;
  keyActions: string[];
  impactDescription: string;
  recommendedFollowUp?: string;
}

export interface Incident {
  id: string;
  created_at: string; // ISO String timestamp of entry creation
  incident_datetime: string; // ISO String or human readable datetime of when incident occurred
  location: string;
  latitude?: number;
  longitude?: number;
  people_involved: PersonInvolved[];
  category: CategoryType;
  narrative_raw: string;
  narrative_structured: StructuredNarrative;
  witnesses: string[];
  severity?: number; // 1 to 5 rating
  attachments: Attachment[];
  user_edited: boolean;
  tags: string[];
  isQuickCaptureDraft?: boolean;
}

export interface AppSettings {
  pinEnabled: boolean;
  pinCode: string; // 4 digit string
  quickExitEnabled: boolean;
  quickExitUrl: string; // e.g., 'https://www.google.com' or 'https://weather.com'
  trustedContactName?: string;
  trustedContactPhone?: string;
  localOnlyStorage: boolean;
  theme: 'dark' | 'light' | 'stealth';
  demoMode: boolean;
  hasSeenDisguiseTutorial?: boolean;
}

export interface PatternCluster {
  type: 'person' | 'location' | 'time' | 'category';
  key: string; // e.g. "Manager - Rohan" or "4th Floor Breakroom"
  count: number;
  incidents: Incident[];
  firstSeen: string;
  lastSeen: string;
  escalationScore: number; // 1 to 10
  description: string;
}

export interface PatternInsightReport {
  overallRiskLevel: 'Low' | 'Moderate' | 'Elevated' | 'High';
  headline: string;
  detailedAnalysis: string;
  clusters: PatternCluster[];
  suggestedActions: string[];
}
