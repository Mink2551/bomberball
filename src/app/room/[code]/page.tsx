'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Button,

    UsersIcon,
    CrownIcon,
    CheckIcon,
    CopyIcon,
    LogoutIcon,
    PlusIcon,
    PlayIcon,
    ClockIcon,
    XIcon
} from '@/shared/components';
import {
    useUser,
    subscribeToRoom,
    leaveRoom,
    toggleReady,
    startGame,
    addBot,
    removeBot,
    GameRoom,
    GameUser,
    soundManager
} from '@/features/game';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const { user, isAuthenticated } = useUser();
    const [room, setRoom] = useState<GameRoom | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isAddingBot, setIsAddingBot] = useState(false);

    // Subscribe to room updates
    useEffect(() => {
        if (!code) return;

        const unsubscribe = subscribeToRoom(code, (updatedRoom) => {
            if (!updatedRoom) {
                // Room was deleted
                router.push('/');
                return;
            }

            // Redirect to game page when game starts
            if (updatedRoom.status === 'playing' || updatedRoom.status === 'finished') {
                router.push(`/game/${code}`);
                return;
            }

            setRoom(updatedRoom);
        });

        return () => unsubscribe();
    }, [code, router]);



    // SFX: Join/Leave
    const prevPlayerCountRef = useRef(0);
    useEffect(() => {
        if (!room) return;
        const count = Object.keys(room.players).length;
        if (prevPlayerCountRef.current > 0) {
            if (count > prevPlayerCountRef.current) soundManager.playJoin();
            else if (count < prevPlayerCountRef.current) soundManager.playLeave();
        }
        prevPlayerCountRef.current = count;
    }, [room?.players]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    // Handle leave room
    const handleLeave = useCallback(async () => {
        if (!user || !code) return;

        setIsLeaving(true);
        try {
            await leaveRoom(code, user.id);
            router.push('/');
        } catch (error) {
            console.error('Failed to leave room:', error);
            setIsLeaving(false);
        }
    }, [user, code, router]);

    // Handle toggle ready
    const handleToggleReady = async () => {
        if (!user || !code || !room) return;

        const currentPlayer = room.players[user.id];
        if (!currentPlayer) return;

        await toggleReady(code, user.id, !currentPlayer.isReady);
    };

    // Handle start game
    const handleStartGame = async () => {
        if (!code) return;
        await startGame(code);
    };

    // Handle add bot
    const handleAddBot = async () => {
        if (!code || !room) return;
        setIsAddingBot(true);
        try {
            await addBot(code);
        } catch (error) {
            console.error('Failed to add bot:', error);
        } finally {
            setIsAddingBot(false);
        }
    };

    // Handle remove bot
    const handleRemoveBot = async (botId: string) => {
        if (!code) return;
        try {
            await removeBot(code, botId);
        } catch (error) {
            console.error('Failed to remove bot:', error);
        }
    };

    // Copy room code
    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!room || !user) {
        return (
            <main className="min-h-screen flex items-center justify-center relative bg-[#020617] overflow-hidden">
                {/* Theme Toggle */}
                <div className="fixed top-4 right-4 z-50">

                </div>

                {/* Background orbs */}
                <div className="glow-orb" style={{ top: '20%', left: '20%' }} />
                <div className="glow-orb" style={{ bottom: '20%', right: '20%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)' }} />

                <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 loading-spinner mx-auto mb-6" />
                    <p className="text-muted text-lg">Loading room...</p>
                    <p className="text-faint text-sm mt-2">Connecting to game server</p>
                </div>
            </main>
        );
    }

    const players = Object.values(room.players) as GameUser[];
    const currentPlayer = room.players[user.id];
    const isHost = room.hostId === user.id;
    const allReady = players.length > 1 && players.every((p) => p.isHost || p.isReady);
    const canAddBot = isHost && players.length < room.maxPlayers;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-[#020617] overflow-hidden">
            {/* Theme Toggle - Top Right */}
            {/* Top Right Actions */}
            <div className="fixed top-4 right-4 z-50">
                {/* Theme Toggle Removed */}
            </div>

            {/* Cyber Grid Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#0f172a,transparent)]"></div>
            </div>

            {/* Room Header */}
            <div className="text-center mb-8 animate-slide-up relative z-10">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <p className="text-muted text-sm uppercase tracking-wider">Room Code</p>
                </div>

                <button
                    onClick={handleCopyCode}
                    className="group flex items-center gap-4 mx-auto px-8 py-4 rounded-2xl glass-card-premium hover:scale-[1.02] transition-all duration-300"
                >
                    <span className="text-4xl md:text-5xl font-mono font-bold room-code">
                        {code}
                    </span>
                    <span className={`
                        p-2 rounded-lg transition-all duration-200
                        ${copied ? 'bg-success/20 text-success' : 'bg-surface/50 text-muted group-hover:text-primary group-hover:bg-primary/10'}
                    `}>
                        {copied ? (
                            <CheckIcon size={24} />
                        ) : (
                            <CopyIcon size={24} />
                        )}
                    </span>
                </button>

                <p className={`text-xs mt-3 transition-all duration-200 ${copied ? 'text-success' : 'text-faint'}`}>
                    {copied ? '✓ Copied to clipboard!' : 'Click to copy and share with friends'}
                </p>
            </div>

            {/* Players List */}
            <div className="glass-card-premium rounded-3xl p-6 w-full max-w-md mb-6 animate-slide-up relative z-10" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <UsersIcon size={20} className="text-primary" />
                        Players
                    </h2>
                    <span className="px-3 py-1 rounded-full bg-surface text-muted text-sm font-medium">
                        {players.length}/{room.maxPlayers}
                    </span>
                </div>

                <div className="space-y-3">
                    {players.map((player, index) => (
                        <div
                            key={player.id}
                            className={`player-card rounded-xl p-4 flex items-center justify-between animate-slide-up ${player.isHost ? 'host' : player.isReady ? 'ready' : ''
                                }`}
                            style={{ animationDelay: `${0.05 * index}s` }}
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg
                                    transition-all duration-300
                                    ${player.isHost ? 'avatar-host' : 'avatar'}
                                `}>
                                    {player.displayName.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                    <p className="font-semibold text-foreground flex items-center gap-2">
                                        {player.displayName}
                                        {player.id === user.id && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                                You
                                            </span>
                                        )}
                                        {player.isBot && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                🤖 Bot
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {player.isHost && (
                                            <span className="text-xs badge-host px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                <CrownIcon size={12} />
                                                Host
                                            </span>
                                        )}
                                        {player.isBot && isHost && (
                                            <button
                                                onClick={() => handleRemoveBot(player.id)}
                                                className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            {!player.isHost && (
                                <span className={`
                                    px-3 py-1.5 rounded-full text-xs font-medium
                                    transition-all duration-300
                                    ${player.isReady ? 'badge-ready' : 'badge-waiting'}
                                `}>
                                    {player.isReady ? (
                                        <span className="flex items-center gap-1">
                                            <CheckIcon size={14} />
                                            Ready
                                        </span>
                                    ) : 'Not Ready'}
                                </span>
                            )}
                        </div>
                    ))}

                    {/* Empty Slots - show Add Bot button for first empty slot if host */}
                    {Array.from({ length: room.maxPlayers - players.length }).map((_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="empty-slot rounded-xl p-4 flex items-center justify-center animate-fade-in"
                            style={{ animationDelay: `${0.05 * (players.length + i)}s` }}
                        >
                            {i === 0 && canAddBot ? (
                                <button
                                    onClick={handleAddBot}
                                    disabled={isAddingBot}
                                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                                >
                                    <PlusIcon size={20} />
                                    <p className="text-sm font-medium">{isAddingBot ? 'Adding...' : '🤖 Add Bot'}</p>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 text-faint">
                                    <PlusIcon size={20} className="animate-pulse" />
                                    <p className="text-sm">Waiting for player...</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-md space-y-3 animate-slide-up relative z-10" style={{ animationDelay: '0.2s' }}>
                {isHost ? (
                    <Button
                        onClick={handleStartGame}
                        disabled={!allReady}
                        fullWidth
                        size="lg"
                        variant={allReady ? 'success' : 'primary'}
                        className={allReady ? 'animate-pulse-glow' : ''}
                    >
                        {allReady ? (
                            <>
                                <PlayIcon size={20} />
                                Start Game!
                            </>
                        ) : (
                            <>
                                <ClockIcon size={20} className="animate-spin-slow" />
                                Waiting for players to ready up...
                            </>
                        )}
                    </Button>
                ) : (
                    currentPlayer && (
                        <Button
                            onClick={handleToggleReady}
                            variant={currentPlayer.isReady ? 'secondary' : 'success'}
                            fullWidth
                            size="lg"
                        >
                            {currentPlayer.isReady ? (
                                <>
                                    <XIcon size={20} />
                                    Cancel Ready
                                </>
                            ) : (
                                <>
                                    <CheckIcon size={20} />
                                    Ready Up!
                                </>
                            )}
                        </Button>
                    )
                )}

                <Button
                    onClick={handleLeave}
                    variant="ghost"
                    fullWidth
                    loading={isLeaving}
                >
                    {!isLeaving && <LogoutIcon size={20} />}
                    {isLeaving ? 'Leaving...' : 'Leave Room'}
                </Button>
            </div>

            {/* Info footer */}
            <div className="mt-8 text-center text-faint text-xs">
                <p>All players must be ready before the game can start</p>
            </div>
        </main>
    );
}
