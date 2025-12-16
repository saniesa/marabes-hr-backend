import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import * as api from "../services/api";
import { TimeOffRequest } from "../types";
import { Check, X, Download, Trash2 } from "lucide-react";

const TimeOff: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [newRequest, setNewRequest] = useState({
    type: "Vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({ total: 0, daysTaken: 0 });

  useEffect(() => {
    loadRequests();
    if (user) loadStats();
  }, [user]);

  const loadRequests = async () => {
    const all = await api.getTimeOffRequests();
    if (user?.role === "ADMIN") {
      setRequests(all);
    } else {
      setRequests(all.filter((r) => r.userId === user?.id));
    }
  };

  const loadStats = async () => {
    if (!user) return;
    const response = await fetch(
      `http://localhost:5000/timeoff/stats/${user.id}`
    );
    const data = await response.json();
    setStats(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await api.addTimeOffRequest({
      userId: user.id,
      userName: user.name,
      type: newRequest.type as any,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      reason: newRequest.reason,
    });
    setShowForm(false);
    setNewRequest({ type: "Vacation", startDate: "", endDate: "", reason: "" });
    loadRequests();
    loadStats();
  };

  const handleStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    await api.updateTimeOffStatus(
      id,
      status,
      status === "APPROVED" ? "Approved" : "Not approved"
    );
    loadRequests();
  };
  
const handleDelete = async (id: string) => {
  if (!window.confirm("Delete this request?")) return;
  await api.deleteTimeOffRequest(id); // ✅ uses the new api function
  loadRequests();
};

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "RequestID,User,Type,Start,End,Status\n" +
      requests
        .map(
          (r) =>
            `${r.id},${r.userName},${r.type},${r.startDate},${r.endDate},${r.status}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "timeoff_requests.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Time Off</h1>
        <div className="flex gap-2">
          {user?.role === "ADMIN" && (
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={16} /> Export
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            + New Request
          </button>
        </div>
      </div>

      {user?.role === "EMPLOYEE" && (
        <div className="bg-mint-50 border border-mint-200 rounded-lg p-4 flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-mint-700">{stats.total}</p>
            <p className="text-xs text-gray-600">Total Requests</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-mint-700">
              {stats.daysTaken}
            </p>
            <p className="text-xs text-gray-600">Days Taken</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-mint-700">
              {20 - (stats.daysTaken || 0)}
            </p>
            <p className="text-xs text-gray-600">Days Remaining</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-mint-500">
          <h3 className="font-bold mb-4">Submit Request</h3>
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select
                className="input-std"
                value={newRequest.type}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, type: e.target.value })
                }
              >
                <option>Vacation</option>
                <option>Sick</option>
                <option>Personal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Start</label>
              <input
                type="date"
                required
                className="input-std"
                value={newRequest.startDate}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">End</label>
              <input
                type="date"
                required
                className="input-std"
                value={newRequest.endDate}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, endDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Reason</label>
              <input
                type="text"
                className="input-std"
                value={newRequest.reason}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, reason: e.target.value })
                }
              />
            </div>
            <button type="submit" className="btn-primary">
              Submit
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Type</th>
              <th className="p-4">Dates</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="p-4 font-medium">{req.userName}</td>
                <td className="p-4">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {req.type}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {req.startDate} to {req.endDate}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold 
                      ${
                        req.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : req.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {user?.role === "ADMIN" && req.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleStatus(req.id, "APPROVED")}
                          className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleStatus(req.id, "REJECTED")}
                          className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                    {(user?.role === "ADMIN" || req.userId === user?.id) && (
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="p-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No requests found.
          </div>
        )}
      </div>

      <style>{`
        .btn-primary { background-color: #0d9488; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; transition: background 0.2s; }
        .btn-primary:hover { background-color: #0f766e; }
        .btn-secondary { background-color: white; border: 1px solid #d1d5db; color: #374151; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background 0.2s; }
        .btn-secondary:hover { background-color: #f9fafb; }
        .input-std { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; }
      `}</style>
    </div>
  );
};

export default TimeOff;
