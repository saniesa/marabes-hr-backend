import React, { createContext, useContext, useState, ReactNode } from "react";
import en from "../locales/en.json";
import fr from "../locales/fr.json";

type Language = "en" | "fr";
const translations: Record<Language, any> = { en, fr };

interface LanguageContextType {
  lang: Language;
  switchLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>(null!);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Get saved language from localStorage, or default to English
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem("marabes_lang") as Language) || "en"
  );

  const switchLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("marabes_lang", newLang);
  };

  // The "t" function: Safe translation (if key is missing, return the key itself)
  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);