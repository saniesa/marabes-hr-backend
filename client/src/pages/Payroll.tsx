import React, { useEffect, useState } from "react";
import { 
  Banknote, Plus, Search, Filter, ChevronRight, 
  DollarSign, TrendingUp, Users, Download 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as api from "../services/api";
import { useAuth } from "../App";
import toast from "react-hot-toast";

const Payroll = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const data = await api.getPayrollHistory();
      setHistory(data);
    } catch (err) {
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    const month = new Date().toLocaleString('default', { month: 'long' });
    const year = new Date().getFullYear();
    
    toast.promise(api.generatePayroll(month, year), {
      loading: 'Calculating salaries...',
      success: 'Payroll generated successfully!',
      error: 'Calculation failed',
    }).then(() => fetchPayroll());
  };

  // Logic for Dept Chart
  const deptData = history.reduce((acc: any, curr) => {
    const dept = curr.department || "General";
    const existing = acc.find((item: any) => item.name === dept);
    if (existing) {
      existing.value += parseFloat(curr.netSalary);
    } else {
      acc.push({ name: dept, value: parseFloat(curr.netSalary) });
    }
    return acc;
  }, []);

  if (loading) return <div className="p-8 text-center text-mint-600">Loading Finance Module...</div>;

  return (
    <div className=" animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
          <p className="text-gray-500 text-sm">Review and process employee compensation</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleRunPayroll}
            className="flex items-center gap-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700 transition-all shadow-md"
          >
            <Plus size={18} /> Run Monthly Payroll
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-mint-100 text-mint-600 rounded-lg"><DollarSign /></div>
            <div>
              <p className="text-sm text-gray-500">Total Monthly Spend</p>
              <h3 className="text-2xl font-bold">${history.reduce((s, c) => s + parseFloat(c.netSalary), 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp /></div>
            <div>
              <p className="text-sm text-gray-500">Avg. Net Salary</p>
              <h3 className="text-2xl font-bold">${history.length > 0 ? (history.reduce((s, c) => s + parseFloat(c.netSalary), 0) / history.length).toFixed(0) : 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Users /></div>
            <div>
              <p className="text-sm text-gray-500">Processed Staff</p>
              <h3 className="text-2xl font-bold">{new Set(history.map(h => h.userId)).size} Employees</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
        <h3 className="font-bold text-gray-800 mb-4">Salary Distribution by Department</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={deptData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
            <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payroll History Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Payroll Records</h3>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-white rounded border border-gray-200 text-gray-500"><Search size={16}/></button>
            <button className="p-2 hover:bg-white rounded border border-gray-200 text-gray-500"><Filter size={16}/></button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white text-xs text-gray-400 uppercase font-semibold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Hours</th>
              <th className="px-6 py-4">Bonus/Deduct</th>
              <th className="px-6 py-4">Net Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {history.map((record) => (
              <tr key={record.id} className="hover:bg-mint-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{record.name}</div>
                  <div className="text-xs text-gray-500">{record.department}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">{record.month} {record.year}</td>
                <td className="px-6 py-4 text-gray-600 font-medium">{record.totalHours}h</td>
                <td className="px-6 py-4">
                  <span className="text-green-600 font-medium">+${record.bonuses}</span>
                  <span className="text-red-400 text-xs ml-1">(-${record.deductions})</span>
                </td>
                <td className="px-6 py-4 font-bold text-mint-700">${parseFloat(record.netSalary).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-mint-600 transition-colors">
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;