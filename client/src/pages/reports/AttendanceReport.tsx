import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { 
  Filter, ArrowLeft, ChevronRight, Printer, AlertCircle, CalendarOff, User, Clock 
} from "lucide-react";
import * as api from "../../services/api";

// --- CRITICAL HELPER: FORCE LOCAL DATE ---
// This ensures 12th stays 12th and doesn't shift to 11th due to timezone
const getLocalYYYYMMDD = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  // This uses your computer's local time to get the date string
  return d.toLocaleDateString('en-CA'); // en-CA always outputs YYYY-MM-DD
};

const AttendanceReport: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceChart, setAttendanceChart] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allEmployees = await api.getUsers();
        // Count total active employees for the % calculation
        const totalEmployeeCount = allEmployees.length || 1; 

        // --- 1. GENERATE DATES (CURRENT MONTH WEEKDAYS ONLY) ---
        const dateRange: string[] = [];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11
        
        // Start from Day 1 of this month
        const current = new Date(year, month, 1);
        
        // Loop until Today (Include Today!)
        const endOfToday = new Date(); 
        endOfToday.setHours(23, 59, 59, 999); // Make sure today is included

        while (current <= endOfToday) {
            const dayOfWeek = current.getDay();
            // Exclude Sunday (0) and Saturday (6)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                dateRange.push(getLocalYYYYMMDD(current));
            }
            // Add 1 day
            current.setDate(current.getDate() + 1);
        }

        // --- 2. FETCH & PROCESS DATA ---
        const dailyPresenceCounts: Record<string, number> = {};
        dateRange.forEach(date => dailyPresenceCounts[date] = 0);

        const employeesWithHistory: any[] = [];

        for (const emp of allEmployees) {
          const history = await api.getAttendanceHistory(emp.id);
          
          let presentCount = 0;
          let lates = 0;
          let daysPresentInCurrentMonth = 0;

          history.forEach((r: any) => {
            // FIX: Use the helper to prevent -1 day error
            const recordDate = getLocalYYYYMMDD(r.date);
            
            // GLOBAL CHART LOGIC
            // If this record matches a weekday in our current month list
            if (dailyPresenceCounts.hasOwnProperty(recordDate)) {
                // If they clocked in, count them as present for that day
                if (r.clockInTime) {
                    dailyPresenceCounts[recordDate]++;
                }
            }

            // INDIVIDUAL STATS LOGIC
            if (r.clockInTime) {
                 presentCount++; // Total lifetime presence
                 
                 // Count for current month rate calculation
                 if (dateRange.includes(recordDate)) {
                    daysPresentInCurrentMonth++;
                 }

                 const clockIn = new Date(r.clockInTime);
                 if (clockIn.getHours() > 9 || (clockIn.getHours() === 9 && clockIn.getMinutes() > 15)) {
                     lates++;
                 }
             }
          });

          // Rate = (Days Present This Month / Weekdays So Far This Month) * 100
          const businessDaysSoFar = dateRange.length || 1;
          const rate = Math.round((daysPresentInCurrentMonth / businessDaysSoFar) * 100);
          
          employeesWithHistory.push({ 
              ...emp, 
              history, 
              present: presentCount, 
              // Absences based on this month only
              absent: businessDaysSoFar - daysPresentInCurrentMonth, 
              rate: rate > 100 ? 100 : rate,
              lates
          });
        }

        // --- 3. BUILD CHART DATA ---
        const finalChartData = dateRange.map(date => {
            const count = dailyPresenceCounts[date] || 0;
            // FIX: If count > totalEmployees (e.g. bad data), cap at 100%
            const rawPercent = Math.round((count / totalEmployeeCount) * 100);
            
            return {
                date, // Full date "2025-12-16"
                dayLabel: date.split('-')[2], // Just "16"
                attendancePercentage: rawPercent > 100 ? 100 : rawPercent,
                presentCount: count // Store raw count for tooltip
            };
        });

        setEmployees(employeesWithHistory);
        setAttendanceChart(finalChartData);
      } catch (err) {
          console.error("Error loading attendance report", err);
      } finally {
          setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredEmployees = filterDept === "All"
    ? employees
    : employees.filter(e => e.department === filterDept);

  // =========================================================
  // VIEW 1: INDIVIDUAL EMPLOYEE REPORT (DETAILED)
  // =========================================================
  if (selectedEmployee) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm no-print">
          <button onClick={() => setSelectedEmployee(null)} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft size={20} /> Back to Overview
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
             <Printer size={18} /> Print Report
          </button>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-8 items-start page-break">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 border-4 border-indigo-50">
                {selectedEmployee.name.charAt(0)}
            </div>
            <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{selectedEmployee.name}</h1>
                        <p className="text-gray-500 text-lg">{selectedEmployee.jobPosition} • {selectedEmployee.department || "General"}</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm text-gray-400">Monthly Rate</p>
                        <div className={`text-3xl font-bold ${selectedEmployee.rate >= 90 ? 'text-green-600' : 'text-indigo-600'}`}>{selectedEmployee.rate}%</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Attendance</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{selectedEmployee.rate}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Days Present</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{selectedEmployee.present}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Absences (Mo)</p>
                        <p className="text-2xl font-bold text-red-500 mt-1">{selectedEmployee.absent}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Late Arrivals</p>
                        <p className="text-2xl font-bold text-orange-500 mt-1">{selectedEmployee.lates}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={18} className="text-gray-400"/> Attendance Log
                </h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-500 uppercase font-semibold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Clock In</th>
                        <th className="px-6 py-3">Clock Out</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                    {selectedEmployee.history.length > 0 ? (
                        selectedEmployee.history.map((record: any) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-emerald-600 font-medium">
                                    {record.clockInTime ? new Date(record.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {record.clockInTime && new Date(record.clockInTime).getHours() >= 9 && new Date(record.clockInTime).getMinutes() > 15 ? (
                                        <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                                            <AlertCircle size={12}/> Late
                                        </span>
                                    ) : (
                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold w-fit">On Time</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No attendance records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 2: GENERAL DASHBOARD (MAIN VIEW)
  // =========================================================
  return (
    <div className="relative animate-in fade-in">
      
      {/* Filters Overlay */}
      {showFilters && (
        <div className="absolute top-12 right-0 z-20 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 text-sm">Filter Department</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-1">
                {['All', 'Tech', 'Marketing', 'Sales', 'HR', 'General'].map(dept => (
                    <label key={dept} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                        <input type="radio" name="dept" checked={filterDept === dept} onChange={() => setFilterDept(dept)} className="accent-indigo-600"/>
                        <span className="text-sm text-gray-600">{dept}</span>
                    </label>
                ))}
            </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
              <h2 className="text-2xl font-bold text-gray-900">Attendance Insights</h2>
              <p className="text-sm text-gray-500">
                Daily presence for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} (Weekdays)
              </p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Global Chart */}
        <div className="h-80 w-full mb-10 bg-gray-50/50 rounded-xl border border-gray-100 relative p-2">
            {attendanceChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="dayLabel" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 11}} 
                        dy={10} 
                        interval={0} // Forces every day to show
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                    <Tooltip 
                        contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} 
                        labelFormatter={(label) => `Day ${label}`}
                        formatter={(val: number, name: string, props: any) => [`${val}% (${props.payload.presentCount} present)`, 'Attendance']} 
                    />
                    <Area 
                        type="monotone" 
                        dataKey="attendancePercentage" 
                        stroke="#4f46e5" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorRate)" 
                        activeDot={{ r: 6 }}
                    />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <CalendarOff size={48} className="mb-2 opacity-50"/>
                    <p>No data available for this month.</p>
                </div>
            )}
        </div>

        {/* Employee List Table */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Employee Details</h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">{filteredEmployees.length} Employees</span>
            </div>
            <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                    <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Dept</th>
                        <th className="px-6 py-4">Mo. Rate</th>
                        <th className="px-6 py-4">Lates</th>
                        <th className="px-6 py-4 text-right">View</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.map((emp) => (
                        <tr key={emp.id} onClick={() => setSelectedEmployee(emp)} className="group hover:bg-indigo-50/30 cursor-pointer transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                    {emp.name.charAt(0)}
                                </div>
                                {emp.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">{emp.department || 'General'}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-1.5 rounded-full ${emp.rate >= 90 ? 'bg-green-500' : emp.rate >= 75 ? 'bg-blue-500' : 'bg-red-500'}`} style={{width: `${emp.rate}%`}}></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{emp.rate}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.lates}</td>
                            <td className="px-6 py-4 text-right"><ChevronRight className="inline text-gray-300 group-hover:text-indigo-500" size={18} /></td>
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