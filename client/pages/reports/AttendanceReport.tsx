import React, { useEffect, useState } from "react";
import * as api from "../../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const AttendanceReport: React.FC = () => {
  const [attendanceChart, setAttendanceChart] = useState<any[]>([]);

  useEffect(() => {
    const loadAttendance = async () => {
      const employees = await api.getUsers();
      const attendanceRaw: any[] = [];
      for (const emp of employees) {
        const history = await api.getAttendanceHistory(emp.id);
        history.forEach((h: any) => {
          attendanceRaw.push({
            date: new Date(h.date).toLocaleDateString("en-US"),
            present: h.clockInTime ? 1 : 0,
          });
        });
      }

      const attendanceMap: any = {};
      attendanceRaw.forEach((record) => {
        if (!attendanceMap[record.date]) attendanceMap[record.date] = { present: 0, total: 0 };
        attendanceMap[record.date].present += record.present;
        attendanceMap[record.date].total += 1;
      });

      const formattedAttendance = Object.keys(attendanceMap).map((date) => ({
        date,
        attendancePercentage: Math.round((attendanceMap[date].present / attendanceMap[date].total) * 100),
      }));

      formattedAttendance.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setAttendanceChart(formattedAttendance);
    };
    loadAttendance();
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Report</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={attendanceChart}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(value: any) => `${value}%`} />
            <Legend />
            <Line type="monotone" dataKey="attendancePercentage" name="Attendance %" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceReport;
