// Player Service - Handles player operations and interacts with the database
import { prisma } from '@/database/prisma';
import { PlayerProfile, PlayerSettings } from '@/types/player';

interface PlayerData {
  id: string;
  name: string;
  power: number;
  kills: number;
  furnaceLevel: number;
  state: number;
  allianceId?: string | null;
  allianceTag?: string | null;
  location: {
    x: number;
    y: number;
  };
  troops: {
    infantry: { total: number; level: number; injured: number };
    lancer: { total: number; level: number; injured: number };
    marksman: { total: number; level: number; injured: number };
    marchQueue: number;
  };
  created?: Date;
  resources?: Record<string, number>;
  settings?: Record<string, any>;
  skins?: Record<string, any>;
}

// Mock database functions until you create the appropriate Prisma models
class MockDatabase {
  private players: Map<string, PlayerData> = new Map();

  async createPlayer(data: Partial<PlayerData>): Promise<PlayerData> {
    const id = `player-${Date.now()}`;
    const newPlayer: PlayerData = {
      id,
      name: data.name || 'New Player',
      power: data.power || 100,
      kills: data.kills || 0,
      furnaceLevel: data.furnaceLevel || 1,
      state: data.state || 0,
      allianceId: data.allianceId || null,
      allianceTag: data.allianceTag || null,
      location: data.location || { x: 0, y: 0 },
      troops: data.troops || {
        infantry: { total: 0, level: 1, injured: 0 },
        lancer: { total: 0, level: 1, injured: 0 },
        marksman: { total: 0, level: 1, injured: 0 },
        marchQueue: 0
      },
      created: new Date(),
      resources: data.resources || { wood: 100, stone: 50, iron: 20, coal: 10, food: 200 },
      settings: data.settings || {}
    };

    this.players.set(id, newPlayer);
    return newPlayer;
  }

  async getPlayer(id: string): Promise<PlayerData | null> {
    return this.players.get(id) || null;
  }

  async updatePlayer(id: string, data: Partial<PlayerData>): Promise<PlayerData | null> {
    const player = this.players.get(id);
    if (!player) return null;

    const updatedPlayer = { ...player, ...data };
    this.players.set(id, updatedPlayer);

    return updatedPlayer;
  }

  async deletePlayer(id: string): Promise<boolean> {
    return this.players.delete(id);
  }
}

// Create a mock database instance
const mockDb = new MockDatabase();

export class PlayerService {
  private game: any;
  private currentPlayer: PlayerData | null;
  private isLoaded: boolean;

  constructor(game: any) {
    this.game = game;
    this.currentPlayer = null;
    this.isLoaded = false;
  }

  // Check if player service is ready
  isReady(): boolean {
    return this.isLoaded && this.currentPlayer !== null;
  }

  // Get current player
  getPlayer(playerId?: string): PlayerData | null {
    // If playerId is provided, load that player
    if (playerId && playerId !== this.currentPlayer?.id) {
      this.loadPlayer(playerId);
      return this.currentPlayer;
    }

    // Otherwise return current player
    return this.currentPlayer;
  }

  // Initialize player service
  async init() {
    try {
      // Check if there's a saved player ID in local storage
      const savedPlayerId = localStorage.getItem('currentPlayerId');

      if (savedPlayerId) {
        // Try to load the player
        const loadedPlayer = await this.loadPlayer(savedPlayerId);
        if (loadedPlayer) {
          console.log(`Player loaded: ${loadedPlayer.name}`);
        } else {
          // If player not found, create a new one
          await this.createNewPlayer();
        }
      } else {
        // No saved player, create a new one
        await this.createNewPlayer();
      }

      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('Error initializing player service:', error);
      return false;
    }
  }

  // Create a new player with default values
  async createNewPlayer(name = "New Player") {
    try {
      // Get random starting position within the map bounds
      const x = Math.floor(Math.random() * (this.game.worldMap.width - 100)) + 50;
      const y = Math.floor(Math.random() * (this.game.worldMap.height - 100)) + 50;

      const playerData = {
        name: name,
        location: { x, y }
        // Default values for other fields are handled by the mock database
      };

      // Create player in database
      const newPlayer = await mockDb.createPlayer(playerData);

      // Save to local storage
      localStorage.setItem('currentPlayerId', newPlayer.id);

      // Update current player
      this.currentPlayer = await mockDb.getPlayer(newPlayer.id);

      // Update player location on map
      if (this.game.worldMap && this.currentPlayer) {
        this.game.worldMap.playerFurnace = {
          x: this.currentPlayer.location.x,
          y: this.currentPlayer.location.y
        };
      }

      console.log(`New player created: ${this.currentPlayer?.name}`);
      return this.currentPlayer;
    } catch (error) {
      console.error('Error creating new player:', error);
      throw error;
    }
  }

  // Load player from database
  async loadPlayer(playerId: string): Promise<PlayerData | null> {
    try {
      const player = await mockDb.getPlayer(playerId);

      if (!player) {
        console.warn(`Player ${playerId} not found`);
        return null;
      }

      // Convert the returned player to PlayerData type
      this.currentPlayer = player;

      // Save current player ID to local storage
      localStorage.setItem('currentPlayerId', playerId);

      return this.currentPlayer;
    } catch (error) {
      console.error('Error loading player:', error);
      return null;
    }
  }

  // Sync player data with game state
  syncPlayerWithGame() {
    if (!this.currentPlayer) return;

    // Update player data from game state
    if (this.game.player) {
      this.currentPlayer.location = {
        x: this.game.player.x,
        y: this.game.player.y
      };
      this.currentPlayer.furnaceLevel = this.game.player.furnaceLevel;
      this.currentPlayer.power = this.game.player.powerLevel;
    }
  }

  // Save player state to database
  async savePlayerState() {
    if (!this.currentPlayer) return false;

    try {
      // Sync with game state
      this.syncPlayerWithGame();

      // Update player in database
      const updatedPlayer = await mockDb.updatePlayer(this.currentPlayer.id, this.currentPlayer);
      if (!updatedPlayer) {
        throw new Error('Failed to update player data');
      }

      return true;
    } catch (error) {
      console.error('Error saving player state:', error);
      return false;
    }
  }

  // Join alliance
  async joinAlliance(allianceId: string, allianceTag: string) {
    if (!this.currentPlayer) return false;

    try {
      // Update player's alliance
      this.currentPlayer.allianceId = allianceId;
      this.currentPlayer.allianceTag = allianceTag;

      // Save changes
      await this.savePlayerState();
      return true;
    } catch (error) {
      console.error('Error joining alliance:', error);
      return false;
    }
  }

  // Leave alliance
  async leaveAlliance() {
    if (!this.currentPlayer) return false;

    try {
      // Update player's alliance
      this.currentPlayer.allianceId = null;
      this.currentPlayer.allianceTag = null;

      // Save changes
      await this.savePlayerState();
      return true;
    } catch (error) {
      console.error('Error leaving alliance:', error);
      return false;
    }
  }

  // Get player profile
  getPlayerProfile(): PlayerProfile {
    if (!this.currentPlayer) {
      throw new Error('Player not loaded');
    }

    return {
      id: parseInt(this.currentPlayer.id.replace('player-', '')),
      name: this.currentPlayer.name,
      power: this.currentPlayer.power,
      kills: this.currentPlayer.kills,
      furnaceLevel: this.currentPlayer.furnaceLevel,
      state: this.currentPlayer.state,
      alliance: {
        id: this.currentPlayer.allianceId || null,
        tag: this.currentPlayer.allianceTag || '',
      },
      world_location: this.currentPlayer.location,
      troops: this.currentPlayer.troops,
    };
  }

  // Get player settings
  getPlayerSettings(): PlayerSettings {
    if (!this.currentPlayer || !this.currentPlayer.settings) {
      return {
        graphicsQuality: 'Medium',
        soundEnabled: true,
        musicEnabled: true,
        frameRate: 60,
        notifications: true,
      };
    }

    return {
      graphicsQuality: this.currentPlayer.settings.graphicsQuality || 'Medium',
      soundEnabled: this.currentPlayer.settings.soundEnabled ?? true,
      musicEnabled: this.currentPlayer.settings.musicEnabled ?? true,
      frameRate: this.currentPlayer.settings.frameRate || 60,
      notifications: this.currentPlayer.settings.notifications ?? true,
    };
  }

  // Update player settings
  async updatePlayerSettings(settings: Partial<PlayerSettings>): Promise<boolean> {
    if (!this.currentPlayer) return false;

    try {
      // Update settings
      this.currentPlayer.settings = {
        ...this.currentPlayer.settings,
        ...settings
      };

      // Save to database
      await this.savePlayerState();
      return true;
    } catch (error) {
      console.error('Error updating player settings:', error);
      return false;
    }
  }

  // Update player settings
  async updateSettings(settings: Partial<PlayerSettings>): Promise<boolean> {
    return this.updatePlayerSettings(settings);
  }

  // Update player's location
  async updateLocation(x: number, y: number): Promise<boolean> {
    if (!this.currentPlayer) return false;

    try {
      // Update player location
      this.currentPlayer.location = { x, y };

      // Save to database
      return this.savePlayerState();
    } catch (error) {
      console.error('Error updating player location:', error);
      return false;
    }
  }

  // Update player data
  async updatePlayer(data: {
    player?: Partial<PlayerData>;
    resources?: Record<string, number>;
    troops?: any;
  }): Promise<boolean> {
    if (!this.currentPlayer) return false;

    try {
      // Update player fields
      if (data.player) {
        this.currentPlayer = {
          ...this.currentPlayer,
          ...data.player
        };
      }

      // Update resources
      if (data.resources && this.currentPlayer.resources) {
        this.currentPlayer.resources = {
          ...this.currentPlayer.resources,
          ...data.resources
        };
      }

      // Update troops
      if (data.troops && this.currentPlayer.troops) {
        this.currentPlayer.troops = {
          ...this.currentPlayer.troops,
          ...data.troops
        };
      }

      // Save to database
      return this.savePlayerState();
    } catch (error) {
      console.error('Error updating player data:', error);
      return false;
    }
  }
}
