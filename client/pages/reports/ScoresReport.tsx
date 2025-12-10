import React, { useState, useEffect } from "react";
import * as api from "../../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const ScoresReport: React.FC = () => {
  const [scoresTrend, setScoresTrend] = useState<any[]>([]);

  useEffect(() => {
    const loadScores = async () => {
      const scores = await api.getScores();
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const trendData: any = {};
      scores.forEach((score) => {
        const month = new Date(score.date).getMonth();
        const monthName = monthNames[month];
        if (!trendData[monthName]) trendData[monthName] = { month: monthName, total: 0, count: 0 };
        trendData[monthName].total += score.score;
        trendData[monthName].count += 1;
      });
      const trend = Object.values(trendData).map((d: any) => ({
        month: d.month,
        average: Math.round(d.total / d.count),
      }));
      setScoresTrend(trend);
    };
    loadScores();
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Scores Trend</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={scoresTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="average" stroke="#14b8a6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoresReport;
