import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../App";
import axios from "axios"; // Ensure axios is used, or fetch with full URL

interface Notification {
  id: number;
  message: string;
  isRead: number;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // FIX: Use the correct API URL with /api prefix
  const API_URL = "http://localhost:5000/api";

  const loadNotifications = async () => {
    if (!user) return;
    try {
      // THE FIX IS HERE: Added /api
      const res = await axios.get(`${API_URL}/notifications/${user.id}`);
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      // THE FIX IS HERE: Added /api
      await axios.put(`${API_URL}/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Optional: Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 text-sm">Notifications</h3>
            <button onClick={loadNotifications} className="text-xs text-mint-600 hover:underline">Refresh</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;