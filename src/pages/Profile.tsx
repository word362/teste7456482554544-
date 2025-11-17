import { Camera, LogOut, Mail, Heart, Music, History, Shield, Calendar, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme, themes } from "@/contexts/ThemeContext";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { favoritos: 0, playlists: 0, historico: 0 };
      
      const [favoritosRes, playlistsRes, historicoRes] = await Promise.all([
        supabase.from("favoritos").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("playlists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("historico_escuta").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      ]);

      return {
        favoritos: favoritosRes.count || 0,
        playlists: playlistsRes.count || 0,
        historico: historicoRes.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (avatarUrl: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Foto atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar foto");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      await updateProfile.mutateAsync(publicUrl);
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error(error?.message || "Erro ao fazer upload da foto");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="space-y-6 pb-32">
      {/* Hero Header com Gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 md:p-12 border border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full opacity-75 group-hover:opacity-100 transition duration-300 blur"></div>
            <Avatar className="relative h-32 w-32 md:h-40 md:w-40 ring-4 ring-background">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                {getInitials(profile?.full_name || user?.email)}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-10 w-10 text-white" />
            </label>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{profile?.full_name || "Usuário"}</h1>
            <div className="flex flex-col md:flex-row items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <p className="text-sm">{user?.email}</p>
              </div>
              {memberSince && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <p className="text-sm">Membro desde {memberSince}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estatísticas do Usuário */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Suas Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all">
                <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats?.favoritos || 0}</p>
                <p className="text-xs text-muted-foreground">Favoritos</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all">
                <Music className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats?.playlists || 0}</p>
                <p className="text-xs text-muted-foreground">Playlists</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all">
                <History className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats?.historico || 0}</p>
                <p className="text-xs text-muted-foreground">Ouvidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Conta */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome Completo</Label>
              <Input
                value={profile?.full_name || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tema de Cores */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Personalizar Tema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(themes).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key as any);
                    toast.success(`Tema ${value.name} aplicado!`);
                  }}
                  className={`group relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    theme === key 
                      ? "border-primary shadow-lg shadow-primary/20" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div 
                    className="w-full h-16 rounded-lg mb-3 transition-transform group-hover:scale-110"
                    style={{ 
                      background: `hsl(${value.primary})`,
                      boxShadow: `0 4px 14px hsla(${value.primary}, 0.4)`
                    }}
                  />
                  <h3 className="font-semibold text-sm mb-1">{value.name}</h3>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                  {theme === key && (
                    <Badge className="absolute top-2 right-2 text-xs">Ativo</Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Segurança e Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={async () => {
                  if (!user?.email) {
                    toast.error("Email não encontrado");
                    return;
                  }
                  
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                      redirectTo: `${window.location.origin}/`,
                    });
                    
                    if (error) throw error;
                    
                    toast.success("Email de redefinição enviado! Verifique sua caixa de entrada.");
                  } catch (error: any) {
                    toast.error(error?.message || "Erro ao enviar email");
                  }
                }}
                className="flex-1 gap-2"
              >
                <Shield className="w-4 h-4" />
                Redefinir Senha
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={signOut} 
                className="flex-1 gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
