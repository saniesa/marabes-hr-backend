import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../App";
import { 
  Activity, Search, Download, RotateCw, Trash2, FileText, 
  ChevronLeft, ChevronRight, User, Users, ArrowLeft, Lock, Filter 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = "http://localhost:5000/api";

interface LogEntry {
  id: number;
  userId: number;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

const ActivityLog: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "employees">("all");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  // Filters & Pagination
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("marabes_token");
      const res = await axios.get(`${API_URL}/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedLogs = res.data.sort((a: LogEntry, b: LogEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLogs(sortedLogs);
    } catch (err) {
      console.error("Failed to load activity logs", err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this log entry?")) return;
    try {
      const token = localStorage.getItem("marabes_token");
      await axios.delete(`${API_URL}/activity/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(logs.filter(l => l.id !== id));
    } catch (err) {
      alert("Failed to delete log.");
    }
  };

  // --- EXPORT FUNCTIONS ---
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,User,Action,Details,IP Address\n" +
      filteredLogs.map(log => 
        `"${new Date(log.timestamp).toLocaleString()}","${log.userName}","${log.action}","${log.details}","${log.ipAddress}"`
      ).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `marabes-audit-${Date.now()}.csv`);
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = selectedUser 
        ? `Marabes HR - Activity Report: ${filteredLogs[0]?.userName || 'User'}` 
        : "Marabes HR - Global Activity Log";

    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    const tableRows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userName || "System",
      log.action,
      log.details,
      log.ipAddress
    ]);

    autoTable(doc, {
      head: [['Timestamp', 'User', 'Action', 'Details', 'IP']],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillStyle: 'f', fillColor: [16, 185, 129] } // Mint Green Header
    });

    doc.save(`activity-report-${Date.now()}.pdf`);
  };

  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("LOGIN")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (act.includes("CREATED")) return "bg-green-100 text-green-700 border-green-200";
    if (act.includes("DELETED")) return "bg-red-100 text-red-700 border-red-200";
    if (act === "CLOCK_IN") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (act === "CLOCK_OUT") return "bg-orange-100 text-orange-700 border-orange-200";
    if (act === "BREAK_START") return "bg-amber-100 text-amber-700 border-amber-200";
    if (act === "BREAK_END") return "bg-teal-100 text-teal-700 border-teal-200";
    if (act === "SALARY_UPDATE") return "bg-indigo-100 text-indigo-700 border-indigo-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const filteredLogs = logs.filter((log) => {
    const matchesUser = selectedUser ? log.userId === selectedUser : true;
    const matchesFilter = filter === "all" || (log.action && log.action.toUpperCase() === filter.toUpperCase());
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (log.userName || "").toLowerCase().includes(searchLower) || (log.details || "").toLowerCase().includes(searchLower);
    return matchesUser && matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueUsers = Array.from(new Map(logs.map(log => [log.userId, { id: log.userId, name: log.userName }])).values());

  if (currentUser?.role !== "ADMIN") return <div className="p-10 text-center text-gray-500"><Lock className="mx-auto mb-2"/> Access Restricted</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-mint-500 rounded-lg text-white"><Activity size={24}/></div>
            Audit Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitor all system actions and employee attendance logs.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
          <button 
            onClick={() => {setActiveTab("all"); setSelectedUser(null);}} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "all" ? "bg-white text-mint-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Global Log
          </button>
          <button 
            onClick={() => setActiveTab("employees")} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "employees" ? "bg-white text-mint-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Profiles
          </button>
        </div>
      </div>

      {activeTab === "all" || selectedUser ? (
        <>
          {/* SEARCH & FILTERS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {selectedUser && (
              <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-mint-600 font-bold hover:underline bg-mint-50 px-4 py-2 rounded-lg w-fit">
                <ArrowLeft size={16}/> Back
              </button>
            )}
            <div className={`relative ${selectedUser ? 'md:col-span-2' : 'md:col-span-2'}`}>
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint-500 bg-white shadow-sm" 
                value={searchTerm} 
                onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              />
            </div>
            <select 
              className="border border-gray-200 rounded-xl px-4 py-2.5 outline-none bg-white font-medium text-gray-700 shadow-sm" 
              value={filter} 
              onChange={e => {setFilter(e.target.value); setCurrentPage(1);}}
            >
              <option value="all">All Actions</option>
              <option value="CLOCK_IN">Clock In</option>
              <option value="CLOCK_OUT">Clock Out</option>
              <option value="BREAK_START">Break Start</option>
              <option value="BREAK_END">Break End</option>
              <option value="LOGIN">Logins</option>
              <option value="SALARY_UPDATE">Salaries</option>
            </select>
            <div className="flex gap-2">
               <button onClick={loadLogs} title="Refresh" className={`p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}><RotateCw size={18}/></button>
               <button onClick={handleExportCSV} title="Download CSV" className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-600"><Download size={18}/></button>
               <button onClick={handleExportPDF} className="flex-1 flex items-center justify-center gap-2 bg-mint-600 text-white rounded-xl font-bold text-sm hover:bg-mint-700 transition-shadow shadow-md px-4 py-2"><FileText size={16}/> PDF</button>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="p-4 px-6">Timestamp</th>
                  {!selectedUser && <th className="p-4">Employee</th>}
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 text-right px-6">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedLogs.map(log => (
                  <tr key={log.id} className="text-sm hover:bg-mint-50/30 transition-colors group">
                    <td className="p-4 px-6 text-gray-500 whitespace-nowrap font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                    {!selectedUser && (
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-mint-100 text-mint-700 flex items-center justify-center font-bold text-xs">
                                    {log.userName?.charAt(0) || "S"}
                                </div>
                                <span className="font-bold text-gray-800">{log.userName || "System"}</span>
                            </div>
                        </td>
                    )}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border shadow-sm ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 font-medium">{log.details}</td>
                    <td className="p-4 text-right px-6">
                      <button onClick={() => handleDelete(log.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {paginatedLogs.length === 0 && (
               <div className="p-20 text-center text-gray-400 font-medium">No records found.</div>
            )}

            {/* PAGINATION */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Page {currentPage} of {totalPages || 1}</p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={18}/>
                </button>
                <button 
                  disabled={currentPage === totalPages || totalPages === 0} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={18}/>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* PROFILES GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {uniqueUsers.map((user) => (
            <div 
              key={user.id} 
              onClick={() => {setSelectedUser(user.id); setActiveTab("all"); setCurrentPage(1);}}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-mint-50 rounded-full flex items-center justify-center text-mint-600 mb-4 border-4 border-white shadow-md group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <h3 className="font-extrabold text-gray-800 text-lg leading-tight">{user.name}</h3>
              <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-widest font-bold">Audit History</p>
              <div className="mt-4 flex items-center gap-2 text-mint-600 font-bold text-xs bg-mint-50 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                Enter Profile <ChevronRight size={14}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;