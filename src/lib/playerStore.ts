import { create } from 'zustand';
import type { Player } from '@/types/youtube';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  queue: Track[];
  player: Player | null;
  lyrics: string | null;
  loadingLyrics: boolean;
  showLyrics: boolean;
  showVideo: boolean;
  session: Session | null;
  shuffle: boolean;
  currentIndex: number;
  
  setPlayer: (player: Player) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  fetchLyrics: (title: string, artist: string, videoId?: string) => Promise<void>;
  setShowLyrics: (show: boolean) => void;
  setShowVideo: (show: boolean) => void;
  setSession: (session: Session | null) => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 70,
  queue: [],
  player: null,
  lyrics: null,
  loadingLyrics: false,
  showLyrics: false,
  showVideo: false,
  session: null,
  shuffle: false,
  currentIndex: 0,

  setPlayer: (player) => {
    set({ player });
    const { currentTrack, isPlaying, volume } = get();
    try {
      if (currentTrack) {
        console.log('🎬 Player set. Loading current track on ready:', currentTrack.videoId);
        player.setVolume?.(volume);
        // Define qualidade para áudio (sem vídeo) como média para economizar banda
        try {
          (player as any).setPlaybackQuality?.('medium');
        } catch (e) {
          console.log('Não foi possível definir qualidade inicial');
        }
        player.loadVideoById(currentTrack.videoId);
        if (isPlaying) {
          player.playVideo?.();
        }
      }
    } catch (e) {
      console.warn('⚠️ Failed to auto-load current track on player ready', e);
    }
  },

  playTrack: (track) => {
    const { player, session } = get();
    console.log('🎵 Playing track:', track.title, 'VideoID:', track.videoId);
    set({ currentTrack: track, isPlaying: true });
    
    if (player) {
      console.log('✅ Player ready, loading video:', track.videoId);
      player.loadVideoById(track.videoId);
    } else {
      console.warn('⚠️ Player not ready yet');
    }

    // Registrar no histórico (apenas se for UUID válido)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(track.id);
    if (session?.user && isUUID) {
      supabase
        .from('historico_escuta')
        .insert({
          user_id: session.user.id,
          musica_id: track.id,
        })
        .then(({ error }) => {
          if (error) console.error('Erro ao registrar histórico:', error);
        });
    }

    // Buscar letra automaticamente
    get().fetchLyrics(track.title, track.artist, track.videoId);
  },

  togglePlay: () => {
    const { player, isPlaying } = get();
    
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
        set({ isPlaying: false });
      } else {
        player.playVideo();
        set({ isPlaying: true });
      }
    }
  },

  setVolume: (volume) => {
    const { player } = get();
    set({ volume });
    
    if (player) {
      player.setVolume(volume);
    }
  },

  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;
    
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < queue.length - 1) {
      get().playTrack(queue[currentIndex + 1]);
    }
  },

  previousTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;
    
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      get().playTrack(queue[currentIndex - 1]);
    }
  },

  addToQueue: (track) => {
    set((state) => ({
      queue: [...state.queue, track]
    }));
  },

  setQueue: (tracks) => {
    set({ queue: tracks, currentIndex: 0 });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  fetchLyrics: async (title: string, artist: string, videoId?: string) => {
    set({ loadingLyrics: true, lyrics: null });
    
    try {
      const { data, error } = await supabase.functions.invoke('buscar-letra-web', {
        body: { title, artist, videoId }
      });

      if (error) throw error;

      set({ lyrics: data.lyrics, loadingLyrics: false });
    } catch (error) {
      console.error('❌ Erro ao buscar letra:', error);
      set({ 
        lyrics: 'Não foi possível carregar a letra desta música.',
        loadingLyrics: false 
      });
    }
  },

  setShowLyrics: (show: boolean) => set({ showLyrics: show }),
  
  setShowVideo: (show: boolean) => set({ showVideo: show }),
  
  setSession: (session: Session | null) => set({ session }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  playNext: () => {
    const { queue, currentIndex, shuffle } = get();
    if (queue.length === 0) return;

    let nextIndex: number;
    if (shuffle) {
      // Próxima aleatória (exceto a atual)
      const availableIndices = queue.map((_, i) => i).filter(i => i !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      // Próxima sequencial
      nextIndex = (currentIndex + 1) % queue.length;
    }

    const nextTrack = queue[nextIndex];
    set({ currentTrack: nextTrack, currentIndex: nextIndex });
  },

  playPrevious: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;

    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    const prevTrack = queue[prevIndex];
    set({ currentTrack: prevTrack, currentIndex: prevIndex });
  },
}));
