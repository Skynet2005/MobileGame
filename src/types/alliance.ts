export type AllianceRank = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export interface AllianceMember {
  characterId: string;
  characterName: string;
  rank: AllianceRank;
  power: number;
  joinedAt: Date;
}

export interface AllianceBanner {
  color: string;
  badge: string;
  badgeIcon: string;
  trimColor: string;
  innerColor: string;
  shape: 'classic' | 'smooth' | 'inverse-pointed' | 'rounded' | 'inverse-rounded' | 'flared';
}

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  leaderName: string;
  members: AllianceMember[];
  banner: AllianceBanner;
  recruitingSetting: 'instant' | 'application';
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  totalPower: number;
  maxMembers: number;
}

export interface AllianceApplication {
  id: string;
  allianceId: string;
  characterId: string;
  characterName: string;
  power: number;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: Date;
  processedAt: Date | null;
  processedBy: string | null;
}

export interface AllianceSettings {
  recruitingSetting: 'instant' | 'application';
  preferredLanguage: string;
  maxMembers: number;
}

export interface AllianceRankPermissions {
  canModifyBanner: boolean;
  canModifySettings: boolean;
  canChangeRanks: boolean;
  canAcceptApplications: boolean;
  canKickMembers: boolean;
}

export const ALLIANCE_RANK_PERMISSIONS: Record<AllianceRank, AllianceRankPermissions> = {
  R0: {
    canModifyBanner: false,
    canModifySettings: false,
    canChangeRanks: false,
    canAcceptApplications: false,
    canKickMembers: false,
  },
  R1: {
    canModifyBanner: false,
    canModifySettings: false,
    canChangeRanks: false,
    canAcceptApplications: false,
    canKickMembers: false,
  },
  R2: {
    canModifyBanner: false,
    canModifySettings: false,
    canChangeRanks: false,
    canAcceptApplications: false,
    canKickMembers: false,
  },
  R3: {
    canModifyBanner: false,
    canModifySettings: false,
    canChangeRanks: false,
    canAcceptApplications: false,
    canKickMembers: false,
  },
  R4: {
    canModifyBanner: false,
    canModifySettings: true,
    canChangeRanks: true,
    canAcceptApplications: true,
    canKickMembers: true,
  },
  R5: {
    canModifyBanner: true,
    canModifySettings: true,
    canChangeRanks: true,
    canAcceptApplications: true,
    canKickMembers: true,
  },
};

export const ALLIANCE_RANK_NAMES: Record<AllianceRank, string> = {
  R0: 'Application List',
  R1: 'Alliance Rank 1',
  R2: 'Alliance Rank 2',
  R3: 'Alliance Rank 3',
  R4: 'Alliance Rank 4',
  R5: 'Alliance Leader',
};

export interface AllianceBannerProps {
  color?: string;
  badge?: string;
  badgeIcon?: string;
  trimColor?: string;
  innerColor?: string;
  shape?: 'classic' | 'smooth' | 'inverse-pointed' | 'rounded' | 'inverse-rounded' | 'flared';
  size?: 'small' | 'medium' | 'large';
}
