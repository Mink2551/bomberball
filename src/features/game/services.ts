import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  deleteField,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GameRoom, GameUser, LocalUser, Bomb, GameState } from './types';
import { 
  MIN_BOMB_SECONDS, 
  MAX_BOMB_SECONDS, 
  BOT_DANGER_THRESHOLD, 
  BOT_SAFE_THRESHOLD 
} from './types';

// Bot names for random selection
const BOT_NAMES = [
  'BomBot', 'BlazeBot', 'BoomMaster', 'TNTony', 'FuseBot',
  'SparkyAI', 'DynamiteD', 'ExplosiveE', 'NukeBot', 'TimerBot',
];

// Generate a 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate random bomb timer between 15-60 seconds
function generateBombTimer(): number {
  const randomSeconds = Math.floor(Math.random() * (MAX_BOMB_SECONDS - MIN_BOMB_SECONDS + 1)) + MIN_BOMB_SECONDS;
  return Date.now() + randomSeconds * 1000;
}

// Generate a random bot ID
function generateBotId(): string {
  return `bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// Create a new game room
export async function createRoom(user: LocalUser): Promise<GameRoom> {
  const code = generateRoomCode();
  const roomId = `room_${Date.now()}`;
  
  const hostPlayer: GameUser = {
    id: user.id,
    displayName: user.displayName,
    isHost: true,
    isReady: false,
    joinedAt: Date.now(),
    isBot: false,
  };

  const room: GameRoom = {
    id: roomId,
    code,
    hostId: user.id,
    players: { [user.id]: hostPlayer },
    status: 'waiting',
    maxPlayers: 4,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, 'rooms', code), room);
  
  return room;
}

// Add a bot to the room
export async function addBot(code: string): Promise<GameUser> {
  const roomRef = doc(db, 'rooms', code.toUpperCase());
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) throw new Error('Room not found');
  
  const room = snapshot.data() as GameRoom;
  const playerCount = Object.keys(room.players || {}).length;
  
  if (playerCount >= room.maxPlayers) {
    throw new Error('Room is full');
  }
  
  if (room.status === 'playing') {
    throw new Error('Game already in progress');
  }
  
  // Get used bot names
  const usedNames = Object.values(room.players)
    .filter(p => p.isBot)
    .map(p => p.displayName);
  
  // Pick a random unused bot name
  const availableNames = BOT_NAMES.filter(n => !usedNames.includes(n));
  const botName = availableNames.length > 0 
    ? availableNames[Math.floor(Math.random() * availableNames.length)]
    : `Bot${playerCount + 1}`;
  
  const botPlayer: GameUser = {
    id: generateBotId(),
    displayName: botName,
    isHost: false,
    isReady: true, // Bots are always ready
    joinedAt: Date.now(),
    isBot: true,
  };
  
  await updateDoc(roomRef, {
    [`players.${botPlayer.id}`]: botPlayer,
  });
  
  return botPlayer;
}

// Remove a bot from the room
export async function removeBot(code: string, botId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', code.toUpperCase());
  await updateDoc(roomRef, {
    [`players.${botId}`]: deleteField(),
  });
}

// Join an existing room by code
export async function joinRoom(code: string, user: LocalUser): Promise<GameRoom | null> {
  const upperCode = code.toUpperCase().trim();
  const roomRef = doc(db, 'rooms', upperCode);
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) {
    throw new Error('Room not found');
  }

  const room = snapshot.data() as GameRoom;

  const playerCount = Object.keys(room.players || {}).length;
  if (playerCount >= room.maxPlayers) {
    throw new Error('Room is full');
  }

  if (room.status === 'playing') {
    throw new Error('Game already in progress');
  }

  if (room.players[user.id]) {
    return room;
  }

  const newPlayer: GameUser = {
    id: user.id,
    displayName: user.displayName,
    isHost: false,
    isReady: false,
    joinedAt: Date.now(),
    isBot: false,
  };

  await updateDoc(roomRef, {
    [`players.${user.id}`]: newPlayer,
  });

  return { ...room, players: { ...room.players, [user.id]: newPlayer } };
}

// Leave a room
export async function leaveRoom(code: string, userId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', code.toUpperCase());
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) return;

  const room = snapshot.data() as GameRoom;
  const playerCount = Object.keys(room.players || {}).length;

  // If only 1 player left (the one leaving), delete the room
  if (playerCount <= 1) {
    await deleteDoc(roomRef);
    return;
  }

  // Check if after this player leaves, only bots remain
  const remainingPlayers = Object.values(room.players).filter(p => p.id !== userId);
  const hasHumanPlayers = remainingPlayers.some(p => !p.isBot);
  
  // If no humans left (only bots), delete the room
  if (!hasHumanPlayers) {
    await deleteDoc(roomRef);
    return;
  }

  // Remove the player
  await updateDoc(roomRef, {
    [`players.${userId}`]: deleteField(),
  });

  // If the leaving player was the host, assign a new host
  if (room.hostId === userId) {
    const remainingPlayerIds = Object.keys(room.players).filter(id => id !== userId);
    // Prefer non-bot as new host
    const nonBots = remainingPlayerIds.filter(id => !room.players[id].isBot);
    const newHostId = nonBots.length > 0 ? nonBots[0] : remainingPlayerIds[0];
    
    await updateDoc(roomRef, {
      hostId: newHostId,
      [`players.${newHostId}.isHost`]: true,
    });
  }
}

// Toggle ready status
export async function toggleReady(code: string, userId: string, isReady: boolean): Promise<void> {
  const roomRef = doc(db, 'rooms', code);
  await updateDoc(roomRef, {
    [`players.${userId}.isReady`]: isReady,
  });
}

// Get room by code
export async function getRoom(code: string): Promise<GameRoom | null> {
  const snapshot = await getDoc(doc(db, 'rooms', code));
  if (!snapshot.exists()) return null;
  return snapshot.data() as GameRoom;
}

// Subscribe to room changes
export function subscribeToRoom(
  code: string,
  callback: (room: GameRoom | null) => void
): () => void {
  const roomRef = doc(db, 'rooms', code);
  
  const unsubscribe = onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GameRoom);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}

// Start the game - assign bombs and pick first active player
export async function startGame(code: string): Promise<void> {
  const roomRef = doc(db, 'rooms', code);
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) throw new Error('Room not found');
  
  const room = snapshot.data() as GameRoom;
  const playerIds = Object.keys(room.players);
  
  if (playerIds.length < 2) {
    throw new Error('Need at least 2 players');
  }
  
  // Create bombs for each player with random timers and unique colors
  const bombs: Record<string, Bomb> = {};
  const colors = ['#FF0055', '#39FF14', '#00FFFF', '#FFFF00', '#FF00FF', '#FF8800'];
  // Shuffle strictly to ensure randomness but uniqueness
  const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

  // Generate unique timers
  const usedTimers = new Set<number>();
  const getUniqueTimer = (): number => {
    let timer;
    let attempts = 0;
    do {
       // Generate random between MIN and MAX
       const range = MAX_BOMB_SECONDS - MIN_BOMB_SECONDS;
       const offset = Math.random() * range;
       timer = Math.floor(Date.now() + (MIN_BOMB_SECONDS + offset) * 1000); 
       
       // Round to nearest second for uniqueness check
       timer = Math.floor(timer / 1000) * 1000; 
       attempts++;
    } while (usedTimers.has(timer) && attempts < 20);
    usedTimers.add(timer);
    return timer;
  };

  playerIds.forEach((playerId, index) => {
    bombs[playerId] = {
      ownerId: playerId,
      expiresAt: getUniqueTimer(),
      color: shuffledColors[index % shuffledColors.length],
    };
  });
  
  // Pick random first active player (prefer non-bot)
  const nonBots = playerIds.filter(id => !room.players[id].isBot);
  const candidates = nonBots.length > 0 ? nonBots : playerIds;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const firstActivePlayer = candidates[randomIndex];
  
  const gameState: GameState = {
    bombs,
    activePlayerId: firstActivePlayer,
    turnStartedAt: Date.now(),
    eliminatedPlayers: [],
    winnerId: null,
    startedAt: Date.now(),
    swapChance: 10,
    lastSwapAttemptAt: 0,
  };
  
  await updateDoc(roomRef, {
    status: 'playing',
    gameState,
  });
}

// Cancel game (host only) - return to waiting state
export async function cancelGame(code: string): Promise<void> {
  const roomRef = doc(db, 'rooms', code);
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) return;
  
  const room = snapshot.data() as GameRoom;
  
  // Reset all players' ready status
  const resetPlayers: Record<string, GameUser> = {};
  Object.values(room.players).forEach(player => {
    resetPlayers[player.id] = { 
      ...player, 
      isReady: player.isBot ? true : false // Bots stay ready
    };
  });
  
  await updateDoc(roomRef, {
    status: 'waiting',
    players: resetPlayers,
    gameState: deleteField(),
  });
}

// Swap bomb with another player
export async function swapBomb(
  code: string,
  fromPlayerId: string,
  toPlayerId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', code);
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) throw new Error('Room not found');
  
  const room = snapshot.data() as GameRoom;
  
  if (!room.gameState) throw new Error('Game not started');
  if (fromPlayerId === toPlayerId) {
    throw new Error('Cannot swap with yourself');
  }
  
  // Check if either player is eliminated
  if (room.gameState.eliminatedPlayers.includes(fromPlayerId) ||
      room.gameState.eliminatedPlayers.includes(toPlayerId)) {
    throw new Error('Cannot swap with eliminated player');
  }
  
  const { bombs, activePlayerId, turnStartedAt } = room.gameState;
  
  // Check if this is the active player OR if steal is allowed (5 sec timeout)
  const timeSinceTurnStart = Date.now() - turnStartedAt;
  const stealAllowed = timeSinceTurnStart >= 5000;
  
  if (activePlayerId !== fromPlayerId && !stealAllowed) {
    throw new Error('Not your turn');
  }

  // ** New Logic: Active Player Swap Probability **
  // Stealers always succeed (100%). Active player has 10-95% chance.
  if (activePlayerId === fromPlayerId) {
    const now = Date.now();
    const lastAttempt = room.gameState.lastSwapAttemptAt || 0;
    const currentChance = room.gameState.swapChance || 10;
    
    let newChance = 10;
    
    const isBot = room.players[fromPlayerId]?.isBot || false;

    // If clicked within 1s OR IS BOT, increase chance
    if (isBot || now - lastAttempt <= 1000) {
      newChance = Math.min(95, currentChance + 5);
    } else {
      // Reset to 10% if too slow
      newChance = 10;
    }
    
    // Save the attempt state regardless of outcome
    // We do this by throwing if failed, but we need to persist the new chance/time
    // Firestore transaction would be better but simple update is okay for now
    
    // Roll the dice (0-100)
    const roll = Math.random() * 100;
    const success = roll < newChance;
    
    if (!success) {
      // Failed swap - update state so they can build combo
      await updateDoc(roomRef, {
        'gameState.swapChance': newChance,
        'gameState.lastSwapAttemptAt': now,
        'gameState.latestAction': {
            type: 'swap', 
            actorId: fromPlayerId, 
            targetId: toPlayerId, 
            success: false, 
            timestamp: now
        }
      });
      // Throw error to notify UI
      throw new Error(`Swap failed! Chance: ${newChance}% - Spammers win!`);
    }
    // If success, valid swap proceeds below...
  }
  
  const fromBomb = bombs[fromPlayerId];
  const toBomb = bombs[toPlayerId];
  
  if (!fromBomb || !toBomb) throw new Error('Bomb not found');
  
  // Swap the bombs
  const newBombs = {
    ...bombs,
    [fromPlayerId]: { ...toBomb, ownerId: fromPlayerId },
    [toPlayerId]: { ...fromBomb, ownerId: toPlayerId },
  };
  
  await updateDoc(roomRef, {
    'gameState.bombs': newBombs,
    'gameState.activePlayerId': toPlayerId,
    'gameState.turnStartedAt': Date.now(), // Reset turn timer
    'gameState.swapChance': 10, // Reset chance for new player
    'gameState.lastSwapAttemptAt': 0,
    'gameState.latestAction': {
        type: 'swap',
        actorId: fromPlayerId,
        targetId: toPlayerId,
        success: true,
        timestamp: Date.now()
    }
  });
}

// Eliminate a player when their bomb explodes
export async function eliminatePlayer(code: string, playerId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', code);
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) return;
  
  const room = snapshot.data() as GameRoom;
  if (!room.gameState) return;
  
  // Already eliminated?
  if (room.gameState.eliminatedPlayers.includes(playerId)) return;
  
  // Get alive players (not yet eliminated)
  const allPlayerIds = Object.keys(room.players);
  const newEliminated = [...room.gameState.eliminatedPlayers, playerId];
  const alivePlayers = allPlayerIds.filter(id => !newEliminated.includes(id));
  
  // Check if game is over (only 1 player left)
  if (alivePlayers.length <= 1) {
    // Game over - we have a winner!
    const winnerId = alivePlayers[0] || null;
    
    await updateDoc(roomRef, {
      status: 'finished',
      'gameState.eliminatedPlayers': arrayUnion(playerId),
      'gameState.winnerId': winnerId,
      'gameState.activePlayerId': null,
    });
  } else {
    // Game continues - pick new active player if needed
    let newActivePlayer = room.gameState.activePlayerId;
    
    // If the eliminated player was active, pick a new one
    if (newActivePlayer === playerId || !alivePlayers.includes(newActivePlayer || '')) {
      // Pick random alive player (prefer non-bot)
      const aliveNonBots = alivePlayers.filter(id => !room.players[id].isBot);
      const candidates = aliveNonBots.length > 0 ? aliveNonBots : alivePlayers;
      newActivePlayer = candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    // Give eliminated player's bomb to someone else or remove it
    const newBombs = { ...room.gameState.bombs };
    delete newBombs[playerId];
    
    await updateDoc(roomRef, {
      'gameState.eliminatedPlayers': arrayUnion(playerId),
      'gameState.bombs': newBombs,
      'gameState.activePlayerId': newActivePlayer,
      'gameState.turnStartedAt': Date.now(),
      'gameState.swapChance': 10,
      'gameState.lastSwapAttemptAt': 0,
    });
  }
}

// Reset room to waiting state
export async function resetRoom(code: string): Promise<void> {
  const roomRef = doc(db, 'rooms', code);
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) return;
  
  const room = snapshot.data() as GameRoom;
  
  // Reset all players' ready status
  const resetPlayers: Record<string, GameUser> = {};
  Object.values(room.players).forEach(player => {
    resetPlayers[player.id] = { 
      ...player, 
      isReady: player.isBot ? true : false 
    };
  });
  
  await updateDoc(roomRef, {
    status: 'waiting',
    players: resetPlayers,
    gameState: deleteField(),
  });
}

// Smart Bot AI - decides whether to swap or wait/steal
export async function botPlay(code: string, botId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', code);
  const snapshot = await getDoc(roomRef);
  
  if (!snapshot.exists()) return;
  
  const room = snapshot.data() as GameRoom;
  
  if (!room.gameState || room.status !== 'playing') return;
  if (room.gameState.eliminatedPlayers.includes(botId)) return;
  
  const { bombs, activePlayerId, turnStartedAt } = room.gameState;
  const myBomb = bombs[botId];
  if (!myBomb) return;
  
  const myTimeLeft = myBomb.expiresAt - Date.now();
  const isMyTurn = activePlayerId === botId;
  const timeSinceTurn = Date.now() - turnStartedAt;
  const canSteal = timeSinceTurn >= 5000;
  
  // Get alive players (excluding self and eliminated)
  const alivePlayers = Object.values(room.players).filter(
    p => p.id !== botId && !room.gameState!.eliminatedPlayers.includes(p.id)
  );
  
  if (alivePlayers.length === 0) return;
  
  // Analyze all other players' bombs to find best target
  let bestTarget = alivePlayers[0];
  let bestTargetTime = 0;
  let worstTarget = alivePlayers[0];
  let worstTargetTime = Infinity;
  
  alivePlayers.forEach(player => {
    const theirBomb = bombs[player.id];
    if (theirBomb) {
      const theirTime = theirBomb.expiresAt - Date.now();
      if (theirTime > bestTargetTime) {
        bestTargetTime = theirTime;
        bestTarget = player;
      }
      if (theirTime < worstTargetTime) {
        worstTargetTime = theirTime;
        worstTarget = player;
      }
    }
  });
  
  // Smart decision logic
  let shouldSwap = false;
  let swapDelay = 1500;
  let targetPlayer = bestTarget; // Default to safest target
  
  // Calculate advantage: how much better would I be after swapping?
  const potentialGain = bestTargetTime - myTimeLeft;
  
  // Check if we're building a combo (swapChance > 10)
  const currentChance = room.gameState.swapChance || 10;
  if (isMyTurn && currentChance > 10) {
    // We are in a combo! SPAM CLICK!
    shouldSwap = true;
    swapDelay = 200; // Fast click to keep combo alive
    targetPlayer = bestTarget; 
  } else if (isMyTurn) {
    // Standard turn logic
    // It's my turn - I must swap eventually
    if (myTimeLeft < BOT_DANGER_THRESHOLD) {
      // CRITICAL! Swap immediately!
      shouldSwap = true;
      swapDelay = 50 + Math.random() * 250; // Super fast panic click
      targetPlayer = bestTarget;
    } else if (myTimeLeft < BOT_SAFE_THRESHOLD) {
      // Getting risky - swap quickly
      shouldSwap = true;
      swapDelay = 400 + Math.random() * 600;
      targetPlayer = bestTarget;
    } else {
      // I'm safe - but don't wait too long
      shouldSwap = true;
      swapDelay = 1000 + Math.random() * 1500;
      targetPlayer = bestTarget;
    }
  } else if (canSteal) {
    // Not my turn but steal is available!
    // Be more aggressive about stealing
    
    if (myTimeLeft < BOT_DANGER_THRESHOLD) {
      // DANGER! Steal immediately!
      shouldSwap = true;
      swapDelay = 200 + Math.random() * 500;
      targetPlayer = bestTarget;
    } else if (myTimeLeft < BOT_SAFE_THRESHOLD && potentialGain > 10000) {
      // I could gain significant time - worth stealing!
      shouldSwap = true;
      swapDelay = 500 + Math.random() * 1000;
      targetPlayer = bestTarget;
    } else if (myTimeLeft < BOT_SAFE_THRESHOLD && bestTargetTime > BOT_SAFE_THRESHOLD) {
      // My bomb is getting risky, and there's a safe target
      // 50% chance to steal to add unpredictability
      if (Math.random() < 0.5) {
        shouldSwap = true;
        swapDelay = 1000 + Math.random() * 1500;
        targetPlayer = bestTarget;
      }
    }
    // If I'm very safe (> 25s), don't bother stealing - let others panic
  }
  
  if (shouldSwap) {
    // Wait then swap
    await new Promise(resolve => setTimeout(resolve, swapDelay));
    
    // Re-check if still valid (game state may have changed)
    const checkSnapshot = await getDoc(roomRef);
    if (!checkSnapshot.exists()) return;
    const checkRoom = checkSnapshot.data() as GameRoom;
    if (!checkRoom.gameState || checkRoom.status !== 'playing') return;
    if (checkRoom.gameState.eliminatedPlayers.includes(botId)) return;
    
    // Make sure target is still alive
    if (checkRoom.gameState.eliminatedPlayers.includes(targetPlayer.id)) {
      // Target got eliminated, find new target
      const stillAlive = Object.keys(checkRoom.players).filter(
        id => id !== botId && !checkRoom.gameState!.eliminatedPlayers.includes(id)
      );
      if (stillAlive.length === 0) return;
      targetPlayer = { id: stillAlive[0] } as typeof targetPlayer;
    }
    
    try {
      await swapBomb(code, botId, targetPlayer.id);
    } catch (error) {
      // console.error('Bot swap failed:', error); 
      // Expected to fail often with new probability mechanics, suppress error spam
    }
  }
}

