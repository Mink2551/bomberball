export class SoundManager {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
    private musicTimer: NodeJS.Timeout | null = null;
    private currentMusic: AudioNode[] = [];

    private getContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) this.stopMusic();
        else {
             // If we were supposed to be playing music, we can't easily resume without context.
             // Rely on page effects to restart.
        }
    }

    stopMusic() {
        if (this.musicTimer) clearTimeout(this.musicTimer);
        this.currentMusic.forEach(node => {
            try { (node as any).stop?.(); node.disconnect(); } catch (e) {}
        });
        this.currentMusic = [];
    }

    playLobbyMusic() {
        this.stopMusic();
        if (this.isMuted) return;
        
        try {
            const ctx = this.getContext();
            const bpm = 80;
            const beatDur = 60 / bpm;
            let nextTime = ctx.currentTime + 0.1;
            let beat = 0;
            
            // Background Pad (Drone)
            const padOsc = ctx.createOscillator();
            padOsc.type = 'triangle';
            padOsc.frequency.value = 261.63; // C4 (C Major7 chord pad)
            const padGain = ctx.createGain();
            padGain.gain.value = 0.05;
            
            // Auto-filter for pad
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 0.2;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 200;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 500;
            
            padOsc.connect(filter);
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            filter.connect(padGain);
            padGain.connect(ctx.destination);
            
            padOsc.start();
            lfo.start();
            this.currentMusic.push(padOsc, lfo, padGain, lfoGain, filter);

            const schedule = () => {
                const lookahead = 1.0; 
                while (nextTime < ctx.currentTime + lookahead) {
                    // Beat Logic (4/4)
                    const beatInBar = beat % 4;
                    
                    // Kick: Beats 0 and 2.5 (Syncopated)
                    if (beatInBar === 0 || (beat % 8 === 5)) {
                        this.triggerKick(nextTime);
                    }
                    
                    // Snare: Beats 2
                    if (beatInBar === 2) {
                        this.triggerSnare(nextTime);
                    }
                    
                    // HiHats: Every 0.5 beat (8ths)
                    // We need finer granularity? Our loop is beats.
                    // Let's just play HH on the beat
                    this.triggerHiHat(nextTime);
                    // And offbeat
                    this.triggerHiHat(nextTime + beatDur/2);

                    // Bass: Root on 0
                    if (beatInBar === 0) {
                        this.triggerBass(nextTime, 65.41); // C2
                    }
                    
                    nextTime += beatDur;
                    beat++;
                }
                this.musicTimer = setTimeout(schedule, 200);
            };
            
            schedule();
        } catch (e) { console.error(e); }
    }

    private triggerKick(time: number) {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    private triggerSnare(time: number) {
        const ctx = this.getContext();
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(time);
    }

    private triggerHiHat(time: number) {
        const ctx = this.getContext();
        const osc = ctx.createOscillator(); // Use square for cheap hat
        osc.type = 'square';
        osc.frequency.setValueAtTime(8000, time); 
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 10000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
    }
    
    private triggerBass(time: number, freq: number) {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    playJoin() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        // Happy doorbell (Major 3rd)
        const osc1 = ctx.createOscillator();
        osc1.frequency.setValueAtTime(523.25, t); // C5
        const osc2 = ctx.createOscillator();
        osc2.frequency.setValueAtTime(659.25, t + 0.1); // E5
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.6);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(t);
        osc1.stop(t + 0.2);
        osc2.start(t + 0.1);
        osc2.stop(t + 0.6);
    }

    playLeave() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const t = ctx.currentTime;
        // Sad slide down
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.3);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    playTick(intensity: number = 0.5) {
        if (this.isMuted) return;
        try {
            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(800 + (intensity * 200), ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {}
    }

    playSwap() {
        if (this.isMuted) return;
        try {
            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {}
    }

    playFail() {
        if (this.isMuted) return;
        try {
            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    }

    playExplosion() {
        if (this.isMuted) return;
        try {
            const ctx = this.getContext();
            const bufferSize = ctx.sampleRate * 1.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start();
        } catch (e) {}
    }

    playVictory() {
        if (this.isMuted) return;
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            [0, 0.1, 0.2, 0.4].forEach((delay, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'square';
                const freq = [523.25, 659.25, 783.99, 1046.50][i];
                osc.frequency.setValueAtTime(freq, now + delay);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.1, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.3);
            });
        } catch (e) {}
    }
}

export const soundManager = new SoundManager();
