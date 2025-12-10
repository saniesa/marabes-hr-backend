import React, { useEffect, useState } from "react";
import * as api from "../services/api";
import { useAuth } from "../App";
import { UserScore, EvaluationCategory, Employee } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Plus, X } from "lucide-react";

const Evaluations: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<EvaluationCategory[]>([]);
  const [scores, setScores] = useState<UserScore[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddScore, setShowAddScore] = useState(false);
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
    const cats = await api.getCategories();
    const s = await api.getScores();
    const emps = await api.getUsers();
    setCategories(cats);
    setScores(s);
    setEmployees(emps);
    processChartData(cats, s);
  };

  const processChartData = (
    cats: EvaluationCategory[],
    allScores: UserScore[]
  ) => {
    const buckets = [
      { label: "0-30", min: 0, max: 30 },
      { label: "31-50", min: 31, max: 50 },
      { label: "51-70", min: 51, max: 70 },
      { label: "71-100", min: 71, max: 100 },
    ];

    const data = cats.map((cat) => {
      const catScores = allScores.filter((s) => s.categoryId === cat.id);
      const entry: any = { name: cat.name };

      buckets.forEach((b) => {
        entry[b.label] = catScores.filter(
          (s) => s.score >= b.min && s.score <= b.max
        ).length;
      });
      return entry;
    });

    setChartData(data);
  };
const handleAddScore = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("Form submitted!", newScore);
  if (!newScore.userId || !newScore.categoryId) {
    alert("Please select employee and category");
    return;
  }

  try {
    const emp = employees.find((e) => e.id === newScore.userId);
    if (!emp) return;

    await api.addScore({
      ...newScore,
      userName: emp.name,
    });

    // reset form
    setNewScore({
      userId: "",
      categoryId: "",
      score: 0,
      feedback: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowAddScore(false);

    // refresh scores
    const s = await api.getScores(); // make sure this matches your backend: "/scores"
    setScores(s);
    processChartData(categories, s);
  } catch (err) {
    console.error("Failed to add score:", err);
    alert("Failed to add score. Check console for details.");
  }
};


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Evaluations & Performance
        </h1>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setShowAddScore(true)}
            className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
          >
            <Plus size={18} /> Add Score
          </button>
        )}
      </div>

      {user?.role === "ADMIN" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-mint-800">
            Score Distribution Report
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="0-30" fill="#f87171" stackId="a" />
                <Bar dataKey="31-50" fill="#fbbf24" stackId="a" />
                <Bar dataKey="51-70" fill="#60a5fa" stackId="a" />
                <Bar dataKey="71-100" fill="#34d399" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">
            Number of employees per score range per category
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scores
          .filter((s) => user?.role === "ADMIN" || s.userId === user?.id)
          .map((score) => (
            <div
              key={score.id}
              className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    {categories.find((c) => c.id === score.categoryId)?.name}
                  </span>
                  <span className="text-xs text-gray-400">{score.date}</span>
                </div>
                <h3 className="font-medium text-gray-800">{score.userName}</h3>
                {score.feedback && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    "{score.feedback}"
                  </p>
                )}
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-3xl font-bold text-gray-800">
                    {score.score}
                  </span>
                  <span className="text-xs text-gray-500 mb-1">/100</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      score.score > 70
                        ? "bg-mint-500"
                        : score.score > 50
                        ? "bg-blue-400"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${score.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {showAddScore && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Evaluation Score</h2>
              <button onClick={() => setShowAddScore(false)}>
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddScore} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Employee</label>
                <select
                  required
                  className="input-std"
                  value={newScore.userId}
                  onChange={(e) =>
                    setNewScore({ ...newScore, userId: e.target.value })
                  }
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Category</label>
                <select
                  required
                  className="input-std"
                  value={newScore.categoryId}
                  onChange={(e) =>
                    setNewScore({ ...newScore, categoryId: e.target.value })
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                 <label className="text-xs text-gray-500">Score (0-100)</label>
                 <input
                     type="number"
                     required
                     min={0}
                     max={100}
                     className="input-std"
                     value={newScore.score}
                     onChange={(e) => {
                    const val = parseInt(e.target.value);
                             setNewScore({
                              ...newScore,
                              score: isNaN(val) ? 0 : val,
                              });
                            }}
                          />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Feedback (Optional)
                </label>
                <textarea
                  className="input-std"
                  rows={3}
                  value={newScore.feedback}
                  onChange={(e) =>
                    setNewScore({ ...newScore, feedback: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Date</label>
                <input
                  type="date"
                  required
                  className="input-std"
                  value={newScore.date}
                  onChange={(e) =>
                    setNewScore({ ...newScore, date: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddScore(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
                >
                  Add Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
         .input-std { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; }
         .input-std:focus { border-color: #14b8a6; }
       `}</style>
    </div>
  );
};

export default Evaluations;
