import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeColor = "spotify" | "ocean" | "sunset" | "forest" | "purple" | "rose";

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    const savedTheme = localStorage.getItem("musicstream-theme");
    return (savedTheme as ThemeColor) || "spotify";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("musicstream-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
};

export const themes = {
  spotify: {
    name: "Spotify Green",
    primary: "141 76% 48%",
    description: "Tema clássico inspirado no Spotify",
  },
  ocean: {
    name: "Ocean Blue",
    primary: "199 89% 48%",
    description: "Azul oceano refrescante",
  },
  sunset: {
    name: "Sunset Orange",
    primary: "25 95% 53%",
    description: "Laranja vibrante do pôr do sol",
  },
  forest: {
    name: "Forest Green",
    primary: "142 71% 45%",
    description: "Verde floresta natural",
  },
  purple: {
    name: "Royal Purple",
    primary: "271 81% 56%",
    description: "Roxo real elegante",
  },
  rose: {
    name: "Rose Pink",
    primary: "330 81% 60%",
    description: "Rosa suave e moderno",
  },
};
