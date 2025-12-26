import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Employee } from "./types";
import * as api from "./services/api";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Employees from "./pages/employees/Employees";
import TimeOff from "./pages/TimeOff";
import Evaluations from "./pages/Evaluations";
import Courses from "./pages/Courses";
import Layout from "./components/Layout";
import Profile from "./pages/employees/Profile";
import Reports from "./pages/Reports";
import Settings from "./pages/settings/Settings";
import ActivityLog from "./pages/activities/ActivityLog";
import { ThemeProvider } from "./context/ThemeContext"; 
import { LanguageProvider } from "./context/LanguageContext"; // 1. Import Provider
import { Toaster } from 'react-hot-toast'; 
import Payroll from './pages/Payroll';

// ... (AuthContext and AuthProvider remain exactly as they were) ...
interface AuthContextType {
  user: Employee | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const initAuth = async () => {
    const token = localStorage.getItem("marabes_token");
    if (token) {
      try {
        // 1. Fetch latest data from the database
        const latestUser = await api.getMe(); 
        setUser(latestUser);
      } catch (err) {
        console.error("Auth init failed", err);
        logout();
      }
    }
    // 2. Use the correct name here (setIsLoading)
    setIsLoading(false); 
  };
  initAuth();
}, []);

 const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      localStorage.setItem("marabes_user", JSON.stringify(response.user));
      localStorage.setItem("marabes_token", response.token);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("marabes_user");
    localStorage.removeItem("marabes_token");
    api.logout();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="flex h-screen items-center justify-center text-mint-600">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider> {/* 2. Wrap here */}
        <AuthProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="profile" element={<Profile />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="employees" element={<Employees />} />
                <Route path="timeoff" element={<TimeOff />} />
                <Route path="evaluations" element={<Evaluations />} />
                <Route path="courses" element={<Courses />} />
                <Route path="reports" element={<Reports />} />
                <Route path="payroll" element={<Payroll />} />
                <Route path="settings" element={<Settings />} />
                <Route path="activity" element={<ActivityLog />} />
              </Route>
            </Routes>
          </HashRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;