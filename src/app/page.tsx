'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Modal, BombIcon, BoltIcon, UserIcon, PlusIcon, ArrowRightIcon } from '@/shared/components';
import { useUser, generateUserId, createRoom, joinRoom } from '@/features/game';

export default function Home() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useUser();

  // User setup state
  const [displayName, setDisplayName] = useState('');

  // Join room modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Handle user creation
  const handleCreateUser = () => {
    if (!displayName.trim()) return;

    const newUser = {
      id: generateUserId(),
      displayName: displayName.trim(),
    };
    setUser(newUser);
  };

  // Handle room creation
  const handleCreateRoom = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const room = await createRoom(user);
      router.push(`/room/${room.code}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle room joining
  const handleJoinRoom = async () => {
    if (!user || !roomCode.trim()) return;

    setIsJoining(true);
    setJoinError('');

    try {
      const room = await joinRoom(roomCode, user);
      if (room) {
        router.push(`/room/${room.code}`);
      }
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-[#020617] overflow-hidden">
      {/* Theme Toggle - Removed/Hidden */}

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#0f172a,transparent)]"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl opacity-30"></div>
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-primary rounded-full opacity-20 animate-float"
            style={{
              width: Math.random() * 6 + 2 + 'px',
              height: Math.random() * 6 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDuration: Math.random() * 10 + 10 + 's',
              animationDelay: Math.random() * -10 + 's'
            }}
          />
        ))}
      </div>

      {/* Game Title */}
      <div className="text-center mb-16 animate-float relative z-10 w-full max-w-4xl mx-auto">
        <div className="relative mb-6">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            BOMBERBALL
          </h1>
          <div className="absolute -inset-1 blur-2xl bg-primary/20 rounded-[100%] z-[-1]"></div>
        </div>

        <p className="text-blue-200/80 text-lg md:text-2xl font-light tracking-wide max-w-lg mx-auto leading-relaxed">
          Pass the bomb before time runs out.
          <br />
          <span className="font-semibold text-primary">Don't be the one holding it!</span>
        </p>

      </div>

      {/* Main Card */}
      <div className="glass-card-premium rounded-3xl p-8 w-full max-w-md shadow-2xl animate-slide-up relative z-10">
        {!isAuthenticated ? (
          /* User Setup Form */
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl avatar mb-4">
                <UserIcon size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome!</h2>
              <p className="text-muted text-sm">Enter your display name to get started</p>
            </div>

            <Input
              placeholder="Enter your name..."
              value={displayName}
              onChange={setDisplayName}
              maxLength={20}
              showCharCount
              autoFocus
              icon={<UserIcon size={20} />}
            />

            <Button
              onClick={handleCreateUser}
              disabled={!displayName.trim()}
              fullWidth
              size="lg"
            >
              <BoltIcon size={20} />
              Let&apos;s Go!
            </Button>
          </div>
        ) : (
          /* Room Actions */
          <div className="space-y-6">
            <div className="text-center">
              {/* User Avatar */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl avatar mb-4">
                <span className="text-2xl font-bold text-white">
                  {user?.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-muted text-sm mb-1">Playing as</p>
              <h2 className="text-2xl font-bold gradient-text">{user?.displayName}</h2>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleCreateRoom}
                loading={isCreating}
                fullWidth
                size="lg"
              >
                {!isCreating && <PlusIcon size={20} />}
                {isCreating ? 'Creating...' : 'Create Room'}
              </Button>

              <Button
                onClick={() => setShowJoinModal(true)}
                variant="secondary"
                fullWidth
                size="lg"
              >
                <ArrowRightIcon size={20} className="rotate-180" />
                Join Room
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setUser(null)}
                className="w-full text-center text-muted text-sm hover:text-primary transition-colors duration-200 py-2 rounded-lg hover:bg-surface/50"
              >
                <span className="flex items-center justify-center gap-2">
                  <ArrowRightIcon size={16} className="rotate-180" />
                  Change Name
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Version badge */}
      <div className="mt-8 text-faint text-xs font-mono opacity-50">
        v0.1.0 Beta
      </div>

      {/* Join Room Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          setRoomCode('');
          setJoinError('');
        }}
        title="Join Room"
      >
        <div className="space-y-5">
          <p className="text-muted text-sm">
            Enter the 6-character room code to join your friends
          </p>

          <Input
            placeholder="XXXXXX"
            value={roomCode}
            onChange={(val) => {
              setRoomCode(val);
              setJoinError('');
            }}
            maxLength={6}
            uppercase
            error={joinError}
            autoFocus
          />

          <Button
            onClick={handleJoinRoom}
            disabled={roomCode.length !== 6}
            loading={isJoining}
            fullWidth
            size="lg"
          >
            {!isJoining && <ArrowRightIcon size={20} />}
            {isJoining ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
