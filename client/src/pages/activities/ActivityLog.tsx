import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../App";
import { Activity, Filter, Download, RotateCw, Loader, Search, Lock, Trash2, FileText } from "lucide-react";
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
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,User,Action,Details,IP Address\n" +
      filteredLogs.map(log => 
        `"${new Date(log.timestamp).toLocaleString()}","${log.userName}","${log.action}","${log.details}","${log.ipAddress}"`
      ).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `activity-log-${Date.now()}.csv`);
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Marabes HR - Activity Log", 14, 15);
    
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
      startY: 20,
      styles: { fontSize: 8 },
    });

    doc.save(`activity-log-${Date.now()}.pdf`);
  };

  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("LOGIN")) return "bg-blue-100 text-blue-700";
    if (act.includes("CREATED")) return "bg-green-100 text-green-700";
    if (act.includes("DELETED")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || (log.action && log.action.toUpperCase() === filter.toUpperCase());
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (log.userName || "").toLowerCase().includes(searchLower) || (log.details || "").toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  if (user?.role !== "ADMIN") return <div className="p-10 text-center text-gray-500"><Lock className="mx-auto mb-2"/> Access Restricted</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Activity className="text-mint-600"/> Activity Log</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} className={`p-2 border rounded-lg ${isRefreshing ? 'animate-spin' : ''}`}><RotateCw size={18}/></button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"><Download size={16}/> CSV</button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-mint-600 text-white rounded-lg text-sm hover:bg-mint-700"><FileText size={16}/> PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 grid grid-cols-2 gap-4">
          <div className="relative"><Search className="absolute left-3 top-2.5 text-gray-400" size={18}/><input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
          <select className="border rounded-lg px-4 py-2 outline-none bg-white" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="TIME_OFF_REQUEST">Time Off</option>
              <option value="COURSE_CREATED">Course Created</option>
          </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Action</th>
              <th className="p-4">Details</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.map(log => (
              <tr key={log.id} className="text-sm hover:bg-gray-50">
                <td className="p-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4 font-bold">{log.userName || "System"}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${getActionColor(log.action)}`}>{log.action}</span></td>
                <td className="p-4 text-gray-600">{log.details}</td>
                <td className="p-4 text-right"><button onClick={() => handleDelete(log.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
   </div>
  );
};

export default ActivityLog;