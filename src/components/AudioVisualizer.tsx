import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Pause } from 'lucide-react';
import { usePlayerStore } from '@/lib/playerStore';

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  const { player, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (!player || !isPlaying || !isActive) return;

    const setupAudioContext = async () => {
      try {
        // Criar contexto de áudio se não existir
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;

        // Criar analyser se não existir
        if (!analyserRef.current) {
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
        }

        // Tentar conectar ao elemento de áudio do YouTube
        const iframe = player.getIframe();
        if (iframe) {
          // Nota: Por limitações do YouTube API, vamos criar visualização simulada
          // baseada no estado de reprodução
          startVisualization();
        }
      } catch (error) {
        console.error('Erro ao configurar visualizador:', error);
      }
    };

    setupAudioContext();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [player, isPlaying, isActive]);

  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 64; // Número de barras
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;

      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Limpar canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Gerar dados simulados baseados em ondas senoidais
      const time = Date.now() / 1000;
      for (let i = 0; i < bufferLength; i++) {
        const wave1 = Math.sin(time * 2 + i * 0.1) * 50 + 128;
        const wave2 = Math.sin(time * 3 + i * 0.15) * 30 + 128;
        const wave3 = Math.sin(time * 1.5 + i * 0.05) * 40 + 128;
        dataArray[i] = (wave1 + wave2 + wave3) / 3;
      }

      const barWidth = width / bufferLength;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        // Criar gradiente para cada barra
        const gradient = ctx.createLinearGradient(x, y, x, height);
        const hue = (i / bufferLength) * 360;
        gradient.addColorStop(0, `hsla(${hue}, 82%, 42%, 0.9)`);
        gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 95%, 65%, 0.7)`);
        gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 85%, 60%, 0.5)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);

        // Adicionar brilho no topo
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${dataArray[i] / 255})`;
        ctx.fillRect(x, y, barWidth - 2, 3);
      }
    };

    draw();
  };

  const toggleVisualizer = () => {
    setIsActive(!isActive);
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50 shadow-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-equalizer opacity-5 animate-[float_10s_ease-in-out_infinite] pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center shadow-glow-accent animate-[glow-pulse_3s_ease-in-out_infinite]">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              Visualizador de Áudio
            </h3>
            <p className="text-xs text-muted-foreground">Análise de frequências em tempo real</p>
          </div>
        </div>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={toggleVisualizer}
          className="relative z-10"
        >
          {isActive ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Ativar
            </>
          )}
        </Button>
      </div>

      <div className="relative z-10 bg-background/30 rounded-lg p-4 backdrop-blur-sm">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-[200px] md:h-[300px] rounded-lg"
          style={{ imageRendering: 'crisp-edges' }}
        />
        
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-background/60 rounded-lg">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Clique em "Ativar" para visualizar o áudio
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/30 rounded-lg backdrop-blur-sm relative z-10">
        <p className="text-xs text-muted-foreground text-center">
          <span className="text-blue-400 font-semibold">💡 Nota:</span> Visualização simulada baseada em padrões de onda. 
          Para análise real de frequências do YouTube, seria necessário acesso direto ao stream de áudio.
        </p>
      </div>
    </Card>
  );
}
