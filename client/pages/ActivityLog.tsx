import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Activity, Filter, Download } from "lucide-react";

interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

const ActivityLog: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    // Mock data - replace with API call
    const mockLogs: LogEntry[] = [
      {
        id: "1",
        userId: "1",
        userName: "Admin User",
        action: "LOGIN",
        details: "User logged in successfully",
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.1",
      },
      {
        id: "2",
        userId: "2",
        userName: "Sarah Johnson",
        action: "TIME_OFF_REQUEST",
        details: "Submitted vacation request for Dec 20-25",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: "192.168.1.2",
      },
      {
        id: "3",
        userId: "1",
        userName: "Admin User",
        action: "USER_UPDATED",
        details: "Updated employee Mike Chen profile",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        ipAddress: "192.168.1.1",
      },
      {
        id: "4",
        userId: "3",
        userName: "Mike Chen",
        action: "COURSE_ENROLLMENT",
        details: "Enrolled in Advanced Excel course",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        ipAddress: "192.168.1.3",
      },
      {
        id: "5",
        userId: "1",
        userName: "Admin User",
        action: "SCORE_ADDED",
        details: "Added evaluation score for Sarah Johnson",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        ipAddress: "192.168.1.1",
      },
    ];
    setLogs(mockLogs);
  };

  const getActionColor = (action: string) => {
    const colors: any = {
      LOGIN: "bg-blue-100 text-blue-700",
      LOGOUT: "bg-gray-100 text-gray-700",
      TIME_OFF_REQUEST: "bg-purple-100 text-purple-700",
      USER_UPDATED: "bg-yellow-100 text-yellow-700",
      USER_CREATED: "bg-green-100 text-green-700",
      USER_DELETED: "bg-red-100 text-red-700",
      COURSE_ENROLLMENT: "bg-mint-100 text-mint-700",
      SCORE_ADDED: "bg-orange-100 text-orange-700",
    };
    return colors[action] || "bg-gray-100 text-gray-700";
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.action === filter;
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,User,Action,Details,IP Address\n" +
      filteredLogs
        .map(
          (log) =>
            `${formatTime(log.timestamp)},${log.userName},${log.action},${
              log.details
            },${log.ipAddress}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity-log-${Date.now()}.csv`);
    link.click();
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-mint-600" size={28} />
          Activity Log
        </h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by user or details..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 outline-none appearance-none"
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
            </select>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatTime(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {log.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Activity size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No activity logs found</p>
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredLogs.length}</span>{" "}
              entries
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-white">
                Previous
              </button>
              <button className="px-3 py-1 bg-mint-600 text-white rounded-lg text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-white">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-white">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
