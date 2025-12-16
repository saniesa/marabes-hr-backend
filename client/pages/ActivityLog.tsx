import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../App";
import { Activity, Filter, Download, RefreshCw, Loader, Search, Lock } from "lucide-react";

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

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Fetch from the backend route we created
      const res = await axios.get(`${API_URL}/activity`);
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to load activity logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("LOGIN")) return "bg-blue-100 text-blue-700";
    if (act.includes("LOGOUT")) return "bg-gray-100 text-gray-700";
    if (act.includes("CREATED") || act.includes("ADDED")) return "bg-green-100 text-green-700";
    if (act.includes("DELETED") || act.includes("REMOVED")) return "bg-red-100 text-red-700";
    if (act.includes("UPDATED")) return "bg-yellow-100 text-yellow-700";
    if (act.includes("ENROLL")) return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-600";
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString();
  };

  // Filter Logic
  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.action === filter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (log.userName || "").toLowerCase().includes(searchLower) ||
      (log.details || "").toLowerCase().includes(searchLower) ||
      (log.action || "").toLowerCase().includes(searchLower);
      
    return matchesFilter && matchesSearch;
  });

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,User,Action,Details,IP Address\n" +
      filteredLogs
        .map(
          (log) =>
            `"${formatTime(log.timestamp)}","${log.userName}","${log.action}","${log.details}","${log.ipAddress}"`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity-log-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <Lock size={48} className="mb-4 opacity-50"/>
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p>Only Administrators can view system logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-mint-600" size={28} />
            Activity Log
            </h1>
            <p className="text-gray-500 text-sm">Track system events and user actions</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={loadLogs}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                title="Refresh Logs"
            >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 shadow-sm transition-colors"
            >
                <Download size={18} />
                Export CSV
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 outline-none appearance-none bg-white cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="TIME_OFF_REQUEST">Time Off</option>
              <option value="USER_UPDATED">User Updates</option>
              <option value="COURSE_ENROLLMENT">Course Enrollment</option>
              <option value="SCORE_ADDED">Scores Added</option>
              <option value="COURSE_CREATED">Course Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-12 flex justify-center text-mint-600">
                <Loader className="animate-spin" size={32} />
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">IP</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.userName || "System"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                        {log.ipAddress || "-"}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}

        {!loading && filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Activity size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No activity logs found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;