import React, { useEffect, useState } from "react";
import * as api from "../services/api";
import { useAuth } from "../App";
import { UserScore, EvaluationCategory, Employee } from "../types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Plus, RotateCw, AlertCircle } from "lucide-react"; // <-- Changed RefreshCw to RotateCw

const Evaluations: React.FC = () => {
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<EvaluationCategory[]>([]);
  const [scores, setScores] = useState<UserScore[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [showAddScore, setShowAddScore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // <-- Added for animation
  
  // Form State
  const [newScore, setNewScore] = useState({
    userId: "",
    categoryId: "",
    score: 0,
    feedback: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setIsRefreshing(true); // Start animation
    setIsLoading(true);
    try {
      const [catsData, scoresData, usersData] = await Promise.all([
        api.getCategories(),
        api.getScores(),
        api.getUsers()
      ]);

      const uniqueCats = Array.from(new Map(catsData.map(item => [item.name, item])).values());

      setCategories(uniqueCats);
      setScores(scoresData || []);
      setEmployees(usersData || []);
      processChartData(uniqueCats, scoresData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
      // Small delay for smooth animation
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const processChartData = (cats: EvaluationCategory[], allScores: UserScore[]) => {
    if (!cats.length) return;
    
    const data = cats.map((cat) => {
     const catScores = allScores.filter((s) => 
        s.categoryId === cat.id || (s as any).categoryName === cat.name
      );

      return {
        name: cat.name,
        "Needs Improvement": catScores.filter((s) => s.score <= 50).length,
        "Good": catScores.filter((s) => s.score > 50 && s.score <= 80).length,
        "Excellent": catScores.filter((s) => s.score > 80).length,
      };
    });

    setChartData(data);
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScore.userId || !newScore.categoryId) {
      alert("Please select an employee and a category.");
      return;
    }

    try {
      const emp = employees.find((e) => String(e.id) === String(newScore.userId));
      const payload = {
        userId: newScore.userId, 
        userName: emp ? emp.name : "Unknown",
        categoryId: parseInt(newScore.categoryId), 
        score: parseInt(String(newScore.score)),   
        date: newScore.date,
        feedback: newScore.feedback,
        status: "Completed" 
      };
      await api.addScore(payload as any);
      setNewScore({
        userId: "", categoryId: "", score: 0, feedback: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowAddScore(false);
      init(); 
    } catch (err) {
      alert("Error adding score.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Performance Evaluations</h1>
            <p className="text-sm text-gray-500">Track progress across common metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
            {/* NEW REFRESH BUTTON (Matches Courses and Time Off) */}
            <button 
                onClick={init} 
                className={`p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-mint-600 hover:bg-mint-50 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
                title="Refresh Data"
            >
                <RotateCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            {user?.role === "ADMIN" && (
                <button
                    onClick={() => setShowAddScore(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 shadow-sm transition-colors"
                >
                    <Plus size={18} /> New Evaluation
                </button>
            )}
        </div>
      </div>

      {!isLoading && user?.role === "ADMIN" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-6 text-gray-800">Company-Wide Performance</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}} />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="Needs Improvement" stackId="a" fill="#f87171" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Good" stackId="a" fill="#60a5fa" />
                <Bar dataKey="Excellent" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SCORE LIST CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scores.map((score) => {
             const catName = categories.find(c => c.id === score.categoryId)?.name || score.categoryName;
             return (
                <div key={score.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded-md">{catName}</span>
                        <span className="text-xs text-gray-400">{score.date?.substring(0, 10)}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-4">{score.userName}</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className={`text-4xl font-bold ${score.score >= 80 ? 'text-green-500' : score.score >= 50 ? 'text-blue-500' : 'text-red-500'}`}>{score.score}</span>
                        <span className="text-sm text-gray-400 mb-1">/ 100</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                        <div className={`h-2 rounded-full ${score.score >= 80 ? 'bg-green-500' : score.score >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${score.score}%` }}></div>
                    </div>
                    {score.feedback ? <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-2">"{score.feedback}"</p> : <p className="text-sm text-gray-400 italic">No feedback provided</p>}
                </div>
             );
          })}
      </div>

      {/* ADD SCORE MODAL */}
      {showAddScore && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">New Evaluation</h2>
            <form onSubmit={handleAddScore} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Employee</label>
                <select required className="input-std" value={newScore.userId} onChange={(e) => setNewScore({ ...newScore, userId: e.target.value })}>
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Metric</label>
                <select required className="input-std" value={newScore.categoryId} onChange={(e) => setNewScore({ ...newScore, categoryId: e.target.value })}>
                  <option value="">Select Category</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Score (0-100)</label>
                 <div className="flex gap-4 items-center">
                    <input type="range" min="0" max="100" className="flex-1 accent-mint-600" value={newScore.score} onChange={(e) => setNewScore({ ...newScore, score: parseInt(e.target.value) || 0 })} />
                    <input type="number" min="0" max="100" className="input-std w-20 text-center font-bold" value={newScore.score} onChange={(e) => setNewScore({ ...newScore, score: parseInt(e.target.value) || 0 })} />
                 </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Feedback</label>
                <textarea className="input-std" rows={2} placeholder="Constructive feedback..." value={newScore.feedback} onChange={(e) => setNewScore({ ...newScore, feedback: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Date</label>
                <input type="date" required className="input-std" value={newScore.date} onChange={(e) => setNewScore({ ...newScore, date: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddScore(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-mint-600 text-white rounded-lg">Save Evaluation</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{` .input-std { width: 100%; padding: 0.6rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; } `}</style>
    </div>
  );
};

export default Evaluations;