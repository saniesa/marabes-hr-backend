// import { createContext, useContext, useState, ReactNode } from 'react';

// type Theme = 'light' | 'dark';
// const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
//   theme: 'light',
//   toggleTheme: () => {},
// });

// export const useUserTheme = () => {
//   return useContext(ThemeContext).theme;
// };

// export const ThemeProvider = ({ children }: { children: ReactNode }) => {
//   const [theme, setTheme] = useState<Theme>('light');

//   const toggleTheme = () => {
//     setTheme(theme === 'light' ? 'dark' : 'light');
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };
