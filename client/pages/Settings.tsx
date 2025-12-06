import React, { useState } from "react";
import { useAuth } from "../App";
import {
  Shield,
  Bell,
  Palette,
  Database,
  Globe,
  Lock,
  Save,
} from "lucide-react";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    marketingEmails: false,
    theme: "light",
    language: "en",
    timezone: "UTC",
    autoLogout: "30",
    twoFactor: false,
    dataSharing: false,
  });
  const [message, setMessage] = useState("");

  const handleSave = () => {
    localStorage.setItem("app_settings", JSON.stringify(settings));
    setMessage("Settings saved successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const SettingSection = ({ title, icon, children }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const ToggleSetting = ({ label, description, checked, onChange }: any) => (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="font-medium text-gray-800">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? "bg-mint-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );

  const SelectSetting = ({ label, value, onChange, options }: any) => (
    <div className="flex items-center justify-between">
      <label className="font-medium text-gray-800">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-mint-500 outline-none"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        {message && (
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            {message}
          </div>
        )}
      </div>

      {/* Notifications Settings */}
      <SettingSection
        title="Notifications"
        icon={<Bell className="text-mint-600" size={20} />}
      >
        <ToggleSetting
          label="Email Notifications"
          description="Receive notifications via email"
          checked={settings.emailNotifications}
          onChange={(val: boolean) =>
            setSettings({ ...settings, emailNotifications: val })
          }
        />
        <ToggleSetting
          label="Push Notifications"
          description="Receive push notifications in browser"
          checked={settings.pushNotifications}
          onChange={(val: boolean) =>
            setSettings({ ...settings, pushNotifications: val })
          }
        />
        <ToggleSetting
          label="Weekly Reports"
          description="Get weekly summary reports"
          checked={settings.weeklyReports}
          onChange={(val: boolean) =>
            setSettings({ ...settings, weeklyReports: val })
          }
        />
        <ToggleSetting
          label="Marketing Emails"
          description="Receive promotional content"
          checked={settings.marketingEmails}
          onChange={(val: boolean) =>
            setSettings({ ...settings, marketingEmails: val })
          }
        />
      </SettingSection>

      {/* Appearance Settings */}
      <SettingSection
        title="Appearance"
        icon={<Palette className="text-mint-600" size={20} />}
      >
        <SelectSetting
          label="Theme"
          value={settings.theme}
          onChange={(val: string) => setSettings({ ...settings, theme: val })}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "auto", label: "Auto" },
          ]}
        />
        <SelectSetting
          label="Language"
          value={settings.language}
          onChange={(val: string) =>
            setSettings({ ...settings, language: val })
          }
          options={[
            { value: "en", label: "English" },
            { value: "es", label: "Español" },
            { value: "fr", label: "Français" },
            { value: "ar", label: "العربية" },
          ]}
        />
      </SettingSection>

      {/* Regional Settings */}
      <SettingSection
        title="Regional"
        icon={<Globe className="text-mint-600" size={20} />}
      >
        <SelectSetting
          label="Timezone"
          value={settings.timezone}
          onChange={(val: string) =>
            setSettings({ ...settings, timezone: val })
          }
          options={[
            { value: "UTC", label: "UTC" },
            { value: "America/New_York", label: "Eastern Time" },
            { value: "America/Chicago", label: "Central Time" },
            { value: "America/Los_Angeles", label: "Pacific Time" },
            { value: "Europe/London", label: "London" },
            { value: "Europe/Paris", label: "Paris" },
            { value: "Asia/Tokyo", label: "Tokyo" },
          ]}
        />
      </SettingSection>

      {/* Security Settings */}
      <SettingSection
        title="Security & Privacy"
        icon={<Lock className="text-mint-600" size={20} />}
      >
        <ToggleSetting
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          checked={settings.twoFactor}
          onChange={(val: boolean) =>
            setSettings({ ...settings, twoFactor: val })
          }
        />
        <SelectSetting
          label="Auto Logout"
          value={settings.autoLogout}
          onChange={(val: string) =>
            setSettings({ ...settings, autoLogout: val })
          }
          options={[
            { value: "15", label: "15 minutes" },
            { value: "30", label: "30 minutes" },
            { value: "60", label: "1 hour" },
            { value: "120", label: "2 hours" },
            { value: "never", label: "Never" },
          ]}
        />
        <ToggleSetting
          label="Data Sharing"
          description="Share anonymous usage data to improve the platform"
          checked={settings.dataSharing}
          onChange={(val: boolean) =>
            setSettings({ ...settings, dataSharing: val })
          }
        />
        <div className="pt-4 border-t border-gray-200">
          <button className="text-sm text-red-600 hover:text-red-700 font-medium">
            Change Password
          </button>
        </div>
      </SettingSection>

      {/* Data Management */}
      {user?.role === "ADMIN" && (
        <SettingSection
          title="Data Management"
          icon={<Database className="text-mint-600" size={20} />}
        >
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-left">
              Export All Data (CSV)
            </button>
            <button className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-left">
              Backup Database
            </button>
            <button className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-left">
              Clear All Notifications
            </button>
          </div>
        </SettingSection>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
        >
          <Save size={18} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
