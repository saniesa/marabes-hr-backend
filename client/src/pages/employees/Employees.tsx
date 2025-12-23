import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../App";
import * as api from "../../services/api";
import { Employee } from "../../types";
import { Search, Plus, Trash2, Download, User, Edit, Users, Briefcase } from "lucide-react";

// 1. YOUR SPECIFIC DEPARTMENTS
const DEPARTMENTS = ["IT Services", "Finance and Accounting", "Human Resources", "Management"];

// 2. YOUR SPECIFIC ENTITIES (ROLES)
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

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee & { password?: string }>>({});

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      const data = await api.getUsers();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setEmployees([]);
    }
  };

  const filtered = employees.filter((e) => {
    const matchesSearch = 
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.jobPosition || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesDept = activeDept === "All" || e.department === activeDept;
    return matchesSearch && matchesDept;
  });

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
        birthday: "", // Initialized
        dateHired: ""  // Initialized
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

  if (user?.role !== "ADMIN") return <div className="p-20 text-center">Admins Only</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-mint-600"/> Employees</h1>
          <p className="text-gray-500 text-sm">Manage your team members</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700">
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {["All", ...DEPARTMENTS].map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeDept === dept ? "bg-mint-600 text-white shadow-md" : "bg-white text-gray-600 border"}`}
          >
            {dept} 
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeDept === dept ? 'bg-mint-500 text-white' : 'bg-gray-100'}`}>
              {dept === "All" ? employees.length : employees.filter(e => e.department === dept).length}
            </span>
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder={`Search in ${activeDept}...`} 
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-mint-500" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Department</th>
              <th className="p-4">Position</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.map((emp) => (
              <tr key={emp.id} className="hover:bg-mint-50/30 group">
                <td className="p-4 flex items-center gap-3">
                  <img src={emp.avatarUrl} className="w-10 h-10 rounded-full border" />
                  <div>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold uppercase">{emp.department}</span>
                </td>
                <td className="p-4 text-gray-600">{emp.jobPosition}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(emp)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><Edit size={16} /></button>
                    <button onClick={() => api.deleteUser(emp.id).then(loadEmployees)} className="p-2 hover:bg-red-50 rounded-full text-red-500"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (ADD/EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-6">{isEditMode ? "Edit Employee" : "New Employee"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Name" className="input-std" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input required placeholder="Email" type="email" className="input-std" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Department</label>
                  <select className="input-std bg-white" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value, jobPosition: "" })}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Position</label>
                  <input required placeholder="e.g. IT Intern" className="input-std" value={formData.jobPosition || ""} onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })} />
                </div>
              </div>

              {/* QUICK SUGGESTIONS */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Suggestions for {formData.department}</p>
                <div className="flex flex-wrap gap-1">
                  {POSITION_SUGGESTIONS[formData.department || ""]?.map(pos => (
                    <button 
                      key={pos} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, jobPosition: pos })}
                      className={`text-[10px] px-2 py-1 rounded border transition-colors 
                        ${formData.jobPosition === pos ? 'bg-mint-600 text-white border-mint-600' : 'bg-white text-gray-500 hover:border-mint-400'}`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input required={!isEditMode} placeholder="Password" type="password" className="input-std" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <select className="input-std bg-white" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* RESTORED DATE FIELDS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Birthday</label>
                  <input 
                    type="date" 
                    className="input-std" 
                    value={formData.birthday || ""} 
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Date of Employment</label>
                  <input 
                    type="date" 
                    className="input-std" 
                    value={formData.dateHired || ""} 
                    onChange={(e) => setFormData({ ...formData, dateHired: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 shadow-md transition-colors">
                  {isEditMode ? "Save Changes" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input-std { width: 100%; padding: 0.6rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; }
        .input-std:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1); }
      `}</style>
    </div>
  );
};

export default Employees;