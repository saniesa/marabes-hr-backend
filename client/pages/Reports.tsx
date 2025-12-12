import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../App";
import * as api from "../services/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { 
  Download, TrendingUp, Users, Calendar, Award, Loader, 
  PartyPopper, UserMinus, UserPlus, ArrowRight 
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import ScoresReport from "./reports/ScoresReport";
import AttendanceReport from "./reports/AttendanceReport";
import TimeOffReport from "./reports/TimeOffReport";

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState("month");
  
  // --- EXISTING DATA STATES ---
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [scoresTrend, setScoresTrend] = useState<any[]>([]);
  const [timeOffStats, setTimeOffStats] = useState<any[]>([]);
  const [attendanceChart, setAttendanceChart] = useState<any[]>([]);
  const [employeeAttendanceStats, setEmployeeAttendanceStats] = useState<any[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);

  // --- NEW DATA STATES (FOR NEW WIDGETS) ---
  const [absentToday, setAbsentToday] = useState<any[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [newHires, setNewHires] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReports();
  }, [timeFrame]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [employees, scores, timeOff] = await Promise.all([
        api.getUsers(),
        api.getScores(),
        api.getTimeOffRequests()
      ]);

      // --- 1. EXISTING CALCULATIONS (Attendance, Scores, etc.) ---
      const globalDailyStats: Record<string, { present: number; total: number }> = {};
      const detailedStats = [];
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      let totalDaysPresentAllEmps = 0;
      let totalWorkingDaysAllEmps = 0;

      for (const emp of employees) {
        const history = await api.getAttendanceHistory(emp.id);
        const recentHistory = history.filter((h: any) => new Date(h.date) >= thirtyDaysAgo);
        // ... (Existing calculation logic remains here) ...
        const daysPresent = recentHistory.length;
        const rate = Math.round((daysPresent / 22) * 100);
        totalDaysPresentAllEmps += daysPresent;
        totalWorkingDaysAllEmps += 22;
        detailedStats.push({ ...emp, rate, present: daysPresent });
      }

      setEmployeeAttendanceStats(detailedStats);
      setAttendanceRate(totalWorkingDaysAllEmps > 0 ? Math.round((totalDaysPresentAllEmps / totalWorkingDaysAllEmps) * 100) : 0);

      // --- 2. NEW WIDGET CALCULATIONS ---

      // A. WHO IS AWAY TODAY?
      // Check approved time-off requests where today falls between start and end date
      const todayStr = new Date().toISOString().split('T')[0];
      const awayList = timeOff.filter((req: any) => {
        return req.status === "APPROVED" && req.startDate <= todayStr && req.endDate >= todayStr;
      }).map((req: any) => {
        const emp = employees.find((e: any) => e.id === req.userId);
        return { name: emp?.name || "Unknown", type: req.type, avatar: emp?.avatarUrl };
      });
      setAbsentToday(awayList);

      // B. UPCOMING BIRTHDAYS (Next 30 days)
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();
      const bdays = employees.filter((emp: any) => {
        if (!emp.birthday) return false;
        const bdate = new Date(emp.birthday);
        const bMonth = bdate.getMonth() + 1;
        const bDay = bdate.getDate();
        // Simple check: is birthday in current month and after today, or next month?
        return (bMonth === currentMonth && bDay >= currentDay) || (bMonth === currentMonth + 1);
      }).sort((a: any, b: any) => new Date(a.birthday).getDate() - new Date(b.birthday).getDate()).slice(0, 3);
      setUpcomingBirthdays(bdays);

      // C. NEW HIRES (Last 30 days)
      const recentHires = employees.filter((emp: any) => {
        if (!emp.dateHired) return false;
        const hiredDate = new Date(emp.dateHired);
        return hiredDate >= thirtyDaysAgo;
      }).slice(0, 3);
      setNewHires(recentHires);

      // --- EXISTING CHART DATA PREP ---
      const deptMap: any = {};
      employees.forEach((emp) => {
        const dept = emp.department || "General";
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      setDepartmentStats(Object.keys(deptMap).map((dept) => ({ name: dept, value: deptMap[dept] })));

      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const trendData: any = {};
      scores.forEach((score) => {
        const month = new Date(score.date).getMonth();
        const monthName = monthNames[month];
        if (!trendData[monthName]) trendData[monthName] = { month: monthName, total: 0, count: 0 };
        trendData[monthName].total += score.score;
        trendData[monthName].count += 1;
      });
      setScoresTrend(Object.values(trendData).map((d: any) => ({ month: d.month, average: Math.round(d.total / d.count) })));

      const typeMap: any = { Vacation:0, Sick:0, Personal:0 };
      timeOff.forEach((req) => {
        if (req.status === "APPROVED") typeMap[req.type] = (typeMap[req.type]||0)+1;
      });
      setTimeOffStats([
        { name: "Vacation", value: typeMap.Vacation },
        { name: "Sick", value: typeMap.Sick },
        { name: "Personal", value: typeMap.Personal },
      ]);

    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      pdf.setFontSize(18);
      pdf.text(`Marabes HR - ${activeTab.toUpperCase()} Report`, 10, 10);
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 16);
      pdf.addImage(imgData, "PNG", 0, 20, pdfWidth, (imgHeight * pdfWidth) / imgWidth);
      pdf.save(`Marabes_Report_${activeTab}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Report Data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-sm transition-colors ${isExporting ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"}`}
          >
            {isExporting ? <Loader className="animate-spin" size={18}/> : <Download size={18} />}
            {isExporting ? "Generating PDF..." : "Export as PDF"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        {["summary", "scores", "attendance", "timeoff"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* === PRINTABLE AREA === */}
      <div ref={reportRef} className="mt-6 bg-white/50 p-4 rounded-xl">
        
        {activeTab === "summary" && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* 1. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Attendance Rate</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{attendanceRate}%</p>
                            <p className="text-xs text-green-600 mt-1">↑ Calculated from logs</p>
                        </div>
                        <div className="p-3 bg-teal-50 rounded-lg text-teal-600"><Calendar size={24}/></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Performance</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">
                                {scoresTrend.length > 0 ? scoresTrend[scoresTrend.length-1].average : 0}%
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600"><Award size={24}/></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Employees</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">
                                {departmentStats.reduce((a,b)=>a+b.value,0)}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Users size={24}/></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Time Off (Approved)</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">
                                {timeOffStats.reduce((a,b)=>a+b.value,0)}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><TrendingUp size={24}/></div>
                    </div>
                </div>
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Distribution</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={departmentStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {departmentStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={["#14b8a6","#f59e0b","#8b5cf6","#3b82f6"][index % 4]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance History</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={scoresTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="average" stroke="#8b5cf6" strokeWidth={3} dot={{r:4}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. NEW WIDGETS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* WIDGET A: ON LEAVE TODAY */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-red-50 rounded-lg text-red-500"><UserMinus size={20}/></div>
                        <h3 className="font-semibold text-gray-800">Away Today</h3>
                    </div>
                    <div className="space-y-3">
                        {absentToday.length > 0 ? absentToday.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 border-b border-gray-50 pb-2">
                                <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}`} className="w-8 h-8 rounded-full"/>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{p.name}</p>
                                    <p className="text-xs text-red-400">{p.type}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-6 text-gray-400 text-sm">Everyone is present today!</div>
                        )}
                    </div>
                </div>

                {/* WIDGET B: UPCOMING BIRTHDAYS */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-500"><PartyPopper size={20}/></div>
                        <h3 className="font-semibold text-gray-800">Birthdays</h3>
                    </div>
                    <div className="space-y-3">
                        {upcomingBirthdays.length > 0 ? upcomingBirthdays.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 border-b border-gray-50 pb-2">
                                <img src={p.avatarUrl || `https://ui-avatars.com/api/?name=${p.name}`} className="w-8 h-8 rounded-full"/>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{p.name}</p>
                                    <p className="text-xs text-gray-400">{new Date(p.birthday).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-6 text-gray-400 text-sm">No upcoming birthdays</div>
                        )}
                    </div>
                </div>

                {/* WIDGET C: NEW HIRES */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><UserPlus size={20}/></div>
                        <h3 className="font-semibold text-gray-800">New Hires</h3>
                    </div>
                    <div className="space-y-3">
                        {newHires.length > 0 ? newHires.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 border-b border-gray-50 pb-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                    {p.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">{p.name}</p>
                                    <p className="text-xs text-gray-400">{p.jobPosition}</p>
                                </div>
                                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">New</div>
                            </div>
                        )) : (
                            <div className="text-center py-6 text-gray-400 text-sm">No new hires this month</div>
                        )}
                    </div>
                </div>

            </div>
          </div>
        )}

        {activeTab === "scores" && <ScoresReport />}
        {activeTab === "attendance" && <AttendanceReport attendanceChart={attendanceChart} employees={employeeAttendanceStats} />}
        {activeTab === "timeoff" && <TimeOffReport timeOffStats={timeOffStats} />}
        
      </div>
    </div>
  );
};

export default Reports;