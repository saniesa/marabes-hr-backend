import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from "recharts";
import * as api from "../../services/api"; 
import { Printer, Trophy, Users, ArrowRight, Award, Target, ChevronRight } from "lucide-react";

// ----------------------------
// 1. TYPES
// ----------------------------
interface Employee {
  id: string;
  name: string;
  jobPosition: string;
  department?: string;
}

interface ScoreRecord {
  id: string;
  date: string;
  categoryName: string;
  score: number;
  feedback?: string;
}

export default function ScoresReport() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allScores, setAllScores] = useState<Record<string, ScoreRecord[]>>({});
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // BRAND COLORS
  const COLORS = {
    mint: "#14b8a6",
    teal: "#0f766e",
    purple: "#8b5cf6",
    blue: "#3b82f6",
    orange: "#f97316",
    red: "#ef4444",
    gray: "#f3f4f6",
    chartPalette: ["#14b8a6", "#8b5cf6", "#3b82f6", "#f97316", "#ef4444", "#10b981"]
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    setLoading(true);
    try {
      const [usersData, catsData, scoresData] = await Promise.all([
        api.getUsers(),
        api.getCategories(),
        api.getScores()
      ]);

      setEmployees(usersData);

      const catMap: Record<string, string> = {};
      catsData.forEach((c: any) => { catMap[c.id] = c.name; });

      const scoreMap: Record<string, ScoreRecord[]> = {};
      scoresData.forEach((s: any) => {
        if (!scoreMap[s.userId]) scoreMap[s.userId] = [];
        scoreMap[s.userId].push({
          id: s.id,
          date: s.date,
          categoryName: catMap[s.categoryId] || s.categoryName || "General",
          score: s.score,
          feedback: s.feedback
        });
      });

      setAllScores(scoreMap);

    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // 2. DATA CALCULATIONS
  // ----------------------------
  const stats = useMemo(() => {
    let totalScore = 0;
    let totalCount = 0;
    
    // Performance Buckets (MATCHING EVALUATION PAGE LOGIC)
    let high = 0; // > 80 (Excellent)
    let mid = 0;  // 50-80 (Good)
    let low = 0;  // < 50 (Needs Improvement)
    
    const deptScores: Record<string, {total: number, count: number}> = {};
    const categoryScores: Record<string, {total: number, count: number}> = {};

    employees.forEach(emp => {
      const empScores = allScores[emp.id] || [];
      if (empScores.length === 0) return;

      const empAvg = empScores.reduce((a, b) => a + b.score, 0) / empScores.length;
      totalScore += empAvg;
      totalCount++;

      // LOGIC FOR FUNNEL STATS
      if (empAvg > 80) high++;
      else if (empAvg > 50) mid++;
      else low++;

      const dept = emp.department || emp.jobPosition || "General";
      if (!deptScores[dept]) deptScores[dept] = {total: 0, count: 0};
      deptScores[dept].total += empAvg;
      deptScores[dept].count++;

      empScores.forEach(s => {
        const catName = s.categoryName || "General";
        if (!categoryScores[catName]) categoryScores[catName] = {total: 0, count: 0};
        categoryScores[catName].total += s.score;
        categoryScores[catName].count++;
      });
    });

    const avgScore = totalCount > 0 ? (totalScore / totalCount) : 0;
    
    const deptData = Object.keys(deptScores).map(k => ({
      name: k,
      score: Math.round(deptScores[k].total / deptScores[k].count)
    })).sort((a,b) => b.score - a.score).slice(0, 5);

    const catData = Object.keys(categoryScores).map(k => ({
      name: k,
      value: Math.round(categoryScores[k].total / categoryScores[k].count)
    }));

    // --- FUNNEL: Logic aligned with "Quality of Work" metrics ---
    const passingCount = mid + high; 
    
    const funnelData = [
      { 
        value: 100, 
        name: `Total Staff`, 
        fill: "#e5e7eb", 
        displayLabel: `Total: ${totalCount}` 
      },
      { 
        value: totalCount > 0 ? (passingCount / totalCount) * 100 : 0, 
        name: `Good Performance (>50%)`, 
        fill: COLORS.mint, 
        displayLabel: `Good: ${passingCount}` 
      },
      { 
        value: totalCount > 0 ? (high / totalCount) * 100 : 0, 
        name: `Top Talent (>80%)`, 
        fill: COLORS.teal, 
        displayLabel: `Excellent: ${high}` 
      },
    ];

    return { avgScore, totalCount, high, mid, low, funnelData, deptData, catData };
  }, [employees, allScores]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Analysis...</div>;

  // ----------------------------
  // 3. INDIVIDUAL VIEW (PRINTABLE)
  // ----------------------------
  if (selectedEmp) {
    const scores = allScores[selectedEmp.id] || [];
    const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b.score,0)/scores.length) : 0;
    const sortedScores = [...scores].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="bg-white min-h-screen p-6 animate-in fade-in">
        <div className="flex justify-between items-center mb-6 no-print">
          <button onClick={() => setSelectedEmp(null)} className="flex items-center gap-2 text-gray-600 hover:text-teal-600">
             <ArrowRight className="rotate-180" size={20}/> Back to Dashboard
          </button>
          <button onClick={() => window.print()} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
             <Printer size={18}/> Print Report
          </button>
        </div>

        <div className="max-w-4xl mx-auto border border-gray-200 rounded-xl p-10 shadow-sm bg-white print:border-none print:shadow-none">
            <div className="flex justify-between items-end border-b pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{selectedEmp.name}</h1>
                    <p className="text-lg text-gray-500 mt-1">{selectedEmp.jobPosition} • {selectedEmp.department || "General"}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Current Score</p>
                    <div className={`text-5xl font-bold ${avg > 80 ? 'text-teal-600' : avg > 50 ? 'text-blue-600' : 'text-red-500'}`}>{avg}%</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
               <div className="col-span-2 border rounded-lg p-5">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4">Performance Trend</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sortedScores}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="date" tickFormatter={(d)=> d.substring(5,10)} fontSize={12}/>
                        <YAxis domain={[0,100]} fontSize={12}/>
                        <Line type="monotone" dataKey="score" stroke={COLORS.mint} strokeWidth={3} dot={{r:4}}/>
                        </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-gray-500 text-xs uppercase">Evaluations</p>
                      <p className="text-2xl font-bold text-gray-800">{scores.length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-gray-500 text-xs uppercase">Highest</p>
                      <p className="text-2xl font-bold text-green-600">
                          {Math.max(...scores.map(s=>s.score), 0)}
                      </p>
                  </div>
               </div>
            </div>

            <table className="w-full text-left text-sm border-t border-gray-100">
                <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                        <th className="py-3 font-medium">Date</th>
                        <th className="py-3 font-medium">Category</th>
                        <th className="py-3 font-medium">Score</th>
                        <th className="py-3 font-medium">Feedback</th>
                    </tr>
                </thead>
                <tbody>
                    {scores.map((s, i) => (
                        <tr key={i} className="border-b border-gray-50">
                            <td className="py-3 text-gray-800">{s.date}</td>
                            <td className="py-3 text-gray-800">{s.categoryName}</td>
                            <td className="py-3 font-bold text-teal-600">{s.score}</td>
                            <td className="py-3 text-gray-500 italic">{s.feedback || "-"}</td>
                        </tr>
                    ))}
                    {scores.length === 0 && (
                        <tr><td colSpan={4} className="py-4 text-center text-gray-400">No evaluation records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    );
  }

  // ----------------------------
  // 4. MAIN DASHBOARD
  // ----------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-1 space-y-6">

      {/* TOP ROW: 4 KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Average Score</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">{stats.avgScore.toFixed(1)}%</span>
                <span className="text-xs text-green-600 font-medium">Company Wide</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 h-1 rounded-full">
                <div className="h-full bg-teal-500 rounded-full" style={{width: `${stats.avgScore}%`}}></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Total Evaluations</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">{stats.totalCount * stats.avgScore > 0 ? Object.values(allScores).flat().length : 0}</span>
                <span className="text-xs text-blue-600 font-medium">Records</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 h-1 rounded-full">
                <div className="h-full bg-blue-500 rounded-full" style={{width: '70%'}}></div>
            </div>
        </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            {/* USE &gt; instead of > */}
            <p className="text-sm font-medium text-gray-500">Outstanding (&gt;80%)</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">{stats.high}</span>
                <span className="text-xs text-purple-600 font-medium">Employees</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 h-1 rounded-full">
                <div className="h-full bg-purple-500 rounded-full" style={{width: `${stats.totalCount > 0 ? (stats.high/stats.totalCount)*100 : 0}%`}}></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            {/* USE &lt; instead of < */}
            <p className="text-sm font-medium text-gray-500">Needs Training (&lt;50%)</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">{stats.low}</span>
                <span className="text-xs text-orange-600 font-medium">Attention Needed</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 h-1 rounded-full">
                <div className="h-full bg-orange-500 rounded-full" style={{width: '30%'}}></div>
            </div>
        </div>
      </div>

      {/* MIDDLE ROW: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
          
          {/* 1. Funnel (Talent Pyramid) - UPDATED TO 50/80 Logic */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Performance Pyramid</h3>
                <Target size={16} className="text-gray-400"/>
             </div>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                        <Tooltip formatter={(value, name, props) => [props.payload.displayLabel, "Count"]} />
                        <Funnel
                           data={stats.funnelData}
                           dataKey="value"
                           nameKey="name"
                           isAnimationActive
                        >
                            <LabelList position="right" fill="#6b7280" stroke="none" dataKey="name" fontSize={11} />
                        </Funnel>
                    </FunnelChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* 2. Bar Chart (Scores by Dept) */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Best Departments</h3>
                <Trophy size={16} className="text-gray-400"/>
             </div>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={stats.deptData}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6"/>
                        <XAxis type="number" domain={[0, 100]} hide/>
                        <YAxis dataKey="name" type="category" width={80} tick={{fill: '#6b7280', fontSize: 11}}/>
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}/>
                        <Bar dataKey="score" fill={COLORS.teal} barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* 3. Pie Chart (Categories) */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Score Categories</h3>
                <Award size={16} className="text-gray-400"/>
             </div>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.catData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.catData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS.chartPalette[index % COLORS.chartPalette.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>

      {/* BOTTOM ROW: EMPLOYEE LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <div>
                <h3 className="font-bold text-gray-800">Employee Performance Matrix</h3>
                <p className="text-xs text-gray-500 mt-1">Detailed list of all staff evaluations</p>
             </div>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left">
                 <thead className="bg-white text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                     <tr>
                         <th className="px-6 py-4">Employee</th>
                         <th className="px-6 py-4">Department</th>
                         <th className="px-6 py-4">Avg Score</th>
                         <th className="px-6 py-4">Efficiency</th>
                         <th className="px-6 py-4 text-right">View</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 text-sm">
                     {employees.map(emp => {
                         const empScores = allScores[emp.id] || [];
                         const avg = empScores.length ? Math.round(empScores.reduce((a,b)=>a+b.score,0)/empScores.length) : 0;
                         return (
                             <tr key={emp.id} onClick={() => setSelectedEmp(emp)} className="group hover:bg-teal-50/30 cursor-pointer transition-colors">
                                 <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 group-hover:bg-teal-100 group-hover:text-teal-700">
                                        {emp.name.charAt(0)}
                                     </div>
                                     {emp.name}
                                 </td>
                                 <td className="px-6 py-4 text-gray-500">{emp.department || emp.jobPosition}</td>
                                 <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded text-xs font-bold border
                                        ${avg > 80 ? 'bg-green-50 text-green-700 border-green-200' : 
                                          avg > 50 ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                          'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                         {avg}%
                                     </span>
                                 </td>
                                 <td className="px-6 py-4 w-48">
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${avg > 80 ? 'bg-teal-500' : avg > 50 ? 'bg-blue-400' : 'bg-red-400'}`} 
                                            style={{width: `${avg}%`}}
                                        ></div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-right text-gray-400 group-hover:text-teal-600">
                                     <ChevronRight size={18}/>
                                 </td>
                             </tr>
                         )
                     })}
                 </tbody>
             </table>
         </div>
      </div>
      
    </div>
  );
}