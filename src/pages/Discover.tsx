import { TopTracks } from '@/components/TopTracks';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { TrendingUp, Sparkles } from 'lucide-react';

export default function Discover() {
  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-mesh opacity-20 blur-3xl rounded-full" />
        <div className="relative bg-gradient-glass backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-primary/20 shadow-glow">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-3 md:mb-4 flex items-center gap-3 md:gap-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-neon-glow">
            <Sparkles className="h-8 w-8 md:h-12 md:w-12 text-primary animate-glow-pulse" />
            Descobrir Músicas
          </h1>
          <p className="text-base md:text-xl text-muted-foreground animate-fade-in font-medium" style={{ animationDelay: '0.1s' }}>
            As mais tocadas no site e recomendações exclusivas para você 🎵
          </p>
        </div>
      </div>

      <div className="space-y-8 md:space-y-10">
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <TopTracks />
        </div>
        
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <AudioVisualizer />
        </div>
      </div>
    </div>
  );
}
