import { Music, Radio } from "lucide-react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 transition-all duration-700 ${
        isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* Ondas animadas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-[ping_2s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-2xl animate-[ping_2.5s_ease-in-out_infinite_0.3s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/30 rounded-full blur-xl animate-[ping_3s_ease-in-out_infinite_0.6s]" />
      </div>

      {/* Partículas flutuantes */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/40 rounded-full animate-[float_3s_ease-in-out_infinite]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Conteúdo central */}
      <div className="relative flex flex-col items-center gap-8 animate-fade-in">
        {/* Ícone principal com múltiplas camadas */}
        <div className="relative">
          {/* Anéis pulsantes */}
          <div className="absolute inset-0 -m-4">
            <div className="w-full h-full border-4 border-primary/30 rounded-full animate-[ping_1.5s_ease-in-out_infinite]" />
          </div>
          <div className="absolute inset-0 -m-8">
            <div className="w-full h-full border-2 border-primary/20 rounded-full animate-[ping_2s_ease-in-out_infinite_0.3s]" />
          </div>
          
          {/* Gradiente de fundo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/80 to-accent blur-2xl opacity-60 rounded-full animate-pulse" />
          
          {/* Ícone central */}
          <div className="relative bg-gradient-to-br from-primary to-accent p-10 rounded-full shadow-2xl backdrop-blur-sm border border-primary/20 animate-[scale-in_0.6s_ease-out]">
            <Music className="w-20 h-20 text-primary-foreground animate-[spin_4s_ease-in-out_infinite]" />
            <Radio className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-primary-foreground/60 animate-pulse" />
          </div>

          {/* Brilho adicional */}
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
        </div>

        {/* Texto com gradiente */}
        <div className="flex flex-col items-center gap-3 animate-[fade-in_0.8s_ease-out_0.3s_both]">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-[fade-in_1s_ease-out]">
            MusicStreamPro
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-[ping_1s_ease-in-out_infinite]" />
            <p className="text-muted-foreground text-sm animate-pulse">
              Carregando sua experiência musical...
            </p>
            <div className="w-2 h-2 bg-primary rounded-full animate-[ping_1s_ease-in-out_infinite_0.3s]" />
          </div>
        </div>

        {/* Barra de progresso animada */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden animate-[fade-in_1s_ease-out_0.6s_both]">
          <div className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
        </div>
      </div>
    </div>
  );
};
