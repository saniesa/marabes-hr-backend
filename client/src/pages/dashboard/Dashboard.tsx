import React, { useEffect, useState } from "react";
import { useAuth } from "../../App";
import * as api from "../../services/api";
import { AttendanceRecord } from "../../types";
import { Users, Calendar, Award, Fingerprint, Clock, AlertCircle } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    employeeCount: 0,
    pendingRequests: 0,
    avgScore: 0,
  });
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const users = await api.getUsers();
      const requests = await api.getTimeOffRequests();
      const scores = await api.getScores();

      const pending = requests.filter((r) => r.status === "PENDING").length;
      const totalScore = scores.reduce((acc, curr) => acc + curr.score, 0);
      const avg = scores.length ? Math.round(totalScore / scores.length) : 0;

      setStats({
        employeeCount: users.length,
        pendingRequests: pending,
        avgScore: avg,
      });

      if (user) {
        const todayRecord = await api.getTodayAttendance(user.id);
        setAttendance(todayRecord);

        const history = await api.getAttendanceHistory(user.id);
        setAttendanceHistory(history.slice(0, 7));
      }
    };
    fetchData();
  }, [user]);

  const handleFingerprintClick = async () => {
    if (!user || isScanning) return;
    setIsScanning(true);

    setTimeout(async () => {
      /**
       * LOGIC FOR 4 STEPS:
       * 1. No Record -> Clock In (Morning Start)
       * 2. Status CLOCKED_IN -> Clock Out (Start Break)
       * 3. Status ON_BREAK -> Clock In (End Break / Return)
       * 4. Status BACK_FROM_BREAK -> Clock Out (Final Finish)
       */
      const currentStatus = attendance?.status;

      if (!attendance || currentStatus === "ON_BREAK") {
        await api.clockIn(user.id);
      } else if (currentStatus === "CLOCKED_IN" || currentStatus === "BACK_FROM_BREAK") {
        await api.clockOut(user.id);
      }

      const updated = await api.getTodayAttendance(user.id);
      setAttendance(updated);
      const history = await api.getAttendanceHistory(user.id);
      setAttendanceHistory(history.slice(0, 7));
      setIsScanning(false);
    }, 1500);
  };

  const Card = ({ title, value, icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-mint-500 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-20`}>{icon}</div>
    </div>
  );

  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateHours = (record: AttendanceRecord) => {
    if (!record.clockInTime) return "--";
    const start = new Date(record.clockInTime).getTime();
    const end = record.clockOutTime ? new Date(record.clockOutTime).getTime() : new Date().getTime();
    let totalMs = end - start;

    if (record.breakStartTime && record.breakEndTime) {
      const bStart = new Date(record.breakStartTime).getTime();
      const bEnd = new Date(record.breakEndTime).getTime();
      totalMs = totalMs - (bEnd - bStart);
    }

    const hours = Math.max(0, totalMs / 36e5);
    return hours.toFixed(1);
  };

  // Helper to detect if a break was longer than 60 minutes
  const getBreakLateStatus = (record: AttendanceRecord) => {
    if (!record.breakStartTime || !record.breakEndTime) return null;
    const start = new Date(record.breakStartTime).getTime();
    const end = new Date(record.breakEndTime).getTime();
    const minutes = Math.floor((end - start) / 60000);
    return minutes > 60 ? { isLate: true, mins: minutes } : { isLate: false, mins: minutes };
  };

  const getStatusText = () => {
    if (isScanning) return "Scanning...";
    if (!attendance) return "Tap to Clock In";
    switch (attendance.status) {
      case "CLOCKED_IN": return "Tap to Start Break";
      case "ON_BREAK": return "Tap to End Break";
      case "BACK_FROM_BREAK": return "Tap to Clock Out";
      case "CLOCKED_OUT": return "Shift Completed";
      default: return "Tap to Clock In";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <span className="bg-mint-100 text-mint-800 px-3 py-1 rounded-full text-sm font-medium">
          Role: {user?.role}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-mint-500"></div>
          <h2 className="text-lg font-bold text-gray-700 mb-2">Attendance</h2>
          <p className="text-sm text-gray-400 mb-6">
            {currentTime.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <button
            onClick={handleFingerprintClick}
            disabled={attendance?.status === "CLOCKED_OUT"}
            className={`relative group flex items-center justify-center w-32 h-32 rounded-full border-4 transition-all duration-500 
               ${
                 isScanning
                   ? "border-mint-400 scale-95"
                   : (attendance?.status && attendance.status !== "CLOCKED_OUT")
                   ? "border-mint-500 bg-mint-50"
                   : attendance?.status === "CLOCKED_OUT"
                   ? "border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed"
                   : "border-gray-200 hover:border-mint-300 hover:shadow-lg"
               }
             `}
          >
            {isScanning && (
              <div className="absolute inset-0 rounded-full border-t-4 border-mint-600 animate-spin"></div>
            )}
            <Fingerprint
              size={64}
              className={`transition-colors duration-500 ${
                (attendance?.status && attendance.status !== "CLOCKED_OUT")
                  ? "text-mint-600"
                  : "text-gray-400 group-hover:text-mint-500"
              }`}
            />
          </button>

          <div className="mt-6 text-center">
            <div className="text-3xl font-mono font-bold text-gray-800 mb-1">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <p className={`text-sm font-medium ${attendance?.status === "CLOCKED_OUT" ? "text-gray-400" : "text-mint-600"}`}>
              {getStatusText()}
            </p>
          </div>

          <div className="mt-6 w-full grid grid-cols-2 gap-y-4 gap-x-2 text-center text-sm border-t pt-4">
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold">Clock In</p>
              <p className="font-semibold text-gray-700">{formatTime(attendance?.clockInTime)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold">Break Start</p>
              <p className="font-semibold text-gray-700">{formatTime(attendance?.breakStartTime)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold">Break End</p>
              <p className="font-semibold text-gray-700">{formatTime(attendance?.breakEndTime)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold">Clock Out</p>
              <p className="font-semibold text-gray-700">{formatTime(attendance?.clockOutTime)}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-mint-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Hello, {user?.name.split(" ")[0]}!
              </h2>
              <p className="opacity-90 max-w-md">
                Welcome to your Marabes dashboard.
                {user?.role === "ADMIN"
                  ? " You have pending approvals requiring your attention."
                  : " Don't forget to check your upcoming training sessions."}
              </p>
            </div>
            <div className="hidden md:block opacity-20">
              <Fingerprint size={100} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {user?.role === "ADMIN" && (
              <Card
                title="Employees"
                value={stats.employeeCount}
                icon={<Users className="text-mint-600" />}
                color="bg-mint-100"
              />
            )}
            <Card
              title="Time Off"
              value={stats.pendingRequests}
              icon={<Calendar className="text-orange-500" />}
              color="bg-orange-100"
            />
            <Card
              title="Avg Score"
              value={`${stats.avgScore}%`}
              icon={<Award className="text-purple-500" />}
              color="bg-purple-100"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="text-mint-600" size={20} />
          Recent Attendance
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Clock In</th>
                <th className="p-3 text-left">Clock Out</th>
                <th className="p-3 text-left">Hours (Net)</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceHistory.map((record) => {
                const breakStatus = getBreakLateStatus(record);
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="p-3">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="p-3">{formatTime(record.clockInTime)}</td>
                    <td className="p-3">
                      {formatTime(record.clockOutTime)}
                      {breakStatus?.isLate && (
                        <div className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={10}/> Late Break ({breakStatus.mins}m)
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-semibold">{calculateHours(record)}h</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === "CLOCKED_OUT" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {record.status === "CLOCKED_OUT" ? "Complete" : record.status === "ON_BREAK" ? "On Break" : "In Progress"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {attendanceHistory.length === 0 && (
            <div className="text-center py-8 text-gray-400">No attendance history yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;