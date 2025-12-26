import React, { useState, useEffect, useRef } from "react"; // Added useRef
import { useAuth } from "../../App";
import * as api from "../../services/api";
import { Employee } from "../../types";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Save,
  Camera,
} from "lucide-react";

const Profile: React.FC = () => {
const { user, setUser } = useAuth(); // Add setUser here
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  // Reference to the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  if (user) {
    setFormData({
      ...user, 
      birthday: user.birthday ? user.birthday.split('T')[0] : "",
    });
  }
}, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);

  try {
    // 1. Only send the fields we are allowed to change
    const profileData = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      avatarUrl: formData.avatarUrl,
      birthday: formData.birthday
    };

    // 2. Call the PARTIAL update API
    const updatedUserPart = await api.updateProfile(user.id, profileData);
    
    // 3. THE FIX: Merge the old user data with the new updates
    // This keeps the Role, JobPosition, and Department alive on the screen!
    const fullUpdatedUser = { ...user, ...updatedUserPart };

    // 4. Update the Sidebar/Dashboard
    if (setUser) setUser(fullUpdatedUser);

    // 5. Save the FULL user to localStorage so it's there on refresh
    localStorage.setItem("marabes_user", JSON.stringify(fullUpdatedUser));
    
    setMessage("Profile saved! All job details preserved.");
    setTimeout(() => setMessage(""), 3000);
  } catch (error) {
    setMessage("Failed to save profile.");
  } finally {
    setIsSaving(false);
  }
};

  // Function to handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage("Uploading image...");
    try {
      // Call your existing uploadFile service
      const uploadedUrl = await api.uploadFile(file);
      
      // Update form data with the new URL from server
      setFormData({
        ...formData,
        avatarUrl: uploadedUrl,
      });
      setMessage("Image uploaded! Save changes to apply.");
    } catch (error) {
      setMessage("Failed to upload image");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
        {message && (
          <div
            className={`px-4 py-2 rounded-lg ${
              message.includes("success") || message.includes("uploaded")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-mint-500 to-teal-600 h-32"></div>

        <div className="px-8 pb-8">
          {/* Avatar Section */}
          <div className="flex items-end -mt-16 mb-6">
            <div className="relative">
              <img
                src={formData.avatarUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()} // Triggers the hidden input
                className="absolute bottom-0 right-0 p-2 bg-mint-600 text-white rounded-full hover:bg-mint-700 shadow-lg"
              >
                <Camera size={20} />
              </button>
            </div>
            <div className="ml-6 mb-2">
              <h2 className="text-2xl font-bold text-gray-800">
                {formData.name}
              </h2>
              <p className="text-gray-500">{formData.jobPosition}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  formData.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {formData.role}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-mint-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input-std"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birthday
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="input-std"
                      value={formData.birthday || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, birthday: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Mail size={20} className="text-mint-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      className="input-std"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      className="input-std"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input-std"
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-mint-600" />
                Job Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    className="input-std"
                    value={formData.jobPosition || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, jobPosition: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    className="input-std"
                    value={formData.department || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Date Hired</label>
                   <input 
                         type="date" 
                        className={`input-std ${user?.role !== 'ADMIN' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        value={formData.dateHired ? formData.birthday.split('T')[0] : ""} 
                        // ONLY disabled if NOT an admin
                        disabled={user?.role !== 'ADMIN'} 
                        onChange={(e) => setFormData({ ...formData, dateHired: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase ml-1">Role</label>
                 <select 
                     className={`input-std ${user?.role !== 'ADMIN' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      value={formData.role}
                      disabled={user?.role !== 'ADMIN'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                     >
                   <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="ADMIN">ADMIN</option>
                 </select>
              </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-mint-600 text-white rounded-lg hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .input-std { 
          width: 100%; 
          padding: 0.625rem 0.75rem; 
          border: 1px solid #e5e7eb; 
          border-radius: 0.5rem; 
          outline: none;
          transition: border-color 0.2s;
        }
        .input-std:focus { 
          border-color: #14b8a6; 
          ring: 2px;
          ring-color: #14b8a6;
        }
        .input-std:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Profile;