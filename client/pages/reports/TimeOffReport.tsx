import React, { useEffect, useState } from "react";
import * as api from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TimeOffReport: React.FC = () => {
  const [timeOffStats, setTimeOffStats] = useState<any[]>([]);

  useEffect(() => {
    const loadTimeOff = async () => {
      const requests = await api.getTimeOffRequests();
      const typeMap: any = { Vacation: 0, Sick: 0, Personal: 0 };
      requests.forEach((req) => {
        if (req.status === "APPROVED") typeMap[req.type] = (typeMap[req.type] || 0) + 1;
      });
      setTimeOffStats([
        { name: "Vacation", value: typeMap.Vacation },
        { name: "Sick", value: typeMap.Sick },
        { name: "Personal", value: typeMap.Personal },
      ]);
    };
    loadTimeOff();
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Time Off Requests</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timeOffStats}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeOffReport;
