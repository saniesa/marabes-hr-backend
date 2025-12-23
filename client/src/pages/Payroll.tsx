import React, { useState, useEffect, useMemo } from "react";
import { 
  DollarSign, TrendingUp, Users, Activity, 
  Settings, PieChart, Save, Download, Plus 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import * as api from "../services/api";
import { useAuth } from "../App";
import toast from "react-hot-toast";

const Payroll = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [employees, setEmployees] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, pays] = await Promise.all([api.getUsers(), api.getPayrollHistory()]);
      setEmployees(emps);
      setHistory(pays);
    } catch (err) { toast.error("Failed to sync financial data"); }
    finally { setLoading(false); }
  };

  // --- LOGIC: CALCULATE DEPT AVERAGES ---
  const deptStats = useMemo(() => {
    const depts = ["IT Services", "Finance and Accounting", "Human Resources", "Management"];
    return depts.map(d => {
      const deptEmps = employees.filter(e => e.department === d);
      const avg = deptEmps.length > 0 
        ? deptEmps.reduce((s, c) => s + parseFloat(c.baseSalary || 0), 0) / deptEmps.length 
        : 0;
      return { name: d, average: Math.round(avg), count: deptEmps.length };
    });
  }, [employees]);

  const handleSalaryChange = async (id: number, val: string) => {
    const amount = parseFloat(val);
    if (isNaN(amount)) return;
    try {
      await api.updateBaseSalary(id, amount);
      toast.success("Base salary updated");
      loadData();
    } catch (err) { toast.error("Update failed"); }
  };

  if (loading) return <div className="p-20 text-center font-bold text-mint-600 animate-pulse">Syncing Finance Module...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll & Finance</h1>
          <p className="text-gray-500 text-sm">Manage contract salaries and monthly payouts</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {["Dashboard", "Salary Entries", "Monthly Run"].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === t ? "bg-white text-mint-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: FINANCIAL DASHBOARD */}
      {activeTab === "Dashboard" && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Budget" value={`$${employees.reduce((s,c) => s + parseFloat(c.baseSalary || 0), 0).toLocaleString()}`} icon={<DollarSign/>} color="text-mint-600 bg-mint-50" />
            <StatCard label="Company Average" value={`$${(deptStats.reduce((s,c) => s + c.average, 0) / 4).toFixed(0)}`} icon={<TrendingUp/>} color="text-blue-600 bg-blue-50" />
            <StatCard label="Active Staff" value={`${employees.length} Members`} icon={<Users/>} color="text-purple-600 bg-purple-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border h-80">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-6">Avg Salary by Department</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="average" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border">
               <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Department Strength</h3>
               <div className="space-y-4">
                  {deptStats.map(d => (
                    <div key={d.name} className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">{d.name}</span>
                       <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-mint-500" style={{width: `${(d.count / employees.length) * 100}%`}}></div>
                          </div>
                          <span className="text-xs font-bold">{d.count}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALARY ENTRIES (CONTRACTS) */}
      {activeTab === "Salary Entries" && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in slide-in-from-right-4">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black border-b">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Entity / Position</th>
                <th className="p-4">Department</th>
                <th className="p-4">Base Monthly Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{emp.name}</td>
                  <td className="p-4 text-gray-500">{emp.jobPosition}</td>
                  <td className="p-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold uppercase">{emp.department}</span></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 group">
                      <span className="text-gray-400 font-bold">$</span>
                      <input 
                        type="number" 
                        defaultValue={emp.baseSalary} 
                        onBlur={(e) => handleSalaryChange(emp.id, e.target.value)}
                        className="w-24 border-b border-transparent group-hover:border-gray-200 focus:border-mint-500 outline-none p-1 font-mono transition-all"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-mint-50 text-[10px] text-mint-700 font-bold text-center uppercase tracking-widest">
            Changes are saved automatically when you click away from the input
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY RUN (HISTORY & PROCESS) */}
      {activeTab === "Monthly Run" && (
        <div className="space-y-6 animate-in slide-in-from-left-4">
          <div className="bg-white p-6 rounded-2xl border border-mint-100 flex justify-between items-center shadow-sm">
             <div>
                <h3 className="font-bold text-gray-800 text-lg">Process Monthly Payout</h3>
                <p className="text-sm text-gray-500">Generate salaries based on attendance and the 8-hour workday rule.</p>
             </div>
             <button 
                onClick={() => {
                  const m = new Date().toLocaleString('en-US', { month: 'long' });
                  api.runPayroll(m, 2025).then(() => loadData());
                }}
                className="bg-mint-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-mint-700 transition-all flex items-center gap-2 shadow-lg shadow-mint-100"
             >
                <Activity size={18} /> Run {new Date().toLocaleString('default', { month: 'short' })} Payroll
             </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
                   <tr>
                      <th className="p-4">Staff</th>
                      <th className="p-4">Period</th>
                      <th className="p-4">Actual Hours</th>
                      <th className="p-4">Net Payout</th>
                      <th className="p-4">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y">
                   {history.map(h => (
                     <tr key={h.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold">{h.name}</td>
                        <td className="p-4 text-gray-500">{h.month} {h.year}</td>
                        <td className="p-4"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{parseFloat(h.totalHours).toFixed(1)}h</span></td>
                        <td className="p-4 font-black text-mint-700">${parseFloat(h.netSalary).toLocaleString()}</td>
                        <td className="p-4">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${h.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {h.status}
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
    <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-xl font-black text-gray-800">{value}</h3>
    </div>
  </div>
);

export default Payroll;