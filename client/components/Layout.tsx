import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Settings,
  BarChart3,
  Settings as SettingsIcon,
  Activity,
} from "lucide-react";
import NotificationBell from "./NotificationBell";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      allowed: ["ADMIN", "EMPLOYEE"],
    },
    {
      name: "Employees",
      path: "/employees",
      icon: <Users size={20} />,
      allowed: ["ADMIN"],
    }, // Admin only usually
    {
      name: "Time Off",
      path: "/time-off",
      icon: <Calendar size={20} />,
      allowed: ["ADMIN", "EMPLOYEE"],
    },
    {
      name: "Evaluations",
      path: "/evaluations",
      icon: <ClipboardCheck size={20} />,
      allowed: ["ADMIN", "EMPLOYEE"],
    },
    {
      name: "Training",
      path: "/courses",
      icon: <GraduationCap size={20} />,
      allowed: ["ADMIN", "EMPLOYEE"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <BarChart3 size={20} />,
      allowed: ["ADMIN"],
    },

    {
      name: "Profile",
      path: "/profile",
      icon: <Settings size={20} />,
      allowed: ["ADMIN", "EMPLOYEE"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <SettingsIcon size={20} />,
      allowed: ["ADMIN", "EMPLOYEE"],
    },
    {
      name: "Activity",
      path: "/activity",
      icon: <Activity size={20} />,
      allowed: ["ADMIN"],
    },
  ];

  return (
    <div className="flex h-screen bg-mint-50">
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-mint-600 text-white">
          <span className="text-xl font-bold tracking-wider">MARABES HR</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-4rem)] justify-between">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems
              .filter((item) => item.allowed.includes(user?.role || ""))
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-mint-100 text-mint-800 border-r-4 border-mint-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-mint-600"
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4 px-4">
              <img
                src={user?.avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-mint-200"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 rounded-lg"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-600"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-mint-600">MARABES HR</span>
          <NotificationBell />
        </header>
        <header className="hidden md:flex items-center justify-end bg-white px-8 py-4 shadow-sm border-b border-gray-100">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
