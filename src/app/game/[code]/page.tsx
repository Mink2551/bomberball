'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, BombIcon } from '@/shared/components';
import {
    useUser,
    subscribeToRoom,
    swapBomb,
    eliminatePlayer,
    resetRoom,
    cancelGame,
    botPlay,
    GameRoom,
    GameUser,
    STEAL_TIMEOUT_SECONDS,
    soundManager,
} from '@/features/game';

// Animation Types
interface FlyingBombState {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
    onComplete: () => void;
}

export default function GamePage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const { user, isAuthenticated } = useUser();
    const [room, setRoom] = useState<GameRoom | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [stealTimeLeft, setStealTimeLeft] = useState<number>(STEAL_TIMEOUT_SECONDS);
    const [canSteal, setCanSteal] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [amIEliminated, setAmIEliminated] = useState(false);
    const [swapError, setSwapError] = useState<string | null>(null);
    const [swapSuccess, setSwapSuccess] = useState<string | null>(null);

    // Animation Refs & State
    const botTimerRef = useRef<NodeJS.Timeout | null>(null);
    const prevBombsRef = useRef<Record<string, { expiresAt: number; ownerId: string }>>({});
    const prevElimCountRef = useRef(0);
    const [flyingBombs, setFlyingBombs] = useState<FlyingBombState[]>([]);
    const seatRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [failAnimPlayerId, setFailAnimPlayerId] = useState<string | null>(null);
    const lastActionTimestampRef = useRef(0);

    // Subscribe to room updates
    useEffect(() => {
        if (!code) return;

        const unsubscribe = subscribeToRoom(code, (updatedRoom) => {
            if (!updatedRoom) {
                router.push('/');
                return;
            }

            // If game reset to waiting, redirect to lobby
            if (updatedRoom.status === 'waiting') {
                router.push(`/room/${code}`);
                return;
            }

            setRoom(updatedRoom);
        });

        return () => unsubscribe();
    }, [code, router]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    // Check if I'm eliminated
    useEffect(() => {
        if (!room?.gameState || !user) return;
        setAmIEliminated(room.gameState.eliminatedPlayers.includes(user.id));
    }, [room, user]);

    // Detect Bomb Swaps for Animation
    useEffect(() => {
        if (!room?.gameState || !user) return;

        const currentBombs = room.gameState.bombs;
        const prevBombs = prevBombsRef.current;

        Object.keys(currentBombs).forEach(playerId => {
            // Check if THIS specific player's bomb logic is what triggers animation
            // Actually we want to track 'who passed to who'
            // If I had a bomb, and now I don't, and someone else has it?

            // Simpler approach: If 'activePlayerId' changes, potential swap happened.
            // But we need coordinate targets.
        });

        // Better Approach: 
        // Monitor activePlayerId changes. If it changes from A to B:
        // Trigger animation from A's seat to B's seat.
        // EXCEPT if it's a new turn start?
    }, [room?.gameState?.activePlayerId]);

    // Track Bomb Ownership Changes for animations
    useEffect(() => {
        if (!room?.gameState) return;

        // Iterate through all players to see if anyone GAINED a bomb
        const currentBombs = room.gameState.bombs;
        const prevBombs = prevBombsRef.current;

        // Note: In this game mode, active player holds the bomb.
        // If activePlayerId changes, the bomb moved.
        // We only care about the single active bomb for the turn or parallel bombs?
        // Wait, the game supports MULTIPLE bombs potentially (though currently 1 per start).
        // Let's assume standard mode: 1 active bomb being swapped.

        if (room.gameState.activePlayerId) {
            // Find who had it before? 
            // We can use a ref to track 'prevActivePlayerId'
        }
    }, [room?.gameState]);

    // MANUAL ANIMATION TRIGGER:
    // When `swapBomb` is called, we know source and target.
    // The issue is we need to sync it with state updates.
    // Let's prioritize the game logic first, layout second.
    // I'll implement a 'prevActivePlayer' tracker.
    // Removed duplicate animation trigger to fix ghost animations

    const triggerThrowAnimation = (fromId: string, toId: string) => {
        const fromEl = seatRefs.current[fromId];
        const toEl = seatRefs.current[toId];
        // Get color from game state if possible
        const bombColor = room?.gameState?.bombs[fromId]?.color || room?.gameState?.bombs[toId]?.color; // Try both

        if (fromEl && toEl) {
            soundManager.playSwap(); // Play Swoosh
            const startRect = fromEl.getBoundingClientRect();
            const endRect = toEl.getBoundingClientRect();
            const id = Math.random().toString(36).substr(2, 9);

            setFlyingBombs(prev => [
                ...prev,
                {
                    id,
                    startX: startRect.left + startRect.width / 2,
                    startY: startRect.top + startRect.height / 2,
                    endX: endRect.left + endRect.width / 2,
                    endY: endRect.top + endRect.height / 2,
                    color: bombColor,
                    onComplete: () => {
                        setFlyingBombs(curr => curr.filter(b => b.id !== id));
                    }
                }
            ]);

            // Remove after animation duration + buffer
            setTimeout(() => {
                setFlyingBombs(curr => curr.filter(b => b.id !== id));
            }, 1000);
        }
    };


    // Timer countdown logic (Same as before)
    useEffect(() => {
        if (!room?.gameState || !user || amIEliminated) return;
        const myBomb = room.gameState.bombs[user.id];
        if (!myBomb) {
            setTimeLeft(null);
            return;
        }
        const updateTimer = () => {
            const remaining = Math.max(0, myBomb.expiresAt - Date.now());
            setTimeLeft(remaining);
            if (remaining <= 0 && room.status === 'playing' && !room.gameState?.eliminatedPlayers.includes(user.id)) {
                eliminatePlayer(code, user.id);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [room, user, code, amIEliminated]);

    // Check ALL bombs (Same as before)
    useEffect(() => {
        if (!room?.gameState || room.status !== 'playing') return;
        const { bombs, eliminatedPlayers } = room.gameState;
        const checkAllBombs = () => {
            Object.entries(bombs).forEach(([playerId, bomb]) => {
                if (eliminatedPlayers.includes(playerId)) return;
                const remaining = bomb.expiresAt - Date.now();
                if (remaining <= 0) eliminatePlayer(code, playerId);
            });
        };
        checkAllBombs();
        const interval = setInterval(checkAllBombs, 200);
        return () => clearInterval(interval);
    }, [room, code]);

    // Steal timer (Same as before)
    useEffect(() => {
        if (!room?.gameState || !user || room.status !== 'playing' || amIEliminated) return;
        const { turnStartedAt, activePlayerId } = room.gameState;
        if (!turnStartedAt || !activePlayerId) return;
        const updateStealTimer = () => {
            const elapsed = Date.now() - turnStartedAt;
            const remaining = Math.max(0, STEAL_TIMEOUT_SECONDS * 1000 - elapsed);
            setStealTimeLeft(Math.ceil(remaining / 1000));
            setCanSteal(remaining <= 0 && activePlayerId !== user.id);
        };
        updateStealTimer();
        const interval = setInterval(updateStealTimer, 100);
        return () => clearInterval(interval);
    }, [room, user, amIEliminated]);

    // Detect Global Actions (Success/Fail Swaps) - NEW
    useEffect(() => {
        const action = room?.gameState?.latestAction;
        if (!action || !user || !room) return;

        // Prevent duplicate handling
        if (action.timestamp <= lastActionTimestampRef.current) return;
        lastActionTimestampRef.current = action.timestamp;

        const actor = room.players[action.actorId];
        const target = room.players[action.targetId];
        if (!actor || !target) return;

        // If I am NOT the actor, show feedback (Actor sees their own immediate feedback)
        if (action.actorId !== user.id) {
            if (action.success) {
                setSwapSuccess(`${actor.displayName} swapped with ${target.displayName}!`);
                triggerThrowAnimation(action.actorId, action.targetId);
                setTimeout(() => setSwapSuccess(null), 2000);
            } else {
                setSwapError(`${actor.displayName} FAILED swap on ${target.displayName}!`);
                setTimeout(() => setSwapError(null), 2000);
            }
        }

        // Visual Cue for Failure (Everyone sees this - fizzle effect)
        if (!action.success) {
            setFailAnimPlayerId(action.actorId);
            soundManager.playFail();
            setTimeout(() => setFailAnimPlayerId(null), 500);
        }
    }, [room?.gameState?.latestAction, user]);

    // Audio: Death & Win
    useEffect(() => {
        if (!room?.gameState) return;
        const elimCount = room.gameState.eliminatedPlayers.length;
        // Check if count INCREASED (someone died)
        if (elimCount > prevElimCountRef.current && prevElimCountRef.current >= 0) {
            soundManager.playExplosion();
        }
        prevElimCountRef.current = elimCount;

        if (room.status === 'finished') {
            soundManager.playVictory();
        }
    }, [room?.gameState?.eliminatedPlayers.length, room?.status]);

    // Bot AI (Same as before)
    useEffect(() => {
        if (!room?.gameState || room.status !== 'playing') return;
        const aliveBots = Object.values(room.players).filter(
            p => p.isBot && !room.gameState!.eliminatedPlayers.includes(p.id)
        );
        aliveBots.forEach(bot => {
            const isTheirTurn = room.gameState!.activePlayerId === bot.id;
            const timeSinceTurn = Date.now() - room.gameState!.turnStartedAt;
            const canSteal = timeSinceTurn >= 5000;
            if (isTheirTurn || canSteal) {
                const delay = isTheirTurn ? 1000 : 2000;
                const timer = setTimeout(() => {
                    botPlay(code, bot.id);
                }, delay + Math.random() * 1000);
                if (botTimerRef.current) clearTimeout(botTimerRef.current);
                botTimerRef.current = timer;
            }
        });
        return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); };
    }, [room, code]);

    // Action Handlers
    const handleSwap = async (targetId: string) => {
        if (!user || !code || amIEliminated) return;
        setIsSwapping(true);
        setSwapError(null);
        setSwapSuccess(null);
        try {
            await swapBomb(code, user.id, targetId);
            // Force animation immediately for better responsiveness
            // If stealing, it comes from targetId to me (user.id)
            // If normal swap, it goes from me (user.id) to targetId
            // We can detect "Steal" if it was NOT my turn?
            // Actually, handleSwap is called. If I am Active, I give it. If I am NOT Active, I take it (Steal).
            const amIActive = room?.gameState?.activePlayerId === user.id;
            if (amIActive) {
                triggerThrowAnimation(user.id, targetId);
            } else {
                triggerThrowAnimation(targetId, user.id);
            }

            setSwapSuccess('SWAPPED! 🔄');
            setTimeout(() => setSwapSuccess(null), 2000);
        } catch (error: any) {
            console.error('Swap failed:', error);
            setSwapError(error.message || 'Swap failed!');
            setTimeout(() => setSwapError(null), 2000);
        }
        finally { setIsSwapping(false); }
    };
    const handleCancelGame = async () => {
        if (!code) return;
        setIsCancelling(true);
        try { await cancelGame(code); }
        catch (error) { console.error('Cancel failed:', error); }
        finally { setIsCancelling(false); }
    };
    const handlePlayAgain = async () => { if (code) await resetRoom(code); };
    const handleBackToLobby = async () => { if (code) { await resetRoom(code); } };

    // Safe derivation of players for useMemo
    const players = useMemo(() => room ? Object.values(room.players) as GameUser[] : [], [room]);

    // Ordered players for display: Me at the bottom, others clockwise
    const orderedPlayers = useMemo(() => {
        if (!room || !user || players.length === 0) return [];

        // Sort players by ID to keep consistent order
        const allPlayers = [...players].sort((a, b) => a.id.localeCompare(b.id));

        const myIndex = allPlayers.findIndex(p => p.id === user.id);
        if (myIndex === -1 && allPlayers.length > 0) return allPlayers;

        return [
            ...allPlayers.slice(myIndex),
            ...allPlayers.slice(0, myIndex)
        ];
    }, [players, user]);

    if (!room || !user || !room.gameState) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Loading game...</p>
                </div>
            </main>
        );
    }

    // --- GAME STATE & LAYOUT DATA ---
    const { gameState } = room;
    const alivePlayers = players.filter(p => !gameState.eliminatedPlayers.includes(p.id));
    const eliminatedPlayers = players.filter(p => gameState.eliminatedPlayers.includes(p.id));
    const isMyTurn = gameState.activePlayerId === user.id && !amIEliminated;
    const isHost = room.hostId === user.id;
    const isGameOver = room.status === 'finished';
    const winner = gameState.winnerId ? room.players[gameState.winnerId] : null;
    const amIWinner = gameState.winnerId === user.id;
    const activePlayer = gameState.activePlayerId ? room.players[gameState.activePlayerId] : null;


    const formatTime = (ms: number) => `${Math.ceil(ms / 1000)}s`;
    const getDangerLevel = (ms: number) => {
        if (ms <= 5000) return 'critical';
        if (ms <= 10000) return 'danger';
        if (ms <= 20000) return 'warning';
        return 'safe';
    };
    const dangerColors = {
        critical: 'text-red-500 animate-pulse',
        danger: 'text-orange-500',
        warning: 'text-yellow-500',
        safe: 'text-green-400',
    };

    return (
        <main className="min-h-screen w-full bg-base relative perspective-container pt-20 overflow-y-auto md:overflow-hidden md:h-screen text-foreground">
            {/* Ambient Background */}
            <div className="absolute inset-0 game-bg z-0" />

            {/* Flying Bombs Overlay */}
            {flyingBombs.map(bomb => (
                <div
                    key={bomb.id}
                    className="fixed z-[1000] animate-throw text-4xl"
                    style={{
                        '--start-x': `${bomb.startX}px`,
                        '--start-y': `${bomb.startY}px`,
                        '--end-x': `${bomb.endX}px`,
                        '--end-y': `${bomb.endY}px`,
                    } as any}
                >
                    <BombIcon color={bomb.color} className="w-12 h-12" />
                </div>
            ))}

            {/* --- 3D SCENE (Desktop Only) --- */}
            {/* Hide table when game is over to prevent Z-fighting/clipping with the modal */}
            <div className={`hidden md:flex relative w-full h-full items-center justify-center preserve-3d ${isGameOver ? 'hidden' : 'flex'}`}>

                {/* Central Holographic Table - Adjusted for better responsiveness and z-index */}
                <div className="absolute table-surface w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-surface/30 border border-primary/20 backdrop-blur-md flex items-center justify-center z-0 transition-all duration-500">
                    {/* Inner Glow Rings */}
                    <div className="absolute inset-4 rounded-full border border-primary/10 animate-pulse-glow" />
                    <div className="absolute inset-12 rounded-full border border-primary/5 animate-spin-slow" style={{ animationDuration: '20s' }} />


                </div>

                {/* --- PLAYERS ORBIT --- */}
                {/* 
                   Positioning:
                   User (Index 0) -> Bottom Center
                   Others -> Arranged in semi-circle top
                */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    {orderedPlayers.map((player, index) => {
                        const isMe = player.id === user.id;
                        const isEliminated = gameState.eliminatedPlayers.includes(player.id);
                        const totalOthers = orderedPlayers.length - 1;

                        // Calculate Position
                        let style = {};
                        if (isMe) {
                            style = {
                                bottom: '5%',
                                left: '50%',
                                transform: 'translateX(-50%) translateZ(200px) scale(1.1)',
                                zIndex: 100 // User always on top defined high
                            };
                        } else {
                            // Distribute others around top arc, using more side space (280 degrees total)
                            // Range: 130 degrees (Bottom Left) to 410 degrees (Bottom Right)
                            // Top is 270. Left is 180. Right is 360 (0).
                            const totalArc = 280;
                            const startAngle = 130;

                            // We use (totalOthers + 1) segments to space them evenly within the arc
                            const angleStep = totalArc / (totalOthers + 1);
                            const angle = startAngle + (angleStep * index);

                            // Responsive radius
                            const radius = 280; // Reduced from 350 to fit screens better
                            const rad = (angle * Math.PI) / 180;
                            const x = Math.cos(rad) * radius;
                            const y = Math.sin(rad) * radius * 0.7; // Flatter ellipse

                            style = {
                                left: '50%',
                                top: '45%', // Adjusted vertical center
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${1 - (y / 1000)})`,
                                zIndex: Math.floor(y) + 10 // Dynamic z-index based on depth
                            };
                        }

                        const isActive = gameState.activePlayerId === player.id;
                        const bomb = gameState.bombs[player.id];
                        const showSwapButton = (isMyTurn || canSteal) && !isGameOver && !amIEliminated && !isMe && !isEliminated;

                        return (
                            <div
                                key={player.id}
                                ref={el => { seatRefs.current[player.id] = el; }}
                                className={`absolute pointer-events-auto transition-all duration-500 flex flex-col items-center ${isEliminated ? 'opacity-50 grayscale blur-[1px]' : ''}`}
                                style={style}
                            >
                                {/* Active Indicator Arrow */}
                                {isActive && (
                                    <div className="mb-2 text-primary animate-bounce">
                                        ▼
                                    </div>
                                )}

                                {/* Player Card */}
                                <div className={`
                                    relative w-32 md:w-40 backdrop-blur-xl rounded-2xl p-3 border-2 transition-all duration-300
                                    ${isActive ? 'border-primary bg-primary/20 shadow-[0_0_30px_rgba(6,182,212,0.3)] scale-105' : 'border-white/10 bg-surface/40 hover:bg-surface/60'}
                                    ${showSwapButton ? 'scale-110 border-green-400/50 bg-green-500/10 shadow-[0_0_20px_rgba(74,222,128,0.2)] animate-pulse-slow cursor-pointer hover:scale-115' : ''}
                                    ${player.id === failAnimPlayerId ? 'border-red-500 bg-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-pulse scale-110' : ''}
                                    ${isMe ? 'w-48 md:w-64 h-auto' : ''}
                                    ${isEliminated ? 'border-red-500/30 bg-red-900/10' : ''}
                                `}
                                    onClick={() => showSwapButton && handleSwap(player.id)}>

                                    {/* Spectator Badge (For Me) */}
                                    {isMe && isEliminated && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-100 text-[10px] font-bold px-3 py-1 rounded-full border border-red-500/50 shadow-lg whitespace-nowrap z-50 animate-pulse">
                                            SPECTATOR MODE
                                        </div>
                                    )}

                                    {/* Avatar & Name */}
                                    <div className="flex flex-col items-center mb-2">
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-lg relative
                                            ${player.isBot ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-cyan-400 to-blue-600'}
                                        `}>
                                            {player.isBot ? '🤖' : player.displayName.charAt(0)}

                                            {/* Eliminated Skull Overlay */}
                                            {isEliminated && (
                                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-xl">
                                                    💀
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className={`font-bold text-sm truncate max-w-full px-2 ${isEliminated ? 'text-red-400 line-through' : 'text-white'}`}>
                                                {player.displayName}
                                            </p>
                                            {player.isBot && <span className="text-[10px] text-purple-300 uppercase tracking-wider">Bot AI</span>}
                                        </div>
                                    </div>

                                    {/* Bomb Display (Icon for all, Timer for Me/Spectators) */}
                                    {bomb && (
                                        <div className={`absolute animate-float-3d ${isMe
                                            ? 'top-1/2 -translate-y-1/2 right-[120%]' // Side for Me (Left)
                                            : '-top-12 left-1/2 -translate-x-1/2'   // Top for others
                                            }`}>
                                            <div className="relative">
                                                <div className="w-12 h-12 filter transition-all duration-300 transform scale-125">
                                                    <BombIcon color={bomb.color} className="w-full h-full" />
                                                </div>
                                                {/* Timer Badge - Hidden for opponents when playing */}
                                                {(isMe || amIEliminated) && (
                                                    <div className={`
                                                        absolute -bottom-2 left-1/2 -translate-x-1/2 
                                                        px-2 py-0.5 rounded-full text-xs font-mono font-bold whitespace-nowrap
                                                        bg-black/80 border border-white/20 backdrop-blur-sm
                                                        ${dangerColors[getDangerLevel(bomb.expiresAt - Date.now())]}
                                                    `}>
                                                        {formatTime(bomb.expiresAt - Date.now())}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ME-Specific Controls */}
                                    {isMe && isActive && (
                                        <div className="mt-2 text-center">
                                            <p className="text-xs text-primary animate-pulse mb-1">YOUR BOMB!</p>
                                        </div>
                                    )}

                                    {/* Interaction Button (Swap) */}
                                    {showSwapButton && (
                                        <Button
                                            onClick={() => handleSwap(player.id)}
                                            disabled={isSwapping}
                                            size="sm"
                                            variant={canSteal && !isMyTurn ? 'danger' : 'primary'}
                                            fullWidth
                                            className="mt-2 text-xs py-1 h-8"
                                        >
                                            {isSwapping ? '...' : canSteal && !isMyTurn ? 'STEAL' : 'SWAP'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- ELIMINATED & SPECTATOR OVERLAYS --- */}
                {/* (Basically same markup as before but Z-indexed above the table) */}



                {/* Eliminated Waiting Screen - Replaced blocking modal with subtle indicator */}
                {!isGameOver && amIEliminated && (
                    <div className="absolute inset-0 z-0 pointer-events-none" />
                )}

                {/* Host Controls - Improved Mobile Positioning */}
                {isHost && !isGameOver && (
                    <div className="absolute top-4 right-4 z-50">
                        <Button
                            onClick={handleCancelGame}
                            variant="ghost"
                            size="sm"
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 backdrop-blur-md border border-red-500/20"
                        >
                            <span className="hidden md:inline">Cancel Game</span>
                            <span className="md:hidden">✕</span>
                        </Button>
                    </div>
                )}


            </div>

            {/* --- MOBILE 2D VIEW --- */}
            <div className="flex md:hidden flex-col w-full h-screen absolute inset-0 z-30 bg-[#020617] overflow-y-auto pb-40 px-4 pt-8">
                {/* Header Info */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-white tracking-widest">BOMBERBALL</h2>
                    <p className="text-cyan-400 text-sm font-bold">{alivePlayers.length} PLAYERS ALIVE</p>
                    {amIEliminated && !isGameOver && <p className="text-red-400 text-xs font-bold uppercase mt-1 animate-pulse">Spectating</p>}
                    {amIEliminated && !isGameOver && <p className="text-red-400 text-xs font-bold uppercase mt-1 animate-pulse">Spectating</p>}
                </div>

                {/* Opponents Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {orderedPlayers.filter(p => p.id !== user.id).map(player => {
                        const bomb = room?.gameState?.bombs[player.id];
                        const isElim = room?.gameState?.eliminatedPlayers.includes(player.id);
                        const isActive = activePlayer?.id === player.id;
                        const showSwapButton = (isMyTurn || canSteal) && !isGameOver && !amIEliminated && !isElim;

                        return (
                            <div key={player.id} className={`
                                 relative p-4 rounded-xl border-2 flex flex-col items-center justify-center bg-surface/40 backdrop-blur transition-all
                                 ${isActive ? 'border-primary shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-primary/10' : 'border-white/10'}
                                 ${isElim ? 'opacity-50 grayscale' : ''}
                                 ${showSwapButton ? 'border-green-400/50 bg-green-500/10 animate-pulse cursor-pointer' : ''}
                                 ${player.id === failAnimPlayerId ? 'border-red-500 bg-red-500/40 animate-pulse' : ''}
                                 min-h-[140px]
                             `}
                                onClick={() => showSwapButton && handleSwap(player.id)}
                            >
                                {isElim && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20">
                                        <div className="bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg -rotate-12 border border-red-400/50">
                                            ELIMINATED
                                        </div>
                                    </div>
                                )}
                                {/* Avatar */}
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white mb-2 shadow-lg ${player.isBot ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-cyan-400 to-blue-600'}`}>
                                    {player.isBot ? '🤖' : player.displayName.charAt(0)}
                                </div>
                                <span className="font-bold text-white text-sm truncate max-w-full">{player.displayName}</span>

                                {/* Bomb Indicator */}
                                {bomb && !isElim && (
                                    <div className="absolute top-2 right-2 animate-bounce w-8 h-8">
                                        <BombIcon color={bomb.color} className="w-full h-full" />
                                    </div>
                                )}

                                {isActive && !isElim && <span className="absolute bottom-2 text-[10px] text-primary font-bold uppercase tracking-widest">Target</span>}
                                {showSwapButton && (
                                    <div
                                        className="absolute -bottom-3 z-10"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button
                                            size="sm"
                                            variant={canSteal ? 'danger' : 'primary'}
                                            onClick={() => handleSwap(player.id)}
                                            className="px-4 py-1 h-8 text-xs font-bold shadow-lg"
                                        >
                                            {canSteal && !isMyTurn ? 'STEAL!' : 'SWAP'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* My Control Bar (Mobile Fixed Bottom) */}
                <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t-2 border-primary/20 p-4 z-[60] flex items-center justify-between pb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/20">
                            ME
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-lg">{user.displayName}</span>
                            {amIEliminated ? <span className="text-red-500 text-xs font-bold">ELIMINATED 💀</span> : <span className="text-green-400 text-xs font-bold">ALIVE</span>}
                            {canSteal && !isMyTurn && !amIEliminated && (
                                <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">STEAL AVAILABLE!</span>
                            )}
                        </div>
                    </div>

                    {/* My Bomb Timer / Action */}
                    {room?.gameState?.bombs[user.id] && !amIEliminated && (
                        <div className="flex flex-col items-end">
                            <div className="w-10 h-10 animate-pulse relative">
                                <BombIcon color={room?.gameState?.bombs[user.id]?.color} className="w-full h-full" />
                            </div>
                            {timeLeft !== null && room?.gameState?.bombs[user.id] && (
                                <span className="text-2xl font-black text-white tabular-nums leading-none mt-1">
                                    {(timeLeft / 1000).toFixed(1)}s
                                </span>
                            )}
                            {isMyTurn && <span className="text-[10px] text-red-500 font-bold animate-pulse mt-1">TAP PLAYER TO SWAP!</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* --- SCREEN OVERLAY UI (HUD) --- */}

            {/* --- CENTRAL TABLE HUD --- */}
            {!isGameOver && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center justify-center">

                    {/* Spectator Indicator (Desktop) - MOVED to Player Card */}

                    {/* 1. Feedback Toasts (Big and Center) */}
                    {(swapError || swapSuccess) && (
                        <div className={`
                            mb-4 px-6 py-3 rounded-2xl font-black text-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-bounce-in whitespace-nowrap backdrop-blur-md border-2
                            ${swapError
                                ? 'bg-red-600/90 border-red-400 text-white rotate-2'
                                : 'bg-green-600/90 border-green-400 text-white -rotate-2'
                            }
                        `}>
                            {swapError ? `💥 ${swapError}` : `✨ ${swapSuccess}`}
                        </div>
                    )}

                    {/* 2. Swap Chance (When My Turn) */}
                    {isMyTurn && (
                        <div className="hidden md:flex flex-col items-center animate-pulse-slow">
                            <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-blue-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                {room?.gameState?.swapChance || 10}%
                            </div>
                            <div className="text-cyan-400 text-xs md:text-sm font-bold tracking-[0.5em] uppercase mt-1 bg-black/40 px-3 py-1 rounded-full backdrop-blur">
                                Success Rate
                            </div>
                        </div>
                    )}

                    {/* 3. Target Info (When Not My Turn) */}
                    {activePlayer && !isMyTurn && (
                        <div className="hidden md:flex flex-col items-center opacity-80 mt-4">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Current Turn</span>
                            <div className="text-xl font-bold text-white bg-black/30 px-4 py-1 rounded-full backdrop-blur border border-white/10">
                                {activePlayer.displayName}
                            </div>
                        </div>
                    )}

                </div>
            )}
            {/* Game Over Modal (Moved Outside 3D Scene) */}
            {isGameOver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="text-center p-8 bg-surface/50 rounded-3xl border border-white/10 max-w-lg w-full mx-4">
                        <div className="text-8xl mb-6 animate-bounce-in">{amIWinner ? '🏆' : '💥'}</div>
                        <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
                            {amIWinner ? 'VICTORY' : 'ELIMINATED'}
                        </h1>
                        <p className="text-xl text-gray-300 mb-8">
                            {winner?.displayName} won the match!
                        </p>
                        <div className="flex gap-4 justify-center flex-col md:flex-row">
                            {isHost ? (
                                <>
                                    <Button onClick={handlePlayAgain} size="lg" className="px-8" variant="success">
                                        Play Again
                                    </Button>
                                    <Button onClick={handleBackToLobby} size="lg" variant="secondary">
                                        Back to Lobby
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center animate-pulse">
                                    <p className="text-muted mb-4">Waiting for Host to restart...</p>
                                    <Button onClick={() => router.push('/')} size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                                        Leave Room
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </main >
    );
}

