import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../App";
import * as api from "../../services/api";
import { Employee } from "../../types";
import { 
  Search, Plus, Trash2, Edit, Users, Briefcase, 
  LayoutGrid, List, BarChart3, TrendingUp, Mail, Phone,
  ArrowLeft, MapPin, Calendar, ShieldCheck, User as UserIcon, ExternalLink, Save, X
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from "recharts";

const DEPARTMENTS = ["IT Services", "Finance and Accounting", "Human Resources", "Management"];
const POSITION_SUGGESTIONS: Record<string, string[]> = {
  "IT Services": ["IT Intern", "IT Support"],
  "Finance and Accounting": ["Finance Intern", "Junior Bookkeeper", "Senior Bookkeeper", "Account Manager", "Quality Reviewer", "Client advisor"],
  "Human Resources": ["HR Intern", "HR Assistant", "HR Manager"],
  "Management": ["CEO", "COO", "Manager", "Project Manager"] 
};

const Employees: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All"); 
  const [activeView, setActiveView] = useState<"dashboard" | "grid" | "list">("dashboard");
  
  // States for the Detailed Profile
  const [viewingProfile, setViewingProfile] = useState<Employee | null>(null);
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [detailFormData, setDetailFormData] = useState<Partial<Employee>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee & { password?: string }>>({});

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      const data = await api.getUsers();
      setEmployees(Array.isArray(data) ? data : []);
      // If we are currently viewing someone, refresh their data too
      if (viewingProfile) {
        const updated = data.find((e: Employee) => e.id === viewingProfile.id);
        if (updated) setViewingProfile(updated);
      }
    } catch (err) { setEmployees([]); }
  };

  const chartData = useMemo(() => {
    return DEPARTMENTS.map(dept => ({
      name: dept,
      count: employees.filter(e => e.department === dept).length
    }));
  }, [employees]);

  const filtered = employees.filter((e) => {
    const matchesSearch = 
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.jobPosition || "").toLowerCase().includes(search.toLowerCase());
    const matchesDept = activeDept === "All" || e.department === activeDept;
    return matchesSearch && matchesDept;
  });

  // Handle entry into detailed profile
  const handleEnterProfile = (emp: Employee) => {
    setViewingProfile(emp);
    setDetailFormData(emp);
    setIsDetailEditing(false);
  };

  // Handle Save inside the detailed window
  const handleDetailSave = async () => {
    try {
      await api.updateUser(detailFormData as Employee);
      setIsDetailEditing(false);
      await loadEmployees();
    } catch (err) {
      alert("Failed to save changes");
    }
  };

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setFormData(emp);
      setIsEditMode(true);
    } else {
      setFormData({
        role: "EMPLOYEE",
        avatarUrl: `https://picsum.photos/200?random=${Date.now()}`,
        password: "",
        department: activeDept === "All" ? "IT Services" : activeDept,
        jobPosition: "",
        birthday: "",
        dateHired: ""
      });
      setIsEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && formData.id) {
      await api.updateUser(formData as Employee);
    } else {
      if (!formData.password) return alert("Password required");
      await api.addUser(formData as any);
    }
    setIsModalOpen(false);
    loadEmployees();
  };

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  if (user?.role !== "ADMIN") return <div className="p-20 text-center">Admins Only</div>;

  // ==========================================
  // DYNAMIC INDIVIDUAL PROFILE VIEW (WITH INLINE EDIT)
  // ==========================================
  if (viewingProfile) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setViewingProfile(null)}
            className="flex items-center gap-2 text-gray-500 font-bold hover:text-mint-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 w-fit"
          >
            <ArrowLeft size={18}/> Back to Overview
          </button>

          <div className="flex gap-2">
            {!isDetailEditing ? (
              <button 
                onClick={() => setIsDetailEditing(true)} 
                className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all"
              >
                <Edit size={16}/> Edit Member Info
              </button>
            ) : (
              <>
                <button onClick={() => setIsDetailEditing(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 bg-white border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDetailSave} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"><Save size={16}/> Save Changes</button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-mint-500 to-teal-600"></div>
          <div className="px-10 pb-10">
            <div className="relative flex justify-between items-end -mt-20">
              <img 
                src={viewingProfile.avatarUrl || `https://ui-avatars.com/api/?name=${viewingProfile.name}&background=0D9488&color=fff`} 
                className="w-40 h-40 rounded-3xl border-8 border-white shadow-2xl object-cover"
              />
            </div>
            
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 space-y-8">
                <div>
                  {isDetailEditing ? (
                    <input className="text-3xl font-black text-gray-900 w-full border-b-2 border-teal-500 outline-none pb-1" value={detailFormData.name} onChange={e => setDetailFormData({...detailFormData, name: e.target.value})} />
                  ) : (
                    <h1 className="text-4xl font-black text-gray-900 leading-tight">{viewingProfile.name}</h1>
                  )}
                  <p className="text-mint-600 font-black uppercase tracking-widest text-sm mt-1">{viewingProfile.jobPosition}</p>
                </div>
                
                <div className="space-y-4">
                   <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <div className="p-2 bg-white rounded-lg text-mint-600 shadow-sm"><Mail size={18}/></div>
                      <div className="w-full">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Email Address</p>
                        {isDetailEditing ? <input className="font-bold text-gray-700 w-full bg-transparent outline-none border-b border-gray-200 focus:border-teal-500" value={detailFormData.email} onChange={e => setDetailFormData({...detailFormData, email: e.target.value})} /> : <p className="font-bold text-gray-700 truncate">{viewingProfile.email}</p>}
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="p-2 bg-white rounded-lg text-mint-600 shadow-sm"><Phone size={18}/></div>
                      <div className="w-full">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Phone Number</p>
                        {isDetailEditing ? <input className="font-bold text-gray-700 w-full bg-transparent outline-none border-b border-gray-200 focus:border-teal-500" value={detailFormData.phone || ""} onChange={e => setDetailFormData({...detailFormData, phone: e.target.value})} /> : <p className="font-bold text-gray-700">{viewingProfile.phone || "Not provided"}</p>}
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="p-2 bg-white rounded-lg text-mint-600 shadow-sm"><MapPin size={18}/></div>
                      <div className="w-full">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Primary Address</p>
                        {isDetailEditing ? <input className="font-bold text-gray-700 w-full bg-transparent outline-none border-b border-gray-200 focus:border-teal-500" value={detailFormData.address || ""} onChange={e => setDetailFormData({...detailFormData, address: e.target.value})} /> : <p className="font-bold text-gray-700">{viewingProfile.address || "No address"}</p>}
                      </div>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                <div className="p-8 bg-mint-50/50 rounded-[2rem] border border-mint-100 space-y-4">
                   <div className="flex items-center gap-2 text-mint-700 font-black uppercase tracking-tighter text-xs"><Briefcase size={16}/> Employment Record</div>
                   <div className="grid grid-cols-2 gap-y-6">
                      <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase">Department</p>
                        {isDetailEditing ? (
                          <select className="font-bold text-gray-800 bg-transparent outline-none" value={detailFormData.department} onChange={e => setDetailFormData({...detailFormData, department: e.target.value})}>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : <p className="font-bold text-gray-800">{viewingProfile.department}</p>}
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase">Position</p>
                        {isDetailEditing ? <input className="font-bold text-gray-800 bg-transparent outline-none border-b border-teal-200" value={detailFormData.jobPosition} onChange={e => setDetailFormData({...detailFormData, jobPosition: e.target.value})} /> : <p className="font-bold text-gray-800">{viewingProfile.jobPosition}</p>}
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase">Joined Date</p>
                        {isDetailEditing ? <input type="date" className="font-bold text-gray-800 bg-transparent outline-none" value={detailFormData.dateHired ? detailFormData.dateHired.split('T')[0] : ""} onChange={e => setDetailFormData({...detailFormData, dateHired: e.target.value})} /> : <p className="font-bold text-gray-800">{viewingProfile.dateHired ? new Date(viewingProfile.dateHired).toLocaleDateString() : "---"}</p>}
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase">System Role</p>
                        {isDetailEditing ? (
                          <select className="font-bold text-gray-800 bg-transparent outline-none" value={detailFormData.role} onChange={e => setDetailFormData({...detailFormData, role: e.target.value as any})}>
                            <option value="EMPLOYEE">EMPLOYEE</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : <p className="font-bold text-gray-800">{viewingProfile.role}</p>}
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                   <div className="flex items-center gap-2 text-gray-500 font-black uppercase tracking-tighter text-xs"><Calendar size={16}/> Personal Details</div>
                   <div className="grid grid-cols-1 gap-y-6">
                      <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase">Date of Birth</p>
                        {isDetailEditing ? <input type="date" className="font-bold text-gray-800 bg-transparent outline-none" value={detailFormData.birthday ? detailFormData.birthday.split('T')[0] : ""} onChange={e => setDetailFormData({...detailFormData, birthday: e.target.value})} /> : <p className="font-bold text-gray-800">{viewingProfile.birthday ? new Date(viewingProfile.birthday).toLocaleDateString() : "---"}</p>}
                      </div>
                      <div><p className="text-gray-400 text-[10px] font-black uppercase">Account Status</p><span className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> Active</span></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Users className="text-mint-600"/> Team Center</h1>
          <p className="text-gray-500 text-sm">Managing {employees.length} active members</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button onClick={() => setActiveView("dashboard")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === "dashboard" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500"}`}>Overview</button>
          <button onClick={() => setActiveView("grid")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === "grid" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500"}`}>Profiles</button>
          <button onClick={() => setActiveView("list")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === "list" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500"}`}>Registry</button>
        </div>

        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-3 bg-mint-600 text-white rounded-2xl font-black text-sm hover:bg-mint-700 shadow-lg shadow-mint-100 transition-all">
          <Plus size={18} strokeWidth={3} /> ADD MEMBER
        </button>
      </div>

      {activeView === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {DEPARTMENTS.map((dept, i) => (
               <div key={dept} className="bg-white p-5 rounded-2xl border-l-4 shadow-sm transition-transform hover:-translate-y-1" style={{borderColor: COLORS[i % COLORS.length]}}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{dept}</p>
                  <div className="flex justify-between items-end mt-1">
                    <h3 className="text-2xl font-black text-gray-800">{employees.filter(e => e.department === dept).length}</h3>
                    <div className="p-2 rounded-lg bg-gray-50 text-gray-300"><Users size={14} /></div>
                  </div>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Headcount Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" hide />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={50}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 self-start">Role Breakdown</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[ { name: 'Admins', value: employees.filter(e => e.role === 'ADMIN').length }, { name: 'Employees', value: employees.filter(e => e.role === 'EMPLOYEE').length } ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#10b981" />
                      <Cell fill="#6366f1" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView !== "dashboard" && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={`Search members...`} 
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-mint-500 font-medium text-sm shadow-sm" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div className="flex gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              {["All", ...DEPARTMENTS].map((dept) => (
                <button 
                  key={dept} 
                  onClick={() => setActiveDept(dept)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${activeDept === dept ? "bg-mint-500 text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {dept.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {activeView === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in zoom-in-95 duration-300">
              {filtered.map(emp => (
                <div key={emp.id} onClick={() => handleEnterProfile(emp)} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group text-center cursor-pointer relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"><ExternalLink size={16} className="text-mint-500" /></div>
                  <img src={emp.avatarUrl} className="w-24 h-24 rounded-3xl mx-auto object-cover border-4 border-mint-50 mb-4 shadow-md group-hover:scale-105 transition-transform" />
                  <h3 className="font-black text-gray-800 text-lg leading-tight">{emp.name}</h3>
                  <p className="text-mint-600 font-black text-[10px] uppercase tracking-widest mt-1">{emp.jobPosition}</p>
                  <div className="mt-5 pt-5 border-t border-gray-50"><span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black uppercase tracking-tighter">{emp.department}</span></div>
                </div>
              ))}
            </div>
          )}

          {activeView === "list" && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-mint-50/20 transition-colors">
                      <td className="p-6 flex items-center gap-3">
                        <img src={emp.avatarUrl} className="w-10 h-10 rounded-xl border border-gray-100 object-cover" />
                        <div><p className="font-black text-gray-800 text-sm">{emp.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{emp.jobPosition}</p></div>
                      </td>
                      <td className="p-6"><span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase">{emp.department}</span></td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleEnterProfile(emp); }} className="p-2 text-gray-300 hover:text-mint-600 transition-colors" title="View Profile"><ExternalLink size={16}/></button>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(emp); }} className="p-2 text-gray-300 hover:text-mint-600 transition-colors"><Edit size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); api.deleteUser(emp.id).then(loadEmployees); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* GLOBAL MODAL REMAINS FOR BULK ADDS/EDITS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-gray-800 mb-8">{isEditMode ? "Update Member" : "New Team Member"}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Name" className="input-std" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input required placeholder="Email" type="email" className="input-std" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="input-std bg-white" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value, jobPosition: "" })}>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <input required placeholder="Position" className="input-std" value={formData.jobPosition || ""} onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })} />
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {POSITION_SUGGESTIONS[formData.department || ""]?.map(pos => (
                    <button key={pos} type="button" onClick={() => setFormData({ ...formData, jobPosition: pos })} className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${formData.jobPosition === pos ? 'bg-mint-600 text-white border-mint-600 shadow-md' : 'bg-white text-gray-500 hover:border-mint-200'}`}>{pos}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <select className="input-std bg-white" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}><option value="EMPLOYEE">Employee</option><option value="ADMIN">Admin</option></select>
                {!isEditMode && <input required placeholder="Password" type="password" className="input-std" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="input-std" value={formData.birthday || ""} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} />
                <input type="date" className="input-std" value={formData.dateHired || ""} onChange={(e) => setFormData({ ...formData, dateHired: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-mint-600 text-white rounded-2xl font-black shadow-lg">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input-std { width: 100%; padding: 0.8rem 1rem; border: 1px solid #f3f4f6; border-radius: 1rem; outline: none; background: #f9fafb; font-size: 0.875rem; font-weight: 600; transition: all 0.2s; }
        .input-std:focus { border-color: #14b8a6; background: #fff; box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1); }
      `}</style>
    </div>
  );
};

export default Employees;