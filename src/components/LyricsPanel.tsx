import { usePlayerStore } from '@/lib/playerStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Music } from 'lucide-react';

export function LyricsPanel() {
  const { showLyrics, setShowLyrics, lyrics, loadingLyrics, currentTrack } = usePlayerStore();

  return (
    <Sheet open={showLyrics} onOpenChange={setShowLyrics}>
      <SheetContent side="right" className="w-full sm:w-[400px] bg-card/95 backdrop-blur-lg border-border/50">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Letra da Música
          </SheetTitle>
          {currentTrack && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{currentTrack.title}</p>
              <p>{currentTrack.artist}</p>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {loadingLyrics ? (
            <div className="space-y-3 pr-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[88%]" />
            </div>
          ) : lyrics ? (
            <div className="pr-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {lyrics}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Music className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">
                Nenhuma letra disponível
                {currentTrack ? ' para esta música' : ''}
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
