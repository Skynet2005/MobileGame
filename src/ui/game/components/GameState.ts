// Game state types
export interface Resource {
  meat: number;
  wood: number;
  coal: number;
  iron: number;
}

export interface Furnace {
  level: string;
  temperature: number;
  upgradeProgress: number;
}

export interface Troops {
  infantry: number;
  lancer: number;
  marksmen: number;
}

export interface March {
  id: string;
  troops: {
    infantry: number;
    lancer: number;
    marksmen: number;
  };
  target: {
    x: number;
    y: number;
  };
  progress: number;
  startTime: number;
  endTime: number;
}

export interface Player {
  id: string;
  name: string;
  allianceTag: string | null;
  power: number;
  kills: number;
  alliance: string | null;
  state: string;
  furnacePosition: {
    x: number;
    y: number;
  };
}

export interface GameState {
  player: Player;
  resources: Resource;
  furnace: Furnace;
  troops: Troops;
  marches: March[];
  mapSize: {
    width: number;
    height: number;
  };
  cameraPosition: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Initial game state
export const initialGameState: GameState = {
  player: {
    id: '123456',
    name: 'Chief123',
    allianceTag: 'SSS',
    power: 10000,
    kills: 0,
    alliance: 'Super Squad',
    state: 'Volcanic State',
    furnacePosition: {
      x: 300,
      y: 300,
    },
  },
  resources: {
    meat: 50,
    wood: 75,
    coal: 30,
    iron: 15,
  },
  furnace: {
    level: 'F1',
    temperature: 25,
    upgradeProgress: 0,
  },
  troops: {
    infantry: 10,
    lancer: 5,
    marksmen: 2,
  },
  marches: [
    {
      id: '1',
      troops: {
        infantry: 5,
        lancer: 0,
        marksmen: 0,
      },
      target: {
        x: 600,
        y: 400,
      },
      progress: 60,
      startTime: Date.now() - 60000,
      endTime: Date.now() + 40000,
    },
  ],
  mapSize: {
    width: 1200,
    height: 1200,
  },
  cameraPosition: {
    x: 600,
    y: 600,
    zoom: 1,
  },
};

// Game state actions
export enum GameActionType {
  ADD_COAL = 'ADD_COAL',
  UPGRADE_FURNACE = 'UPGRADE_FURNACE',
  TRAIN_TROOPS = 'TRAIN_TROOPS',
  SEND_MARCH = 'SEND_MARCH',
  CANCEL_MARCH = 'CANCEL_MARCH',
  UPDATE_CAMERA = 'UPDATE_CAMERA',
  UPDATE_PLAYER_NAME = 'UPDATE_PLAYER_NAME',
}

export type GameAction =
  | { type: GameActionType.ADD_COAL }
  | { type: GameActionType.UPGRADE_FURNACE }
  | { type: GameActionType.TRAIN_TROOPS; troopType: keyof Troops }
  | { type: GameActionType.SEND_MARCH; march: Omit<March, 'id' | 'progress' | 'startTime' | 'endTime'> }
  | { type: GameActionType.CANCEL_MARCH; marchId: string }
  | { type: GameActionType.UPDATE_CAMERA; position: Partial<GameState['cameraPosition']> }
  | { type: GameActionType.UPDATE_PLAYER_NAME; name: string };

// Game state reducer
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case GameActionType.ADD_COAL:
      if (state.resources.coal <= 0) return state;
      return {
        ...state,
        resources: {
          ...state.resources,
          coal: state.resources.coal - 1,
        },
        furnace: {
          ...state.furnace,
          temperature: Math.min(state.furnace.temperature + 5, 100),
        },
      };

    case GameActionType.UPGRADE_FURNACE:
      // Placeholder for upgrade logic
      return {
        ...state,
        furnace: {
          ...state.furnace,
          upgradeProgress: 50,
        },
      };

    case GameActionType.TRAIN_TROOPS:
      // Placeholder for training logic
      return {
        ...state,
        troops: {
          ...state.troops,
          [action.troopType]: state.troops[action.troopType] + 1,
        },
        resources: {
          ...state.resources,
          meat: Math.max(state.resources.meat - 5, 0),
        },
      };

    case GameActionType.SEND_MARCH:
      // Placeholder for march logic
      const newMarch: March = {
        id: Date.now().toString(),
        ...action.march,
        progress: 0,
        startTime: Date.now(),
        endTime: Date.now() + 100000, // 100 seconds for now
      };
      return {
        ...state,
        marches: [...state.marches, newMarch],
      };

    case GameActionType.CANCEL_MARCH:
      return {
        ...state,
        marches: state.marches.filter(march => march.id !== action.marchId),
      };

    case GameActionType.UPDATE_CAMERA:
      return {
        ...state,
        cameraPosition: {
          ...state.cameraPosition,
          ...action.position,
        },
      };

    case GameActionType.UPDATE_PLAYER_NAME:
      return {
        ...state,
        player: {
          ...state.player,
          name: action.name,
        },
      };

    default:
      return state;
  }
} 
