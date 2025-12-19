import React, { useEffect, useState, useMemo } from "react";
import * as api from "../../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Printer, ArrowRight, ChevronRight 
} from "lucide-react";

// ----------------------------
// 1. TYPES
// ----------------------------
// We define the interface here to ensure TypeScript knows about 'department'
interface Employee {
  id: string;
  name: string;
  department?: string; // <--- The fix: explicitly telling TS this exists
  jobPosition?: string;
  email?: string;
}

interface TimeOffRequest {
  id: string;
  userId: string;
  type: "Vacation" | "Sick" | "Personal" | string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
}

// Helper to count days between dates
const getDays = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
};

export default function TimeOffReport() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // BRAND COLORS
  const COLORS = {
    mint: "#14b8a6",
    teal: "#0f766e",
    blue: "#3b82f6",
    orange: "#f97316",
    red: "#ef4444",
    green: "#10b981",
    gray: "#f3f4f6",
    chartPalette: ["#14b8a6", "#f97316", "#3b82f6", "#ef4444"]
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, requestsData] = await Promise.all([
        api.getUsers(),
        api.getTimeOffRequests()
      ]);
      setEmployees(usersData);
      setRequests(requestsData);
    } catch (err) {
      console.error("Failed to load time off data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // 2. DATA CALCULATIONS
  // ----------------------------
  const stats = useMemo(() => {
    let totalRequests = requests.length;
    let pendingCount = 0;
    let approvedCount = 0;
    let totalDaysTaken = 0;

    const typeCounts: Record<string, number> = { Vacation: 0, Sick: 0, Personal: 0 };
    const statusCounts: Record<string, number> = { APPROVED: 0, PENDING: 0, REJECTED: 0 };
    const deptCounts: Record<string, number> = {};

    // Create a map for fast lookup: ID -> Employee Object
    const empMap = new Map<string, Employee>();
    employees.forEach(e => empMap.set(e.id, e));

    requests.forEach(req => {
      // Status Counts
      statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
      
      if (req.status === "PENDING") pendingCount++;
      if (req.status === "APPROVED") {
        approvedCount++;
        const days = getDays(req.startDate, req.endDate);
        totalDaysTaken += days;
        
        // Type Counts
        const type = req.type || "Other";
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        // Department Counts
        const emp = empMap.get(req.userId);
        
        // THE FIX IS HERE: We safely access department now
        const dept = emp?.department || "General"; 
        deptCounts[dept] = (deptCounts[dept] || 0) + days; 
      }
    });

    const typeChartData = Object.keys(typeCounts).map(k => ({ name: k, value: typeCounts[k] }));
    
    const statusChartData = [
      { name: "Approved", value: statusCounts.APPROVED, fill: COLORS.mint },
      { name: "Pending", value: statusCounts.PENDING, fill: COLORS.orange },
      { name: "Rejected", value: statusCounts.REJECTED, fill: COLORS.red },
    ];

    const deptChartData = Object.keys(deptCounts)
        .map(k => ({ name: k, days: deptCounts[k] }))
        .sort((a,b) => b.days - a.days)
        .slice(0, 5);

    return { 
      totalRequests, 
      pendingCount, 
      approvedCount, 
      totalDaysTaken, 
      typeChartData, 
      statusChartData,
      deptChartData 
    };
  }, [employees, requests]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Time Off Data...</div>;

  // ----------------------------
  // 3. INDIVIDUAL VIEW (PRINTABLE)
  // ----------------------------
  if (selectedEmp) {
    const empRequests = requests.filter(r => r.userId === selectedEmp.id);
    const approvedDays = empRequests
        .filter(r => r.status === "APPROVED")
        .reduce((sum, r) => sum + getDays(r.startDate, r.endDate), 0);

    return (
      <div className="bg-white min-h-screen p-6 animate-in fade-in">
        <div className="flex justify-between items-center mb-6 no-print">
          <button onClick={() => setSelectedEmp(null)} className="flex items-center gap-2 text-gray-600 hover:text-teal-600">
             <ArrowRight className="rotate-180" size={20}/> Back to Dashboard
          </button>
          <button onClick={() => window.print()} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
             <Printer size={18}/> Print Report
          </button>
        </div>

        {/* Paper Layout */}
        <div className="max-w-4xl mx-auto border border-gray-200 rounded-xl p-10 shadow-sm bg-white print:border-none print:shadow-none">
            <div className="flex justify-between items-end border-b pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{selectedEmp.name}</h1>
                    <p className="text-lg text-gray-500 mt-1">{selectedEmp.jobPosition} • {selectedEmp.department || "General"}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Total Days Off</p>
                    <div className="text-5xl font-bold text-teal-600">{approvedDays}</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
               <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase">Vacation Taken</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {empRequests.filter(r => r.status === "APPROVED" && r.type === "Vacation")
                     .reduce((s, r) => s + getDays(r.startDate, r.endDate), 0)} Days
                  </p>
               </div>
               <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase">Sick Leave</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {empRequests.filter(r => r.status === "APPROVED" && r.type === "Sick")
                     .reduce((s, r) => s + getDays(r.startDate, r.endDate), 0)} Days
                  </p>
               </div>
               <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase">Pending</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {empRequests.filter(r => r.status === "PENDING").length} Requests
                  </p>
               </div>
            </div>

            <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-teal-500 pl-3">Request History</h3>
            <table className="w-full text-left text-sm border-t border-gray-100">
                <thead>
                    <tr className="text-gray-500 border-b border-gray-100 bg-gray-50">
                        <th className="py-3 px-4 font-medium">Type</th>
                        <th className="py-3 px-4 font-medium">Dates</th>
                        <th className="py-3 px-4 font-medium">Duration</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {empRequests.map((req) => (
                        <tr key={req.id} className="border-b border-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{req.type}</td>
                            <td className="py-3 px-4 text-gray-600">
                                {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-gray-800">{getDays(req.startDate, req.endDate)} Days</td>
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                    ${req.status === "APPROVED" ? "bg-green-100 text-green-700" : 
                                      req.status === "PENDING" ? "bg-orange-100 text-orange-700" : 
                                      "bg-red-100 text-red-700"}`}>
                                    {req.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
  }

  // ----------------------------
  // 4. MAIN DASHBOARD VIEW
  // ----------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-1 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Pending Requests</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">{stats.pendingCount}</span>
                <span className="text-xs text-orange-600 font-medium">Action Needed</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 h-1 rounded-full">
                <div className="h-full bg-orange-500 rounded-full" style={{width: `${(stats.pendingCount / (stats.totalRequests || 1)) * 100}%`}}></div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Approved Leaves</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">{stats.approvedCount}</span>
                <span className="text-xs text-green-600 font-medium">Approved</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 h-1 rounded-full">
                <div className="h-full bg-green-500 rounded-full" style={{width: `${(stats.approvedCount / (stats.totalRequests || 1)) * 100}%`}}></div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Total Days Lost</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">{stats.totalDaysTaken}</span>
                <span className="text-xs text-blue-600 font-medium">Days (All Depts)</span>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <p className="text-sm font-medium text-gray-500">Avg Leave Duration</p>
             <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">
                    {stats.approvedCount > 0 ? (stats.totalDaysTaken / stats.approvedCount).toFixed(1) : 0}
                </span>
                <span className="text-xs text-teal-600 font-medium">Days / Request</span>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
             <h3 className="font-bold text-gray-800 text-sm mb-4">Leave Types</h3>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.typeChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.typeChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS.chartPalette[index % COLORS.chartPalette.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
             <h3 className="font-bold text-gray-800 text-sm mb-4">Outcomes</h3>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.statusChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="name" tick={{fontSize: 12}}/>
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
             <h3 className="font-bold text-gray-800 text-sm mb-4">Days by Dept</h3>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={stats.deptChartData}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                        <XAxis type="number" hide/>
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}}/>
                        <Tooltip />
                        <Bar dataKey="days" fill={COLORS.blue} radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <div>
                <h3 className="font-bold text-gray-800">Employee Time Off Records</h3>
             </div>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left">
                 <thead className="bg-white text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                     <tr>
                         <th className="px-6 py-4">Employee</th>
                         <th className="px-6 py-4">Department</th>
                         <th className="px-6 py-4">Pending</th>
                         <th className="px-6 py-4">Days Taken</th>
                         <th className="px-6 py-4 text-right">View</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 text-sm">
                     {employees.map(emp => {
                         const empReqs = requests.filter(r => r.userId === emp.id);
                         const pending = empReqs.filter(r => r.status === "PENDING").length;
                         const taken = empReqs
                            .filter(r => r.status === "APPROVED")
                            .reduce((s, r) => s + getDays(r.startDate, r.endDate), 0);

                         return (
                             <tr key={emp.id} onClick={() => setSelectedEmp(emp)} className="group hover:bg-teal-50/30 cursor-pointer transition-colors">
                                 <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 group-hover:bg-teal-100 group-hover:text-teal-700">
                                        {emp.name.charAt(0)}
                                     </div>
                                     {emp.name}
                                 </td>
                                 <td className="px-6 py-4 text-gray-500">{emp.department || "General"}</td>
                                 <td className="px-6 py-4">
                                     {pending > 0 ? (
                                        <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                            {pending} Pending
                                        </span>
                                     ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                     )}
                                 </td>
                                 <td className="px-6 py-4 font-medium text-gray-700">{taken} Days</td>
                                 <td className="px-6 py-4 text-right text-gray-400 group-hover:text-teal-600">
                                     <ChevronRight size={18}/>
                                 </td>
                             </tr>
                         )
                     })}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
}