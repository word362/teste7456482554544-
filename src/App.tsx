import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { PlayerBar } from "@/components/PlayerBar";
import { LyricsPanel } from "@/components/LyricsPanel";
import { VideoDialog } from "@/components/VideoDialog";
import { FloatingParticles } from "@/components/FloatingParticles";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Playlists from "./pages/Playlists";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Discover from "./pages/Discover";
import Artist from "./pages/Artist";
import { Suspense, useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { ThemeProvider } from "@/contexts/ThemeContext";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex min-h-screen w-full bg-background relative">
                    {/* Floating Particles Background */}
                    <FloatingParticles />
                    
                    {/* Container global para o YouTube Player */}
                    <div id="youtube-player-container" className="fixed pointer-events-none" style={{ left: '-9999px', top: '-9999px' }} />
                    
                    <Navbar />
                    <main className="flex-1 md:ml-64 mb-28 md:mb-24 p-3 md:p-8 relative z-10">
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-screen">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Carregando...</p>
                          </div>
                        </div>
                      }>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/search" element={<Search />} />
                          <Route path="/favorites" element={<Favorites />} />
                          <Route path="/playlists" element={<Playlists />} />
                          <Route path="/discover" element={<Discover />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/artist/:artistName" element={<Artist />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </main>
                    <PlayerBar />
                    <LyricsPanel />
                    <VideoDialog />
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
