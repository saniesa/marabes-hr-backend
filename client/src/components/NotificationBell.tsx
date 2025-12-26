import React, { useEffect, useState } from "react";
import { Bell, Trash2, X, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "../App";
import axios from "axios";
import toast from 'react-hot-toast';
import { io } from "socket.io-client";

interface Notification {
  id: number;
  message: string;
  isRead: number;
  type?: string;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false); // ✅ Modal State

  const API_URL = "http://localhost:5000/api";

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("marabes_token");
      const res = await axios.get(`${API_URL}/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error("Sync error", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("marabes_token");
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); 
    try {
      const token = localStorage.getItem("marabes_token");
      await axios.delete(`${API_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notification removed");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  // ✅ Triggered by the "Clear All" button in the menu
  const requestClearAll = () => {
    if (notifications.length > 0) {
      setShowClearConfirm(true); // Open custom modal
    }
  };

  // ✅ Triggered by the "Delete All" button inside the MODAL
  const handleConfirmClearAll = async () => {
    try {
      const token = localStorage.getItem("marabes_token");
      await axios.delete(`${API_URL}/notifications/all/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      toast.success("Inbox cleared successfully");
    } catch (error) {
      toast.error("Could not clear notifications");
    } finally {
      setShowClearConfirm(false); // Close modal
    }
  };

   // Function to show Browser Desktop Notification
  const showDesktopNotification = (message: string) => {
    if (Notification.permission === "granted") {
      new Notification("Marabes HR", {
        body: message,
        icon: "/logo.png" // Path to your logo
      });
    }
  };
  useEffect(() => {
     if (!user) return;

    // 1. Request Browser Notification Permission
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    loadNotifications();
    // 3. Setup Socket.io Connection
    const socket = io("http://localhost:5000");

    // Listen for new notifications for THIS user specifically
    socket.on(`notification_${user.id}`, (newNotif: Notification) => {
      setNotifications(prev => [newNotif, ...prev]);
      
      // Play a sound (optional)
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.play().catch(e => console.log("Audio play blocked"));

      // Show Desktop Popup
      showDesktopNotification(newNotif.message);
      
      // Also show toast
      toast.success(newNotif.message, { icon: '🔔' });
    });
    const interval = setInterval(loadNotifications, 10000);

    return () =>{
      socket.disconnect();
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[1001] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <button 
                onClick={requestClearAll}
                className="text-[11px] text-red-500 hover:text-red-700 font-semibold transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle size={32} className="mx-auto text-gray-200 mb-2"/>
                <p className="text-gray-400 text-xs">All caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`group relative p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={(e) => deleteNotification(e, n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-mint-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ✅ CUSTOM CONFIRMATION MODAL (Replaces Browser Popup) */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[320px] p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clear Inbox?</h3>
              <p className="text-sm text-gray-500 mb-8 px-4 leading-relaxed">
                This will permanently delete all your notifications. This action cannot be undone.
              </p>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleConfirmClearAll}
                  className="w-full py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-2xl transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                  Yes, Clear All
                </button>
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
                >
                  Keep them
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;