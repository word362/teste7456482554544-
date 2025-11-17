import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Music, Sparkles, Radio, Headphones, Mail, Lock, User, ArrowRight, Shield } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  if (user) {
    navigate("/");
    return null;
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("signup-email") as string)?.trim();
    const password = formData.get("signup-password") as string;
    const fullName = (formData.get("fullName") as string)?.trim();

    if (!email || !email.includes("@")) {
      toast.error("Email inválido");
      setLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      setLoading(false);
      return;
    }
    if (!fullName || fullName.length < 2) {
      toast.error("Nome deve ter no mínimo 2 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email já está cadastrado");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Conta criada com sucesso! Você já pode fazer login.");
      }
    } catch (err) {
      toast.error("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Digite seu email");
      return;
    }

    if (!resetEmail.includes("@")) {
      toast.error("Email inválido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("signin-email") as string)?.trim();
    const password = formData.get("signin-password") as string;

    if (!email || !email.includes("@")) {
      toast.error("Email inválido");
      setLoading(false);
      return;
    }
    if (!password) {
      toast.error("Senha é obrigatória");
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error(error.message);
        }
      }
    } catch (err) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 py-8 bg-gradient-to-br from-background via-background to-primary/5">
      <FloatingParticles />

      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Coluna esquerda - Oculta em mobile */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                <Music className="h-8 w-8 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  MusicStreamPro
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Sua música, seu jeito
                </p>
              </div>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Descubra sua
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                próxima música favorita
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Milhões de músicas ao seu alcance. Playlists personalizadas. Experiência premium.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="group relative p-6 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-hover overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Radio className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Streaming Ilimitado</h3>
                  <p className="text-sm text-muted-foreground">Milhões de músicas disponíveis</p>
                </div>
              </div>
            </div>

            <div className="group relative p-6 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 hover:border-secondary/50 transition-all duration-300 hover:shadow-hover overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Headphones className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Qualidade Premium</h3>
                  <p className="text-sm text-muted-foreground">Áudio de alta qualidade</p>
                </div>
              </div>
            </div>

            <div className="group relative p-6 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-hover overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Playlists Inteligentes</h3>
                  <p className="text-sm text-muted-foreground">Recomendações personalizadas</p>
                </div>
              </div>
            </div>

            <div className="group relative p-6 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-hover overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">100% Seguro</h3>
                  <p className="text-sm text-muted-foreground">Seus dados protegidos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="w-full max-w-md mx-auto animate-scale-in">
          {/* Logo mobile - Visível apenas em telas pequenas */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="relative w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Music className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              MusicStreamPro
            </h1>
          </div>

          <Card className="border border-border/50 shadow-2xl bg-card/80 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-20 blur-2xl transition-opacity pointer-events-none"></div>
            
            <CardHeader className="space-y-2 text-center pb-4 lg:pb-6">
              <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Bem-vindo
              </CardTitle>
              <CardDescription className="text-sm lg:text-base text-muted-foreground">
                Entre ou crie sua conta
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 lg:space-y-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 lg:mb-8 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger 
                    value="signin"
                    className="rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    Criar Conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium text-foreground">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          name="signin-email"
                          type="email"
                          placeholder="seu@email.com"
                          required
                          disabled={loading}
                          className="pl-11 h-11 lg:h-12 bg-background/50 border-border/50 focus:border-primary transition-all rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium text-foreground">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          name="signin-password"
                          type="password"
                          placeholder="••••••••"
                          required
                          disabled={loading}
                          className="pl-11 h-11 lg:h-12 bg-background/50 border-border/50 focus:border-primary transition-all rounded-xl"
                        />
                      </div>
                    </div>

                    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="px-0 text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          Esqueceu sua senha?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Recuperar Senha</DialogTitle>
                          <DialogDescription>
                            Digite seu email e enviaremos um link para redefinir sua senha.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="reset-email"
                                type="email"
                                placeholder="seu@email.com"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <Button 
                            onClick={handlePasswordReset} 
                            disabled={loading}
                            className="w-full bg-gradient-primary hover:shadow-glow"
                          >
                            {loading ? "Enviando..." : "Enviar link de recuperação"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 lg:h-12 bg-gradient-primary hover:shadow-glow transition-all text-sm lg:text-base font-semibold rounded-xl group" 
                      disabled={loading}
                    >
                      {loading ? "Entrando..." : "Entrar"}
                      <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                        Nome completo
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="João Silva"
                          required
                          disabled={loading}
                          className="pl-11 h-11 lg:h-12 bg-background/50 border-border/50 focus:border-primary transition-all rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          required
                          disabled={loading}
                          className="pl-11 h-11 lg:h-12 bg-background/50 border-border/50 focus:border-primary transition-all rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="signup-password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          required
                          disabled={loading}
                          className="pl-11 h-11 lg:h-12 bg-background/50 border-border/50 focus:border-primary transition-all rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 lg:h-12 bg-gradient-primary hover:shadow-glow transition-all text-sm lg:text-base font-semibold rounded-xl group" 
                      disabled={loading}
                    >
                      {loading ? "Criando conta..." : "Criar Conta Grátis"}
                      <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Ao criar uma conta, você concorda com nossos{" "}
                      <span className="text-primary hover:underline cursor-pointer">Termos de Serviço</span>
                      {" "}e{" "}
                      <span className="text-primary hover:underline cursor-pointer">Política de Privacidade</span>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
