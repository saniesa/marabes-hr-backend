import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import * as api from "../services/api";
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Briefcase, ShieldCheck, Save, Camera, 
  Lock, CheckCircle 
} from "lucide-react";

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Local state for the form
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    birthday: user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const updatedUser = { ...user, ...formData };
      await api.updateUser(updatedUser);
      if (setUser) setUser(updatedUser);
      setMessage({ type: "success", text: "Your profile has been updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setMessage({ type: "error", text: "New passwords do not match." });
    }
    setLoading(true);
    try {
      await api.changePassword({
        userId: user?.id,
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Error updating password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* PROFILE HEADER */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-teal-600 to-mint-500"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row justify-between items-end -mt-16 gap-4">
            <div className="relative group self-center md:self-auto">
              <img 
                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name}&background=0D9488&color=fff`} 
                alt="Profile" 
                className="w-36 h-36 rounded-3xl border-8 border-white shadow-xl object-cover"
              />
              <button className="absolute bottom-2 right-2 p-2.5 bg-white rounded-xl shadow-lg text-teal-600 border border-gray-50">
                <Camera size={20}/>
              </button>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-2">
              <button onClick={() => setActiveTab("info")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "info" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Personal Details</button>
              <button onClick={() => setActiveTab("security")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "security" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Security</button>
            </div>
          </div>
          <div className="mt-6 text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900">{user?.name}</h1>
            <p className="text-gray-500 font-bold flex items-center justify-center md:justify-start gap-2 mt-1">
              <Briefcase size={16} className="text-teal-500"/> {user?.jobPosition} • {user?.department}
            </p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {message.type === "success" ? <CheckCircle size={20}/> : <ShieldCheck size={20}/>}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: LOCKED STATS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
              Verified Info
            </h3>
            <div className="space-y-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-black uppercase">System ID</span>
                <span className="text-sm font-bold text-gray-700">#MB-{user?.id?.toString().padStart(4, '0')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-black uppercase">Company Email</span>
                <span className="text-sm font-bold text-teal-600 truncate">{user?.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-black uppercase">Account Role</span>
                <div className="flex mt-1">
                    <span className="text-[10px] font-black bg-teal-50 text-teal-700 px-3 py-1 rounded-md border border-teal-100 uppercase">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: FORMS */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[500px]">
            
            {activeTab === "info" ? (
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                
                {/* CONTACT SECTION */}
                <section className="space-y-6">
                  <div className="pb-2 border-b border-gray-50">
                    <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs">Contact Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Full Name</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm"/>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Birthday</label>
                      <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm"/>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
                      <input disabled type="email" value={user?.email} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-medium text-sm cursor-not-allowed"/>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm"/>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Address</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm"/>
                    </div>
                  </div>
                </section>

                {/* JOB SECTION (READ ONLY) */}
                <section className="space-y-6">
                  <div className="pb-2 border-b border-gray-50">
                    <h2 className="font-black text-gray-800 uppercase tracking-widest text-xs">Job Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Position</label>
                      <input disabled type="text" value={user?.jobPosition} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-medium text-sm cursor-not-allowed"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Department</label>
                      <input disabled type="text" value={user?.department} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-medium text-sm cursor-not-allowed"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Date Hired</label>
                      <input disabled type="text" value={user?.dateHired ? new Date(user.dateHired).toLocaleDateString() : "jj/mm/aaaa"} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-medium text-sm cursor-not-allowed"/>
                    </div>
                  </div>
                </section>

                <div className="pt-4">
                  <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-teal-600 text-white px-10 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all disabled:opacity-50">
                    {loading ? "SAVING..." : "UPDATE PROFILE"}
                  </button>
                </div>
              </form>
            ) : (
              /* SECURITY FORM */
              <form onSubmit={handleChangePassword} className="space-y-8 max-w-md">
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-gray-800">Update Password</h2>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Current Password</label>
                    <input type="password" required value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">New Password</label>
                    <input type="password" required value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Confirm Password</label>
                    <input type="password" required value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"/>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all">
                   {loading ? "PROCESSING..." : "CHANGE PASSWORD"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;