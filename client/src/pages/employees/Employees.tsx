import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../App";
import * as api from "../../services/api";
import { Employee } from "../../types";
import { Search, Plus, Trash2, Download, User, Edit, Users, Briefcase } from "lucide-react";

const Employees: React.FC = () => {
  const { user } = useAuth();
  
  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  
  // UI State: Active Department Tab
  const [activeDept, setActiveDept] = useState("All"); 

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee & { password?: string }>>({});
  const [activeProfileTab, setActiveProfileTab] = useState("Personal");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await api.getUsers();
      // Ensure data is an array
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load employees", err);
      setEmployees([]);
    }
  };

  // -------------------------------------------
  // 1. CALCULATE UNIQUE DEPARTMENTS FOR TABS
  // -------------------------------------------
  const departments = useMemo(() => {
    // Get unique departments from the actual data
    // If department is null/empty, group it under "General"
    const depts = new Set(employees.map(e => e.department || "General"));
    return ["All", ...Array.from(depts)];
  }, [employees]);

  // -------------------------------------------
  // 2. FILTER LOGIC (Search + Department)
  // -------------------------------------------
  const filtered = employees.filter((e) => {
    const empName = e.name || "";
    const empPos = e.jobPosition || "";
    const empDept = e.department || "General";

    const matchesSearch = 
      empName.toLowerCase().includes(search.toLowerCase()) ||
      empPos.toLowerCase().includes(search.toLowerCase());
    
    const matchesDept = 
      activeDept === "All" || 
      empDept === activeDept;

    return matchesSearch && matchesDept;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Name,Email,Role,Position,Department,Hired\n" +
      filtered // Export only filtered results
        .map(
          (e) =>
            `${e.id},${e.name},${e.email},${e.role},${e.jobPosition},${e.department || 'General'},${e.dateHired}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_${activeDept.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      await api.deleteUser(id);
      loadEmployees();
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
        // Auto-select the current tab if it's not "All"
        department: activeDept === "All" ? "General" : activeDept, 
      });
      setIsEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      department: formData.department || "General"
    };

    if (isEditMode && formData.id) {
      await api.updateUser(dataToSend as Employee);
    } else {
      if (!formData.password) {
        alert("Password is required for new employees");
        return;
      }
      await api.addUser(dataToSend as Omit<Employee & { password: string }, "id">);
    }
    setIsModalOpen(false);
    loadEmployees();
  };

  if (user?.role !== "ADMIN") {
    return <div className="text-center text-gray-500 mt-20">Access Restricted: Admins Only</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-mint-600"/> Employees
          </h1>
          <p className="text-gray-500 text-sm">Manage your team members</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={18} /> Export List
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      {/* DEPARTMENT TABS (Dynamic) */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 no-scrollbar">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2
              ${activeDept === dept 
                ? "bg-mint-600 text-white shadow-md transform scale-105" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
              }`}
          >
            {dept} 
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeDept === dept ? 'bg-mint-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {dept === "All" ? employees.length : employees.filter(e => (e.department || "General") === dept).length}
            </span>
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder={`Search in ${activeDept}...`}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint-500 outline-none shadow-sm"
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* EMPLOYEES TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-sm font-semibold">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Department</th>
              <th className="p-4">Role</th>
              <th className="p-4">Position</th>
              <th className="p-4 hidden md:table-cell">Date Hired</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-mint-50/50 transition-colors group"
              >
                <td
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setSelectedEmp(emp)}
                >
                  <div className="relative">
                    <img
                      src={emp.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:border-mint-400"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold border border-gray-200">
                    {emp.department || "General"}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emp.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {emp.role}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{emp.jobPosition}</td>
                <td className="p-4 text-sm text-gray-500 hidden md:table-cell">
                  {emp.dateHired}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(emp)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-2 hover:bg-red-50 rounded-full text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
            <Briefcase size={48} className="mb-4 text-gray-200"/>
            <p className="text-lg font-medium text-gray-500">No employees found in {activeDept}</p>
            <p className="text-sm">Try changing the search term or adding a new employee.</p>
            <button 
                onClick={() => handleOpenModal()} 
                className="mt-4 text-mint-600 font-medium hover:underline"
            >
                Add Employee to {activeDept}
            </button>
          </div>
        )}
      </div>

      {/* ------------------------- MODAL (ADD/EDIT) ------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
               {isEditMode ? <Edit size={20}/> : <Plus size={20}/>}
               {isEditMode ? "Edit Employee" : "New Employee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Name"
                  className="input-std"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <input
                  required
                  placeholder="Email"
                  type="email"
                  className="input-std"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              {/* DEPARTMENT & POSITION */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Department</label>
                    <select
                        className="input-std bg-white"
                        value={formData.department || "General"}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                        <option value="General">General</option>
                        <option value="IT">IT & Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">Human Resources</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Legal">Legal</option>
                    </select>
                </div>
                <div>
                   <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Position</label>
                   <input
                    required
                    placeholder="e.g. Senior Developer"
                    className="input-std"
                    value={formData.jobPosition || ""}
                    onChange={(e) =>
                        setFormData({ ...formData, jobPosition: e.target.value })
                    }
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Password</label>
                    <input
                    required={!isEditMode}
                    placeholder="••••••••"
                    type="password"
                    className="input-std"
                    value={formData.password || ""}
                    onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                    }
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Role</label>
                    <select
                    className="input-std bg-white"
                    value={formData.role}
                    onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value as any })
                    }
                    >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Birthday</label>
                  <input
                    type="date"
                    className="input-std"
                    value={formData.birthday || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, birthday: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Date Hired</label>
                  <input
                    type="date"
                    className="input-std"
                    value={formData.dateHired || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dateHired: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 shadow-md transition-colors"
                >
                  {isEditMode ? "Save Changes" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------- PROFILE SLIDER ------------------------- */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto p-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                    <img
                    src={selectedEmp.avatarUrl}
                    className="w-16 h-16 rounded-full border-4 border-mint-50 shadow-sm"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedEmp.name}</h2>
                  <p className="text-mint-600 font-medium">{selectedEmp.jobPosition}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 mb-6">
              {['Personal', 'Job', 'Time Off', 'Training'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveProfileTab(tab)}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                    activeProfileTab === tab ? 'text-mint-600 border-b-2 border-mint-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {activeProfileTab === 'Personal' && (
                <div className="space-y-4 animate-in fade-in">
                  <InfoRow label="Email" value={selectedEmp.email} />
                  <InfoRow label="Phone" value={selectedEmp.phone || 'N/A'} />
                  <InfoRow label="Address" value={selectedEmp.address || 'N/A'} />
                  <InfoRow label="Birthday" value={selectedEmp.birthday} />
                </div>
              )}
              {activeProfileTab === 'Job' && (
                <div className="space-y-4 animate-in fade-in">
                   <div className="bg-mint-50 p-4 rounded-lg border border-mint-100">
                        <InfoRow label="Current Department" value={selectedEmp.department || 'General'} />
                   </div>
                  <InfoRow label="Hired Date" value={selectedEmp.dateHired} />
                  <InfoRow label="System Role" value={selectedEmp.role} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-std { width: 100%; padding: 0.6rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; transition: all 0.2s; }
        .input-std:focus { border-color: #14b8a6; ring: 2px solid #14b8a6; box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col group">
    <span className="text-xs text-gray-400 uppercase tracking-wider group-hover:text-mint-600 transition-colors">{label}</span>
    <span className="text-gray-800 font-medium text-lg">{value}</span>
  </div>
);

export default Employees;