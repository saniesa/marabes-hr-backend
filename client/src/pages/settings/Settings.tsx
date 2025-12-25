import React, { useState, useEffect } from "react";
import { useAuth } from "../../App";
import { 
  Bell, Palette, Globe, Lock, Save, 
  Building2, Banknote, Clock, ShieldCheck, Database 
} from "lucide-react";
import * as api from "../../services/api";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { lang, switchLanguage, t } = useLanguage(); 

  const [settings, setSettings] = useState({
    company_name: "Marabes HR",
    currency: "MAD",
    standard_hours: "8",
    language: "en",
    timezone: "UTC",
    auto_logout: "30"
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      api.getSettings().then(data => {
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
      });
    } else {
        setLoading(false);
    }
  }, [isAdmin]);

  const handleSave = async () => {
    try {
      await api.updateSettings(settings);
      toast.success("System settings updated!");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  const SettingSection = ({ title, icon, children }: any) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        {icon} {title}
      </h3>
      <div className="space-y-6">{children}</div>
    </div>
  );

  if (loading) return <div className="p-20 text-center font-bold text-mint-600">Loading Configuration...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('settings_configuration')}</h1>
           <p className="text-sm text-gray-500">{t('settings_manage_desc')}</p>
        </div>
        {isAdmin && (
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-mint-600 text-white rounded-xl hover:bg-mint-700 shadow-lg shadow-mint-100 transition-all active:scale-95">
               <Save size={18} /> {t('save_all_changes')}
            </button>
        )}
      </div>

      {/* ADMIN ONLY: COMPANY & PAYROLL LOGIC */}
      {isAdmin && (
        <>
          <SettingSection title="Company Profile" icon={<Building2 size={18} className="text-mint-600"/>}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="Company Name" value={settings.company_name} onChange={(v) => setSettings({...settings, company_name: v})} />
                <InputGroup label="Currency Symbol (e.g. MAD, $)" value={settings.currency} onChange={(v) => setSettings({...settings, currency: v})} />
             </div>
          </SettingSection>

          <SettingSection title="Payroll Engine Rules" icon={<Banknote size={18} className="text-mint-600"/>}>
             <div className="flex items-center justify-between p-4 bg-mint-50 rounded-xl border border-mint-100">
                <div className="flex items-center gap-3">
                    <Clock className="text-mint-600" />
                    <div>
                        <p className="font-bold text-gray-800">Standard Work Day</p>
                        {/* <p className="text-xs text-gray-500">The 8-hour workday rule we implemented</p> */}
                    </div>
                </div>
                <select 
                    value={settings.standard_hours} 
                    onChange={e => setSettings({...settings, standard_hours: e.target.value})}
                    className="bg-white border rounded-lg px-3 py-1 font-bold outline-none"
                >
                    <option value="7">7 Hours</option>
                    <option value="8">8 Hours</option>
                    <option value="9">9 Hours</option>
                </select>
             </div>
          </SettingSection>
        </>
      )}

      {/* GLOBAL SETTINGS */}
      <SettingSection title="Localization" icon={<Globe size={18} className="text-mint-600"/>}>
         <div className="grid grid-cols-2 gap-4">
        <SelectGroup 
                    label={t('system_language')} 
                    value={settings.language} 
                    options={[{l:'English', v:'en'}, {l:'French', v:'fr'}]} 
                    onChange={(v: any) => {
                      setSettings({...settings, language: v}); // Keeps your existing DB logic
                      switchLanguage(v);  }} 
/>            <SelectGroup label="Default Timezone" value={settings.timezone} options={[{l:'UTC', v:'UTC'}, {l:'Casablanca', v:'Africa/Casablanca'}]} onChange={v => setSettings({...settings, timezone: v})} />
         </div>
      </SettingSection>

      {/* SECURITY */}
      <SettingSection title="Security" icon={<ShieldCheck size={18} className="text-mint-600"/>}>
        <div className="flex justify-between items-center">
            <div>
                <p className="font-bold text-gray-800">Account Password</p>
                <p className="text-xs text-gray-500">Last changed 3 months ago</p>
            </div>
            <button className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-gray-50">Update Password</button>
        </div>
      </SettingSection>

      {/* DATA MANAGEMENT (ADMIN) */}
      {isAdmin && (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl text-red-600 shadow-sm"><Database/></div>
                <div>
                    <p className="font-bold text-red-900 text-sm">Database Maintenance</p>
                    <p className="text-xs text-red-700">Backup your HR data to a CSV file</p>
                </div>
            </div>
            <button className="bg-white text-red-600 px-4 py-2 rounded-lg text-xs font-black shadow-sm hover:bg-red-100 uppercase tracking-tighter">Export Backup</button>
        </div>
      )}
    </div>
  );
};

// Sub-components for cleaner code
const InputGroup = ({ label, value, onChange }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <input className="w-full p-2 border rounded-xl outline-none focus:ring-2 focus:ring-mint-500/20" value={value} onChange={e => onChange(e.target.value)} />
    </div>
);

const SelectGroup = ({ label, value, options, onChange }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <select className="w-full p-2 border rounded-xl outline-none bg-white" value={value} onChange={e => onChange(e.target.value)}>
            {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
    </div>
    
);

export default Settings;