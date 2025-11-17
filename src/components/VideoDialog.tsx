import { usePlayerStore } from '@/lib/playerStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Maximize2, Minimize2, Play, Pause, Volume2, VolumeX, Settings, SkipForward, SkipBack, Rewind, FastForward } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function VideoDialog() {
  const { showVideo, setShowVideo, currentTrack, player, isPlaying, togglePlay, volume, setVolume, playNext, playPrevious } = usePlayerStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>(['auto']);
  const [showControls, setShowControls] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Detectar mudanças no fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      // Manter controles visíveis em fullscreen
      if (isNowFullscreen) {
        setShowControls(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!player) return;

    const iframe = player.getIframe();
    if (!iframe) return;

    // Segurança: garante permissões do iframe
    try {
      iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('playsinline', '1');
    } catch {}

    const wrapper = document.getElementById('youtube-player') as HTMLElement | null;
    const globalContainer = document.getElementById('youtube-player-container') as HTMLElement | null;

    const updateSize = () => {
      if (!videoContainerRef.current) return;
      const rect = videoContainerRef.current.getBoundingClientRect();
      try {
        (player as any).setSize?.(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      } catch {}
      iframe.setAttribute('width', String(Math.max(1, Math.floor(rect.width))));
      iframe.setAttribute('height', String(Math.max(1, Math.floor(rect.height))));
    };

    const rafResize = () => {
      updateSize();
      requestAnimationFrame(() => {
        updateSize();
        setTimeout(updateSize, 60);
      });
    };

    if (showVideo && videoContainerRef.current) {
      // Define qualidade para Full HD quando vídeo é aberto
      try {
        const availableQualities = player.getAvailableQualityLevels?.() || [];
        setAvailableQualities(['auto', ...availableQualities]);
        
        // Tenta definir para hd1080, se não disponível usa a melhor qualidade
        if (availableQualities.includes('hd1080')) {
          (player as any).setPlaybackQuality?.('hd1080');
          setQuality('hd1080');
        } else if (availableQualities.includes('hd720')) {
          (player as any).setPlaybackQuality?.('hd720');
          setQuality('hd720');
        } else if (availableQualities.length > 0) {
          (player as any).setPlaybackQuality?.(availableQualities[0]);
          setQuality(availableQualities[0]);
        }
      } catch (e) {
        console.log('Não foi possível definir qualidade do vídeo');
      }
      const container = videoContainerRef.current;
      console.debug('[VideoDialog] open: container, wrapper, iframe', container, wrapper, iframe);

      const safeAppend = (el: HTMLElement) => {
        if (
          el.parentElement !== container &&
          !container.contains(el) &&
          !el.contains(container)
        ) {
          container.appendChild(el);
        }
      };

      // Preferimos mover o wrapper; se não existir, movemos o iframe
      if (wrapper) {
        safeAppend(wrapper);
        Object.assign(wrapper.style, {
          position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
          display: 'block', pointerEvents: 'auto', zIndex: '10', background: 'transparent',
        });
      } else {
        safeAppend(iframe);
      }

      Object.assign(iframe.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        minHeight: '0', display: 'block', zIndex: '10',
        visibility: 'visible', opacity: '1',
      });

      console.log('🎬 [VideoDialog] Estado ao abrir:', {
        hasPlayer: !!player,
        hasCurrentTrack: !!currentTrack,
        videoId: currentTrack?.videoId,
        containerSize: videoContainerRef.current?.getBoundingClientRect()
      });

      try {
        const qualities = (player as any).getAvailableQualityLevels?.();
        if (qualities && qualities.length > 0) {
          setAvailableQualities(['auto', ...qualities]);
        }
      } catch (e) {
        console.log('Could not get quality levels');
      }

      rafResize();
      window.addEventListener('resize', rafResize);

      // Forçar composição GPU e repintura explícita
      const iframe_el = wrapper?.querySelector('iframe') || iframe;
      if (iframe_el) {
        Object.assign(iframe_el.style, {
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        });

        // Repaint explícito: força reflow do navegador
        iframe_el.style.display = 'none';
        void iframe_el.offsetHeight;
        iframe_el.style.display = 'block';
      }

      // Múltiplos resize para garantir dimensões corretas
      rafResize();
      requestAnimationFrame(() => rafResize());
      setTimeout(rafResize, 120);

      // Força recarga do vídeo nas novas dimensões
      if (currentTrack?.videoId) {
        try {
          const t = typeof (player as any).getCurrentTime === 'function' ? (player as any).getCurrentTime() : 0;
          console.log('🎬 [VideoDialog] Recarregando vídeo:', currentTrack.videoId, 'from', t);
          player.loadVideoById(currentTrack.videoId, t);
          // Aguarda um frame antes de dar play
          requestAnimationFrame(() => {
            try { player.playVideo?.(); } catch {}
          });
          // Pequeno seek para forçar redraw
          setTimeout(() => {
            try { player.seekTo(Math.max(0, t + 0.001), true); } catch {}
          }, 300);
        } catch (e) {
          console.error('❌ Erro ao recarregar vídeo:', e);
        }
      } else {
        try { player.playVideo?.(); } catch {}
      }
    } else {
      // Devolve ao container global (se existir)
      if (globalContainer) {
        const target = wrapper ?? iframe;
        if (
          target.parentElement !== globalContainer &&
          !globalContainer.contains(target) &&
          !target.contains(globalContainer)
        ) {
          globalContainer.appendChild(target);
        }
        // Recolhe global
        Object.assign(globalContainer.style, {
          position: 'fixed', left: '-9999px', top: '-9999px', width: '1px', height: '1px',
          pointerEvents: 'none', zIndex: '0',
        });
      }

      try { (player as any).setSize?.(1, 1); } catch {}
      window.removeEventListener('resize', updateSize);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
    }
  }, [showVideo, player]);

  // Update progress
  useEffect(() => {
    if (!player || !showVideo) return;

    const interval = setInterval(() => {
      try {
        const current = player.getCurrentTime();
        const total = player.getDuration();
        setCurrentTime(current);
        setDuration(total);
      } catch (e) {
        console.log('Could not get player time');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, showVideo]);

  // Auto-hide controls (mas não em fullscreen)
  useEffect(() => {
    if (!showVideo) return;

    const resetTimeout = () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      setShowControls(true);
      // Não esconder controles se estiver em fullscreen
      if (!isFullscreen) {
        hideControlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }, 3000);
      }
    };

    resetTimeout();

    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [showVideo, isPlaying, isFullscreen]);

  const toggleFullscreen = async () => {
    if (!player) return;
    const iframe = player.getIframe();
    if (!iframe) return;

    try {
      if (!document.fullscreenElement) {
        if (iframe.requestFullscreen) {
          await iframe.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.warn('[VideoDialog] Fullscreen toggle failed:', e);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!player || !duration) return;
    const newTime = (value[0] / 100) * duration;
    player.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(volume || 50);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleQualityChange = (newQuality: string) => {
    if (!player) return;
    setQuality(newQuality);
    try {
      if (newQuality === 'auto') {
        (player as any).setPlaybackQuality?.('default');
      } else {
        (player as any).setPlaybackQuality?.(newQuality);
      }
    } catch (e) {
      console.log('Could not change quality');
    }
  };

  const skip = (seconds: number) => {
    if (!player) return;
    const newTime = currentTime + seconds;
    player.seekTo(Math.max(0, Math.min(newTime, duration)), true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Dialog open={showVideo} onOpenChange={setShowVideo}>
      <DialogContent className="max-w-6xl w-full p-0 pb-24 md:pb-28 bg-black border-border/50 overflow-hidden inset-0 left-0 top-0 m-auto transform-none">
        <div 
          className="relative w-full"
          onMouseMove={() => {
            setShowControls(true);
            if (hideControlsTimeoutRef.current) {
              clearTimeout(hideControlsTimeoutRef.current);
            }
            if (isPlaying) {
              hideControlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
            }
          }}
        >
          {/* Header */}
          <DialogHeader 
            className={`absolute top-0 left-0 right-0 z-20 flex flex-row items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <DialogTitle className="text-white text-lg">
              {currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : 'Reproduzindo vídeo'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </DialogHeader>
          
          {/* Hidden description for a11y */}
          <p id="video-dialog-desc" className="sr-only">Player de vídeo com controles de reprodução, volume e qualidade.</p>
          
          {/* Video Container */}
        <div
          ref={videoContainerRef}
          className="relative aspect-video w-full min-h-[300px] md:min-h-[500px] bg-black flex items-center justify-center overflow-hidden"
            aria-describedby="video-dialog-desc"
          >
            {!currentTrack && (
              <p className="text-white/70">Nenhum vídeo carregado</p>
            )}
          </div>

          {/* Controls */}
          <div 
            className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${
              showControls || isFullscreen ? 'opacity-100' : 'opacity-0'
            } ${isFullscreen ? 'p-6' : 'p-4'}`}
          >
            {/* Progress Bar */}
            <div className={isFullscreen ? 'mb-6' : 'mb-4'}>
              <Slider
                value={[progressPercent]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="cursor-pointer"
              />
              <div className={`flex justify-between text-white/70 mt-1 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Left Controls */}
              <div className={`flex items-center ${isFullscreen ? 'gap-3' : 'gap-2'}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playPrevious}
                  className={`text-white hover:bg-white/20 ${isFullscreen ? 'h-12 w-12' : 'h-9 w-9'}`}
                >
                  <SkipBack className={isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(-10)}
                  className={`text-white hover:bg-white/20 ${isFullscreen ? 'h-12 w-12' : 'h-9 w-9'}`}
                >
                  <Rewind className={isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} />
                </Button>

                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlay}
                  className={`bg-white text-black hover:bg-white/90 ${isFullscreen ? 'h-16 w-16' : 'h-12 w-12'}`}
                >
                  {isPlaying ? <Pause className={isFullscreen ? 'h-8 w-8' : 'h-6 w-6'} /> : <Play className={`${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'} ml-0.5`} />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(10)}
                  className={`text-white hover:bg-white/20 ${isFullscreen ? 'h-12 w-12' : 'h-9 w-9'}`}
                >
                  <FastForward className={isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  className={`text-white hover:bg-white/20 ${isFullscreen ? 'h-12 w-12' : 'h-9 w-9'}`}
                >
                  <SkipForward className={isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} />
                </Button>
              </div>

              {/* Right Controls */}
              <div className={`flex items-center ${isFullscreen ? 'gap-4' : 'gap-3'}`}>
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className={`text-white hover:bg-white/20 ${isFullscreen ? 'h-12 w-12' : 'h-9 w-9'}`}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className={isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} />
                    ) : (
                      <Volume2 className={isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} />
                    )}
                  </Button>
                  <div className={isFullscreen ? 'w-32' : 'w-24'}>
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quality Settings */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-white hover:bg-white/20 ${isFullscreen ? 'h-12 w-12' : 'h-9 w-9'}`}
                    >
                      <Settings className={isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Qualidade</h4>
                      <Select value={quality} onValueChange={handleQualityChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableQualities.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q === 'auto' ? 'Automática' : q.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
