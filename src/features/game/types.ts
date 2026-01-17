// Game Types for Bomberball

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface GameUser {
  id: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
  isBot?: boolean; // AI bot player
}

export interface Bomb {
  ownerId: string;
  expiresAt: number; // Timestamp when bomb explodes
  color?: string; // Hex code for specific bomb identification
}

export interface GameState {
  bombs: Record<string, Bomb>; // playerId -> bomb they're holding
  activePlayerId: string | null; // Who must swap next
  turnStartedAt: number; // When the current turn started (for steal timer)
  eliminatedPlayers: string[]; // Players who have been eliminated
  winnerId: string | null; // Last player standing
  startedAt: number;
  // Swap mechanics
  swapChance?: number; // Current probability of success (0-100)
  lastSwapAttemptAt?: number; // Timestamp of last attempt
  latestAction?: GameAction; // Broadcast of last interaction
}

export interface GameAction {
  type: 'swap';
  actorId: string;
  targetId: string;
  success: boolean;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  players: Record<string, GameUser>;
  status: RoomStatus;
  maxPlayers: number;
  createdAt: number;
  gameState?: GameState;
}

export interface LocalUser {
  id: string;
  displayName: string;
}

// Constants
export const MIN_BOMB_SECONDS = 15;
export const MAX_BOMB_SECONDS = 60;
export const STEAL_TIMEOUT_SECONDS = 3;
export const BOT_DANGER_THRESHOLD = 10000; // 10 seconds - bot considers this "dangerous"
export const BOT_SAFE_THRESHOLD = 25000; // 25 seconds - bot considers this "safe"
