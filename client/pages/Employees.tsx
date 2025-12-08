import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import * as api from "../services/api";
import { Employee } from "../types";
import { Search, Plus, Trash2, Download, User, Edit } from "lucide-react";

const Employees: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee & { password?: string }>>({});
  const [activeTab, setActiveTab] = useState("Personal");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const data = await api.getUsers();
    setEmployees(data);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.jobPosition.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Name,Email,Role,Position,Hired\n" +
      employees
        .map(
          (e) =>
            `${e.id},${e.name},${e.email},${e.role},${e.jobPosition},${e.dateHired}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees_marabes.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure?")) {
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
        password: "", // ensure password field exists for new employees
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
      if (!formData.password) {
        alert("Password is required for new employees");
        return;
      }
      await api.addUser(formData as Omit<Employee & { password: string }, "id">);
    }
    setIsModalOpen(false);
    loadEmployees();
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="text-center text-gray-500 mt-20">
        Access Restricted: Admins Only
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
          >
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by name or position..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint-500 outline-none"
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-sm font-semibold">
            <tr>
              <th className="p-4">Employee</th>
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
                className="hover:bg-mint-50/50 transition-colors"
              >
                <td
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setSelectedEmp(emp)}
                >
                  <img
                    src={emp.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
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
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(emp)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-2 hover:bg-red-50 rounded-full text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No employees found.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
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

              <div className="grid grid-cols-2 gap-4">
                <input
                  required={!isEditMode}
                  placeholder="Password"
                  type="password"
                  className="input-std"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <input
                  required
                  placeholder="Position"
                  className="input-std"
                  value={formData.jobPosition || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, jobPosition: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select
                  className="input-std"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div>
                  <label className="text-xs text-gray-500">Birthday</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Date Hired</label>
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

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEmp && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto p-6 animate-slide-in">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedEmp.avatarUrl}
                  className="w-16 h-16 rounded-full border-2 border-mint-200"
                />
                <div>
                  <h2 className="text-xl font-bold">{selectedEmp.name}</h2>
                  <p className="text-gray-500">{selectedEmp.jobPosition}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)}>
                <User size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 mb-6">
              {['Personal', 'Job', 'Time Off', 'Training'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 pb-3 text-sm font-medium ${
                    activeTab === tab ? 'text-mint-600 border-b-2 border-mint-600' : 'text-gray-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {activeTab === 'Personal' && (
                <div className="space-y-3">
                  <InfoRow label="Email" value={selectedEmp.email} />
                  <InfoRow label="Phone" value={selectedEmp.phone || 'N/A'} />
                  <InfoRow label="Address" value={selectedEmp.address || 'N/A'} />
                  <InfoRow label="Birthday" value={selectedEmp.birthday} />
                </div>
              )}
              {activeTab === 'Job' && (
                <div className="space-y-3">
                  <InfoRow label="Department" value={selectedEmp.department || 'General'} />
                  <InfoRow label="Hired Date" value={selectedEmp.dateHired} />
                  <InfoRow label="Role" value={selectedEmp.role} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-std { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; }
        .input-std:focus { border-color: #14b8a6; ring: 2px solid #14b8a6; }
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
    <span className="text-gray-800 font-medium">{value}</span>
  </div>
);

export default Employees;
