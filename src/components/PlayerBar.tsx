import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, FileText, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/playerStore";

export function PlayerBar() {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    player,
    setPlayer,
    togglePlay, 
    setVolume,
    nextTrack,
    previousTrack,
    setIsPlaying,
    setShowVideo,
    setShowLyrics,
    lyrics,
    loadingLyrics,
    shuffle,
    toggleShuffle,
    playNext,
    playPrevious
  } = usePlayerStore();

  // Carregar YouTube IFrame API
  useEffect(() => {
    const container = document.getElementById('youtube-player-container');
    if (!container) {
      console.error('❌ Container do YouTube Player não encontrado');
      return;
    }

    const initPlayer = () => {
      console.log('🧩 Initializing YouTube Player');
      
      // Criar div para o player dentro do container global
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player';
      container.appendChild(playerDiv);
      
      const ytPlayer = new window.YT.Player('youtube-player', {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            console.log('✅ YouTube Player ready');
            setPlayer(event.target);
            event.target.setVolume(volume);
            try { event.target.getIframe()?.setAttribute('playsinline', '1'); } catch {}
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              nextTrack();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };
  }, [volume, setPlayer, setIsPlaying, nextTrack]);

  // Configurar Media Session API para controles de mídia nativos
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: [
        { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '192x192', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '384x384', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    // Configurar handlers para controles de mídia
    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlaying) togglePlay();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlaying) togglePlay();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPrevious();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime && player && duration > 0) {
        player.seekTo(details.seekTime, true);
        setProgress((details.seekTime / duration) * 100);
      }
    });

    console.log('🎵 Media Session API configurada para:', currentTrack.title);
  }, [currentTrack, isPlaying, togglePlay, playNext, playPrevious, player, duration]);

  // Atualizar posição de reprodução na Media Session
  useEffect(() => {
    if (!player || !isPlaying || !('mediaSession' in navigator)) return;

    const interval = setInterval(() => {
      const currentTime = player.getCurrentTime();
      const totalDuration = player.getDuration();
      
      if (totalDuration > 0) {
        setProgress((currentTime / totalDuration) * 100);
        setDuration(totalDuration);

        // Atualizar posição para os controles nativos
        navigator.mediaSession.setPositionState({
          duration: totalDuration,
          playbackRate: 1,
          position: currentTime
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    if (player && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      player.seekTo(newTime, true);
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const currentTime = player ? player.getCurrentTime() : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl z-[70] pointer-events-auto">
      <div className="max-w-screen-2xl mx-auto">
        {/* Barra de Progresso */}
        <div className="px-2 md:px-4">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between gap-2 md:gap-4 px-2 md:px-8 pb-3 md:pb-4 pt-2">
          {/* Informações da Música */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {currentTrack && (
              <>
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-md md:rounded-lg object-cover shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate text-xs md:text-base">
                    {currentTrack.title}
                  </h3>
                  <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                    {currentTrack.artist}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Controles de Reprodução */}
          <div className="flex flex-col items-center gap-1 md:gap-2">
            <div className="flex items-center gap-1 md:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleShuffle}
                    className={`hidden md:flex h-9 w-9 hover:bg-primary/10 ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <Shuffle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {shuffle ? 'Desativar aleatorio' : 'Ativar aleatorio'}
                </TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                onClick={playPrevious}
                disabled={!currentTrack}
                className="h-7 w-7 md:h-9 md:w-9 hover:bg-primary/10"
              >
                <SkipBack className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={togglePlay}
                disabled={!currentTrack}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-primary hover:scale-110 transition-all shadow-glow hover:shadow-hover"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 md:h-6 md:w-6 text-white" />
                ) : (
                  <Play className="h-5 w-5 md:h-6 md:w-6 text-white fill-white" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={playNext}
                disabled={!currentTrack}
                className="h-7 w-7 md:h-9 md:w-9 hover:bg-primary/10"
              >
                <SkipForward className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
            
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controles Extras */}
          <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end">
            <div className="hidden lg:flex items-center gap-2 min-w-[120px]">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-24 cursor-pointer"
              />
            </div>

            {lyrics && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLyrics(true)}
                    className="h-8 w-8 md:h-10 md:w-10 hover:bg-primary/10 relative"
                  >
                    <FileText className="h-4 w-4 md:h-5 md:w-5" />
                    <Badge className="absolute -top-1 -right-1 h-3 min-w-3 md:h-4 md:min-w-4 p-0 flex items-center justify-center text-[8px] md:text-[10px] bg-primary">
                      ✓
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver letra</TooltipContent>
              </Tooltip>
            )}

            {loadingLyrics && (
              <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-primary"></div>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowVideo(true);
                    // Aguarda o dialog abrir e então ativa fullscreen
                    setTimeout(() => {
                      if (player) {
                        const iframe = player.getIframe();
                        if (iframe?.requestFullscreen) {
                          iframe.requestFullscreen().catch(() => {});
                        }
                      }
                    }, 500);
                  }}
                  disabled={!currentTrack}
                  className="hidden md:flex h-10 w-10 hover:bg-primary/10"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Assistir em tela cheia</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
