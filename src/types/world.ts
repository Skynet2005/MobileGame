// World Map Types

export interface GridCell {
  type: 'empty' | 'castle' | 'turret' | 'resource' | 'furnace' | 'redzone';
  resource: string | null;
  player: any;
  furnace: boolean;
  zone: string;
  zoneColor: number;
}

export interface Zone {
  name: string;
  color: number;
}

export interface WorldResource {
  type: 'meat' | 'wood' | 'coal' | 'iron' | 'steel' | 'gems';
  emoji: string;
  color: number;
  value: number;
  count?: number;
}

export interface PlayerFurnace {
  x: number;
  y: number;
  size: number;
  color: number;
}

