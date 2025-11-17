// Tipos para YouTube IFrame Player API
export interface Player {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(videoId: string, startSeconds?: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  getVolume(): number;
  getPlayerState(): number;
  getIframe(): HTMLIFrameElement;
  getAvailableQualityLevels(): string[];
  setPlaybackQuality(suggestedQuality: string): void;
  getPlaybackQuality(): string;
}

declare namespace YT {
  export enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5
  }

  export interface PlayerVars {
    autoplay?: 0 | 1;
    cc_load_policy?: 1;
    color?: 'red' | 'white';
    controls?: 0 | 1 | 2;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    end?: number;
    fs?: 0 | 1;
    hl?: string;
    iv_load_policy?: 1 | 3;
    list?: string;
    listType?: 'playlist' | 'search' | 'user_uploads';
    loop?: 0 | 1;
    modestbranding?: 0 | 1;
    origin?: string;
    playlist?: string;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    start?: number;
    widget_referrer?: string;
  }

  export interface PlayerOptions {
    width?: string | number;
    height?: string | number;
    videoId?: string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  export interface Events {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onPlaybackQualityChange?: (event: PlayerEvent) => void;
    onPlaybackRateChange?: (event: PlayerEvent) => void;
    onError?: (event: OnErrorEvent) => void;
    onApiChange?: (event: PlayerEvent) => void;
  }

  export interface PlayerEvent {
    target: Player;
  }

  export interface OnStateChangeEvent extends PlayerEvent {
    data: PlayerState;
  }

  export interface OnErrorEvent extends PlayerEvent {
    data: number;
  }

  export class Player {
    constructor(container: HTMLElement | string, options: PlayerOptions);
    
    // Funções de controle
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    clearVideo(): void;
    
    // Funções de mudança de vídeo
    loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
    cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
    
    // Funções de controle de volume
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setVolume(volume: number): void;
    getVolume(): number;
    
    // Funções de informação do player
    getVideoLoadedFraction(): number;
    getPlayerState(): PlayerState;
    getCurrentTime(): number;
    getDuration(): number;
    getVideoUrl(): string;
    getVideoEmbedCode(): string;
    
    // Funções de playlist
    nextVideo(): void;
    previousVideo(): void;
    getPlaylist(): string[];
    getPlaylistIndex(): number;
    
    // Funções de controle de reprodução
    setPlaybackRate(suggestedRate: number): void;
    getPlaybackRate(): number;
    getAvailablePlaybackRates(): number[];
    
    // Funções de controle de qualidade
    setPlaybackQuality(suggestedQuality: string): void;
    getPlaybackQuality(): string;
    getAvailableQualityLevels(): string[];
    
    // Funções de loop
    setLoop(loopPlaylists: boolean): void;
    setShuffle(shufflePlaylist: boolean): void;
    
    // Funções de tamanho do player
    setSize(width: number, height: number): object;
    
    // Obter iframe
    getIframe(): HTMLIFrameElement;
    
    // Destruir player
    destroy(): void;
  }
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export {};
