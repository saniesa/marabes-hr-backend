import React, { useEffect, useState } from "react";
import * as api from "../services/api";
import { Course } from "../types";
import { 
  Users, PlayCircle, Plus, Trash2, X, Search, 
  Clock, BookOpen, CheckCircle, Lock, ShieldCheck, Check, Ban, MonitorPlay
} from "lucide-react";
import { useAuth } from "../App";
import axios from "axios";

// Points to your backend
const API_URL = "http://localhost:5000/api";

interface ExtendedCourse extends Course {
  duration?: string;
  instructor?: string;
  progress?: number; 
}

interface EnrollmentRequest {
  id: number;
  userName: string;
  courseTitle: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const Courses: React.FC = () => {
  const { user } = useAuth();
  
  // Data State
  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  // Store status: { 'courseId': 'PENDING' | 'APPROVED' }
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, string>>({});
  
  // UI State
  const [activeTab, setActiveTab] = useState<"browse" | "my-learning">("browse");
  const [search, setSearch] = useState("");
  
  // Modals
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<ExtendedCourse | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminRequests, setAdminRequests] = useState<EnrollmentRequest[]>([]);

  // Form State
  const [newCourse, setNewCourse] = useState({
    title: "", description: "", imageUrl: "", duration: "", instructor: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
        const c = await api.getCourses();
        const enrichedCourses = c.map((course: any) => ({
            ...course,
            duration: course.duration || "2h 30m",
            instructor: course.instructor || "Marabes Expert",
            progress: Math.floor(Math.random() * 100) 
        }));
        setCourses(enrichedCourses);
        
        if (user) {
            // Fetch MY enrollment status
            // Matches backend: router.get("/my/:userId")
            const res = await axios.get(`${API_URL}/enrollments/my/${user.id}`);
            const statusMap: Record<string, string> = {};
            res.data.forEach((e: any) => {
                statusMap[e.courseId] = e.status;
            });
            setEnrollmentStatus(statusMap);
        }
    } catch (err) {
        console.error("Failed to load data", err);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    try {
        await axios.post(`${API_URL}/enrollments`, { userId: user.id, courseId });
        // Optimistic update: Show Pending immediately
        setEnrollmentStatus(prev => ({ ...prev, [courseId]: 'PENDING' }));
        alert("Request sent! Waiting for Admin approval.");
    } catch (err) {
        alert("Enrollment failed or already requested.");
    }
  };

  // --- ADMIN FUNCTIONS ---
  const openAdminPanel = async () => {
      try {
          const res = await axios.get(`${API_URL}/enrollments/admin/requests`);
          setAdminRequests(res.data);
          setShowAdminPanel(true);
      } catch (err) {
          console.error(err);
      }
  };

  const handleAdminAction = async (id: number, status: "APPROVED" | "REJECTED") => {
      await axios.put(`${API_URL}/enrollments/${id}`, { status });
      // Refresh the list after action
      const res = await axios.get(`${API_URL}/enrollments/admin/requests`);
      setAdminRequests(res.data);
      // Reload main data to update counters if needed
      loadData();
  };

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this course?")) return;
    try {
        await axios.delete(`${API_URL}/courses/${id}`);
        loadData();
    } catch (err) { console.error(err); }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addCourse(newCourse);
    setShowAddCourse(false);
    setNewCourse({ title: "", description: "", imageUrl: "", duration: "", instructor: "" });
    loadData();
  };

  // --- FILTERING ---
  const filteredCourses = courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
      if (activeTab === "my-learning") {
          // Show if I have ANY status (Pending or Approved)
          return matchesSearch && enrollmentStatus[c.id]; 
      }
      return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="text-mint-600"/> Training Center
            </h1>
            <p className="text-gray-500 text-sm">Upgrade your skills and knowledge</p>
        </div>
        
        {user?.role === "ADMIN" && (
          <div className="flex gap-2">
             <button
                onClick={openAdminPanel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
             >
                <ShieldCheck size={18} /> Manage Requests
             </button>
             <button
                onClick={() => setShowAddCourse(true)}
                className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 shadow-sm transition-colors"
             >
                <Plus size={18} /> Create Course
             </button>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex gap-4">
              <button onClick={() => setActiveTab("browse")} className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "browse" ? "text-mint-600 border-mint-600" : "text-gray-500 border-transparent"}`}>
                  Browse Catalog
              </button>
              <button onClick={() => setActiveTab("my-learning")} className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "my-learning" ? "text-mint-600 border-mint-600" : "text-gray-500 border-transparent"}`}>
                  My Learning
              </button>
          </div>
          <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500" value={search} onChange={(e) => setSearch(e.target.value)}/>
          </div>
      </div>

      {/* COURSE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
            const status = enrollmentStatus[course.id]; // 'APPROVED', 'PENDING', or undefined
            const isLocked = status !== 'APPROVED';

            return (
                <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                    {/* Image Area */}
                    <div className="h-48 overflow-hidden relative">
                        <img
                            src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop"}
                            className={`w-full h-full object-cover transition-transform duration-500 ${!isLocked ? 'group-hover:scale-105 cursor-pointer' : 'grayscale-[50%]'}`}
                            onClick={() => !isLocked && setViewingCourse(course)}
                        />
                        {/* Status Overlays */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {status === 'PENDING' && <div className="bg-orange-500/90 p-3 rounded-full shadow-lg"><Lock className="text-white" size={32}/></div>}
                            {status === 'APPROVED' && <div className="bg-mint-600/90 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><PlayCircle className="text-white" size={40}/></div>}
                        </div>
                        {user?.role === "ADMIN" && (
                            <button onClick={(e) => handleDeleteCourse(course.id, e)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md pointer-events-auto">
                                <Trash2 size={14} />
                            </button>
                        )}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded backdrop-blur-sm">
                            {course.duration}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                        <h3 className="font-bold text-lg text-gray-800 line-clamp-1 mb-2">{course.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{course.description}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 border-t border-gray-50 pt-4">
                            <div className="flex items-center gap-1"><Users size={14} /> {course.enrolledCount || 0} Students</div>
                            <div className="flex items-center gap-1"><Clock size={14} /> {course.instructor}</div>
                        </div>

                        {/* Action Buttons */}
                        {!status && (
                            <button onClick={() => handleEnroll(course.id)} className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                Enroll Now
                            </button>
                        )}
                        {status === 'PENDING' && (
                            <button disabled className="w-full py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                                <Lock size={14}/> Pending Admin Approval
                            </button>
                        )}
                        {status === 'APPROVED' && (
                            <button onClick={() => setViewingCourse(course)} className="w-full py-2 bg-mint-600 text-white text-sm font-bold rounded-lg hover:bg-mint-700 transition-colors flex items-center justify-center gap-2">
                                <PlayCircle size={16}/> Start Learning
                            </button>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* --- ADMIN PANEL MODAL --- */}
      {showAdminPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                          <ShieldCheck className="text-blue-600"/> Enrollment Requests
                      </h2>
                      <button onClick={() => setShowAdminPanel(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase">
                          <tr>
                              <th className="p-3">Employee</th>
                              <th className="p-3">Course</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {adminRequests.map(req => (
                              <tr key={req.id}>
                                  <td className="p-3 font-medium">{req.userName}</td>
                                  <td className="p-3 text-gray-600">{req.courseTitle}</td>
                                  <td className="p-3">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {req.status}
                                      </span>
                                  </td>
                                  <td className="p-3 text-right flex justify-end gap-2">
                                      {req.status === 'PENDING' && (
                                          <>
                                            <button onClick={() => handleAdminAction(req.id, 'APPROVED')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Approve"><Check size={16}/></button>
                                            <button onClick={() => handleAdminAction(req.id, 'REJECTED')} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Reject"><Ban size={16}/></button>
                                          </>
                                      )}
                                  </td>
                              </tr>
                          ))}
                          {adminRequests.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">No pending requests</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- ADD COURSE MODAL --- */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Course</h2>
              <button onClick={() => setShowAddCourse(false)}><X size={24} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <input required className="input-std" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="Title" />
              <input required className="input-std" value={newCourse.duration} onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })} placeholder="Duration" />
              <input required className="input-std" value={newCourse.instructor} onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })} placeholder="Instructor" />
              <textarea required className="input-std" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Description" />
              <input required className="input-std" value={newCourse.imageUrl} onChange={(e) => setNewCourse({ ...newCourse, imageUrl: e.target.value })} placeholder="Image URL" />
              <button type="submit" className="w-full py-2 bg-mint-600 text-white rounded-lg">Publish</button>
            </form>
          </div>
        </div>
      )}

      {/* --- FULL COURSE PLAYER --- */}
      {viewingCourse && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300 overflow-y-auto">
              <div className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setViewingCourse(null)} className="p-2 hover:bg-gray-700 rounded-full"><X size={24}/></button>
                      <h2 className="font-bold text-lg">{viewingCourse.title}</h2>
                  </div>
              </div>
              <div className="flex-grow p-6 max-w-5xl mx-auto w-full">
                  <div className="aspect-video bg-black rounded-xl shadow-lg relative flex items-center justify-center">
                      <img src={viewingCourse.imageUrl} className="w-full h-full object-cover opacity-60"/>
                      <PlayCircle className="text-white w-24 h-24 absolute opacity-80"/>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mt-8 mb-4">Course Content</h1>
                  <p className="text-gray-600">{viewingCourse.description}</p>
              </div>
          </div>
      )}

      <style>{` .input-std { width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; } `}</style>
    </div>
  );
};

export default Courses;