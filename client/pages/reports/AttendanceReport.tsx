// client/pages/reports/AttendanceReport.tsx
import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Filter, ArrowLeft, ChevronRight, Printer, AlertCircle
} from "lucide-react";

interface AttendanceReportProps {
  attendanceChart: any[]; 
  employees: any[]; // This now contains { name, rate, lates, history[] }
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ attendanceChart, employees }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState("All");

  // Filter the list based on selection
  const filteredEmployees = filterDept === "All" 
    ? employees 
    : employees.filter(e => e.department === filterDept);

  // --- VIEW 1: INDIVIDUAL REPORT (Detailed) ---
  if (selectedEmployee) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <button onClick={() => setSelectedEmployee(null)} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft size={20} /> Back to Overview
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
             <Printer size={18} /> Print Report
          </button>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                {selectedEmployee.name.charAt(0)}
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800">{selectedEmployee.name}</h1>
                <p className="text-gray-500">{selectedEmployee.role} • {selectedEmployee.department}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase">Attendance Rate</p>
                        <p className="text-2xl font-bold text-gray-800">{selectedEmployee.rate}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase">Days Present</p>
                        <p className="text-2xl font-bold text-emerald-600">{selectedEmployee.present}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase">Absences (Est.)</p>
                        <p className="text-2xl font-bold text-red-500">{selectedEmployee.absent}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase">Late Arrivals</p>
                        <p className="text-2xl font-bold text-orange-500">{selectedEmployee.lates}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* REAL History Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">Recent Logs</h3></div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Clock In</th>
                        <th className="px-6 py-3">Clock Out</th>
                        <th className="px-6 py-3">Notes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {selectedEmployee.history.length > 0 ? (
                        selectedEmployee.history.map((record: any) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                                <td className="px-6 py-3 text-emerald-600 font-medium">
                                    {new Date(record.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="px-6 py-3 text-gray-600">
                                    {record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                </td>
                                <td className="px-6 py-3">
                                    {/* Logic to flag late arrival visually */}
                                    {new Date(record.clockInTime).getHours() >= 9 && new Date(record.clockInTime).getMinutes() > 15 && (
                                        <span className="text-orange-500 flex items-center gap-1 text-xs"><AlertCircle size={12}/> Late</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-400">No attendance records found for this period.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    );
  }

  // --- VIEW 2: GENERAL DASHBOARD ---
  return (
    <div className="relative">
      {/* Filter Popup */}
      {showFilters && (
        <div className="absolute top-0 right-0 z-20 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400">×</button>
            </div>
            <div className="space-y-2">
                {['All', 'Tech', 'Marketing', 'Sales', 'HR'].map(dept => (
                    <label key={dept} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="dept" checked={filterDept === dept} onChange={() => setFilterDept(dept)} />
                        <span className="text-sm text-gray-600">{dept}</span>
                    </label>
                ))}
            </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-2xl font-bold text-gray-900">Attendance Insights</h2></div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700">
            <Filter size={18} /> Filters
          </button>
        </div>

        {/* Global Chart */}
        <div className="h-80 w-full mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceChart}>
                <defs><linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="attendancePercentage" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
        </div>

        {/* Employee List Table */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50"><h3 className="font-bold text-gray-800">Employee Details</h3></div>
            <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                    <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Dept</th>
                        <th className="px-6 py-4">Rate</th>
                        <th className="px-6 py-4">Lates</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.map((emp) => (
                        <tr key={emp.id} onClick={() => setSelectedEmployee(emp)} className="group hover:bg-indigo-50/50 cursor-pointer transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{emp.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.department}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5"><div className="bg-indigo-600 h-1.5 rounded-full" style={{width: `${emp.rate}%`}}></div></div>
                                    <span className="text-sm font-medium text-gray-700">{emp.rate}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.lates}</td>
                            <td className="px-6 py-4 text-right"><ChevronRight className="inline text-gray-300 group-hover:text-indigo-500" size={20} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;