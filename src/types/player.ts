// Global type declarations for the game
export interface Window {
  game?: any;
}

// Account type definition
export interface Account {
  id: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
  settings: AccountSettings;
  characters: Character[];
}

// Account Settings type definition
export interface AccountSettings {
  notifications: {
    email: boolean;
    push: boolean;
    inGame: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    showLastSeen: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
  };
  gameplay: {
    autoSave: boolean;
    tutorialCompleted: boolean;
    graphicsQuality: 'Ultra' | 'High' | 'Medium' | 'Standard';
    soundEnabled: boolean;
    musicEnabled: boolean;
    frameRate: number;
  };
}

export interface Character {
  id: string;
  name: string;
  image?: string;
  isOnline?: boolean;
  level?: number;
  lastSeen?: string;
  allianceTag?: string;
  allianceId?: string;
  accountId: string;
}

// Player Profile definition for game
export interface PlayerProfile {
  id: number;
  name: string;
  power: number;
  kills: number;
  furnaceLevel: number;
  state: number;
  alliance: {
    id: string | null;
    tag: string;
  };
  world_location: {
    x: number;
    y: number;
  };
  troops: {
    infantry: {
      total: number;
      level: number;
      injured: number;
    };
    lancer: {
      total: number;
      level: number;
      injured: number;
    };
    marksman: {
      total: number;
      level: number;
      injured: number;
    };
    marchQueue: number;
  };
}

// Player Settings definition
export interface PlayerSettings {
  graphicsQuality?: 'Ultra' | 'High' | 'Medium' | 'Standard';
  soundEnabled?: boolean;
  musicEnabled?: boolean;
  frameRate?: number;
  notifications?: boolean;
}

// Friend type definition
export interface Friend {
  id: string;
  characterId: string;
  friendId: string;
  name: string;
  level?: number;
  allianceTag?: string;
  character?: Character;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt: string;
}

// Friend Request type definition
export interface FriendRequest {
  id: string;
  sender?: Character;
  senderId: string;
  receiverId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt?: Date;
}

export interface BlacklistEntry {
  id: string;
  blockedId: string;
  name: string;
  level: number;
  createdAt: string;
}
