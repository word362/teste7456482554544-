import { Home, Search, Music, User, Menu, X, Heart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Home", icon: Home, path: "/" },
  { title: "Buscar", icon: Search, path: "/search" },
  { title: "Favoritos", icon: Heart, path: "/favorites" },
  { title: "Suas Playlists", icon: Music, path: "/playlists" },
  { title: "Perfil", icon: User, path: "/profile" },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-6 flex flex-col z-40
          transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="mb-8 mt-12 md:mt-0">
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <Music className="h-8 w-8" />
            MusicStream
          </h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              activeClassName="text-foreground bg-muted font-semibold"
              onClick={closeMobileMenu}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © 2025 MusicStream
          </p>
        </div>
      </aside>
    </>
  );
}
