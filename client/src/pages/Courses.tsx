import React, { useEffect, useState } from "react";
import * as api from "../services/api";
import { Course, Employee } from "../types";
import { 
  Users, PlayCircle, Plus, Trash2, X, Search, 
  Clock, BookOpen, CheckCircle, Lock, ShieldCheck, Check, Ban, UserPlus,
  Edit, Edit3, Save, Video, FileText, UploadCloud, Layout,
  RotateCw // <-- Added this import
} from "lucide-react";
import { useAuth } from "../App";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

interface Chapter {
  title: string;
  duration: string;
  videoUrl: string;
  description: string;
  textContent: string;
}

interface ExtendedCourse extends Course {
  duration?: string;
  instructor?: string;
  progress?: number; 
  content?: string;
  chapters?: Chapter[];
}

interface EnrollmentRequest {
  id: number;
  userName: string;
  courseTitle: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const Courses: React.FC = () => {
  const { user } = useAuth();
  
  // Data
  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, string>>({});
  
  // UI
  const [activeTab, setActiveTab] = useState<"browse" | "my-learning">("browse");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false); // <-- Added for refresh animation
  
  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<ExtendedCourse | null>(null);
  
  // Admin Data
  const [adminRequests, setAdminRequests] = useState<EnrollmentRequest[]>([]);
  
  // Course Editor States
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editorChapters, setEditorChapters] = useState<Chapter[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [isEditingCourse, setIsEditingCourse] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", imageUrl: "", duration: "", instructor: "",
  });
  
  const [assignData, setAssignData] = useState({ userId: "", courseId: "" });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsRefreshing(true); // Start animation
    try {
        const c = await api.getCourses();
        const enrichedCourses = c.map((course: any) => ({
            ...course,
            duration: course.duration || "2h 30m",
            instructor: course.instructor || "Marabes Expert",
            progress: Math.floor(Math.random() * 100),
            chapters: course.content ? JSON.parse(course.content) : []
        }));
        setCourses(enrichedCourses);
        
        if (user?.role === 'ADMIN') {
            const users = await api.getUsers();
            setEmployees(users);
        }
        if (user) {
            const res = await axios.get(`${API_URL}/enrollments/my/${user.id}`);
            const statusMap: Record<string, string> = {};
            res.data.forEach((e: any) => { statusMap[e.courseId] = e.status; });
            setEnrollmentStatus(statusMap);
        }
    } catch (err) { 
        console.error("Failed to load data", err); 
    } finally {
        // Short delay for the animation to look smooth
        setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // --- 1. OPEN MODES (VIEW vs EDIT) ---
  const openContentEditor = (course: ExtendedCourse) => {
    setViewingCourse(course);
    setEditorChapters(course.chapters || []);
    setActiveChapterIndex(0);
    setIsEditingContent(true); // Edit Mode ON
  };

  const openCoursePlayer = (course: ExtendedCourse) => {
    setViewingCourse(course);
    setEditorChapters(course.chapters || []);
    setActiveChapterIndex(0);
    setIsEditingContent(false); // View Mode
  };

  // --- CRUD METADATA ---
  const handleOpenAdd = () => {
      setCourseForm({ title: "", description: "", imageUrl: "", duration: "", instructor: "" });
      setIsEditingCourse(null);
      setShowFormModal(true);
  };

  const handleOpenEditMetadata = (course: ExtendedCourse, e: React.MouseEvent) => {
      e.stopPropagation();
      setCourseForm({
          title: course.title,
          description: course.description,
          imageUrl: course.imageUrl,
          duration: course.duration || "",
          instructor: course.instructor || ""
      });
      setIsEditingCourse(course.id);
      setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (isEditingCourse) {
            await api.updateCourseContent(isEditingCourse, courseForm);
            alert("Updated successfully!");
        } else {
            await api.addCourse(courseForm);
            alert("Created successfully!");
        }
        setShowFormModal(false);
        loadData();
    } catch (err) { alert("Failed to save."); }
  };

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete course?")) return;
    try { await axios.delete(`${API_URL}/courses/${id}`); loadData(); } catch (err) { console.error(err); }
  };

  // --- CONTENT EDITOR ---
  const saveCourseContent = async () => {
    if (!viewingCourse) return;
    try {
      await api.updateCourseContent(viewingCourse.id, editorChapters);
      alert("Content saved!");
      setViewingCourse({ ...viewingCourse, chapters: editorChapters });
      setIsEditingContent(false);
      loadData();
    } catch (err) { alert("Failed to save."); }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      if (e.target.files && e.target.files[0]) {
          setIsUploading(true);
          try {
              const file = e.target.files[0];
              const url = await api.uploadFile(file);
              handleChapterChange(index, 'videoUrl', url);
          } catch (err) { alert("Upload failed"); } 
          finally { setIsUploading(false); }
      }
  };

  const handleAddChapter = () => setEditorChapters([...editorChapters, { title: "New Lesson", duration: "10m", videoUrl: "", description: "", textContent: "" }]);
  
  const handleChapterChange = (index: number, field: keyof Chapter, value: string) => {
    const updated = [...editorChapters];
    updated[index] = { ...updated[index], [field]: value };
    setEditorChapters(updated);
  };
  
  const handleRemoveChapter = (index: number) => setEditorChapters(editorChapters.filter((_, i) => i !== index));

  // --- ENROLL / ASSIGN / ADMIN ---
  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    try {
        await axios.post(`${API_URL}/enrollments`, { userId: user.id, courseId });
        setEnrollmentStatus(prev => ({ ...prev, [courseId]: 'PENDING' }));
        alert("Request sent!");
    } catch (err) { alert("Failed."); }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.assignCourse(assignData.userId, assignData.courseId);
      alert("Assigned!");
      setShowAssignModal(false);
      loadData();
    } catch (err) { alert("Failed."); }
  };

  const openAdminPanel = async () => {
      try {
          const res = await axios.get(`${API_URL}/enrollments/admin/requests`);
          setAdminRequests(res.data);
          setShowAdminPanel(true);
      } catch (err) { console.error(err); }
  };

  const handleAdminAction = async (id: number, status: "APPROVED" | "REJECTED") => {
      await axios.put(`${API_URL}/enrollments/${id}`, { status });
      openAdminPanel();
      loadData();
  };

  const filteredCourses = courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
      if (activeTab === "my-learning") return matchesSearch && enrollmentStatus[c.id]; 
      return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><BookOpen className="text-mint-600"/> Training Center</h1>
            <p className="text-gray-500 text-sm">Upgrade your skills</p>
        </div>
        {user?.role === "ADMIN" && (
          <div className="flex gap-2">
             <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"><UserPlus size={18} /> Assign</button>
             <button onClick={openAdminPanel} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"><ShieldCheck size={18} /> Requests</button>
             <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 shadow-sm"><Plus size={18} /> Course</button>
          </div>
        )}
      </div>

      {/* TABS & SEARCH (Refresh Icon Added Here) */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex gap-4">
              <button onClick={() => setActiveTab("browse")} className={`pb-2 text-sm font-medium border-b-2 ${activeTab === "browse" ? "text-mint-600 border-mint-600" : "text-gray-500 border-transparent"}`}>Browse Catalog</button>
              <button onClick={() => setActiveTab("my-learning")} className={`pb-2 text-sm font-medium border-b-2 ${activeTab === "my-learning" ? "text-mint-600 border-mint-600" : "text-gray-500 border-transparent"}`}>My Learning</button>
          </div>
          
          <div className="flex items-center gap-2"> {/* Added Flex container for search and refresh */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
            
            {/* NEW REFRESH BUTTON */}
            <button 
                onClick={loadData} 
                className={`p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-mint-600 hover:bg-mint-50 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
                title="Refresh catalog"
            >
                <RotateCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
      </div>

      {/* COURSE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
            const status = enrollmentStatus[course.id];
            return (
                <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all flex flex-col h-full">
                    {/* Image Area */}
                    <div className="h-48 overflow-hidden relative">
                        <img src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop"} className="w-full h-full object-cover"/>
                        {status === 'APPROVED' && <div className="absolute inset-0 bg-mint-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><PlayCircle className="text-white" size={40}/></div>}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded">{course.duration}</div>
                        
                        {/* ADMIN EDIT / DELETE */}
                        {user?.role === "ADMIN" && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleOpenEditMetadata(course, e)} className="p-2 bg-white text-gray-700 rounded-full hover:text-blue-600 shadow-md"><Edit size={14} /></button>
                                <button onClick={(e) => handleDeleteCourse(course.id, e)} className="p-2 bg-white text-gray-700 rounded-full hover:text-red-500 shadow-md"><Trash2 size={14} /></button>
                            </div>
                        )}
                    </div>
                    {/* Body */}
                    <div className="p-5 flex flex-col flex-grow">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">{course.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 border-t border-gray-50 pt-4">
                            <div className="flex items-center gap-1"><Users size={14} /> {course.enrolledCount || 0} Students</div>
                            <div className="flex items-center gap-1"><Clock size={14} /> {course.instructor}</div>
                        </div>

                        {/* BUTTONS */}
                        {user?.role === 'ADMIN' ? (
                            <div className="flex gap-2">
                                {/* ADMIN BUTTONS: MANAGE CONTENT vs PREVIEW */}
                                <button onClick={() => openContentEditor(course)} className="flex-1 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2">
                                    <Layout size={16}/> Manage Content
                                </button>
                                <button onClick={() => openCoursePlayer(course)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Preview as Student">
                                    <PlayCircle size={18}/>
                                </button>
                            </div>
                        ) : (
                            <>
                                {!status && <button onClick={() => handleEnroll(course.id)} className="w-full py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Enroll Now</button>}
                                {status === 'PENDING' && <button disabled className="w-full py-2 bg-orange-100 text-orange-700 text-sm rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"><Lock size={14}/> Pending</button>}
                                {status === 'APPROVED' && <button onClick={() => openCoursePlayer(course)} className="w-full py-2 bg-mint-600 text-white text-sm font-bold rounded-lg hover:bg-mint-700">Start Learning</button>}
                            </>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* --- FORM MODAL (METADATA) --- */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{isEditingCourse ? "Edit Details" : "New Course"}</h2><button onClick={() => setShowFormModal(false)}><X size={24} className="text-gray-400" /></button></div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <input required className="input-std" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Title" />
              <input required className="input-std" value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} placeholder="Duration" />
              <input required className="input-std" value={courseForm.instructor} onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })} placeholder="Instructor" />
              <textarea required className="input-std" rows={3} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Description" />
              <input required className="input-std" value={courseForm.imageUrl} onChange={(e) => setCourseForm({ ...courseForm, imageUrl: e.target.value })} placeholder="Image URL" />
              <button type="submit" className="w-full py-2 bg-mint-600 text-white rounded-lg">{isEditingCourse ? "Save Changes" : "Publish"}</button>
            </form>
          </div>
        </div>
      )}

      {/* --- FULL PLAYER & EDITOR (FIXED FULLSCREEN Z-INDEX) --- */}
      {viewingCourse && (
          <div className="fixed inset-0 bg-white z-[1000] flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
                  <div className="flex items-center gap-4"><button onClick={() => setViewingCourse(null)} className="p-2 hover:bg-gray-700 rounded-full"><X size={24}/></button><h2 className="font-bold text-lg">{viewingCourse.title}</h2></div>
                  <div className="flex gap-3">
                    {user?.role === "ADMIN" && <button onClick={() => setIsEditingContent(!isEditingContent)} className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${isEditingContent ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}><Edit3 size={16}/> {isEditingContent ? 'Editing' : 'Edit'}</button>}
                    {isEditingContent && <button onClick={saveCourseContent} className="px-4 py-1 bg-green-600 rounded text-sm font-bold"><Save size={16}/> Save</button>}
                  </div>
              </div>
              
              <div className="flex flex-col lg:flex-row flex-grow h-full overflow-hidden">
                  <div className="flex-grow bg-black flex flex-col items-center overflow-y-auto">
                      {activeChapterIndex < editorChapters.length ? (
                          <div className="w-full max-w-5xl p-6">
                              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-2xl mb-6 relative">
                                  {editorChapters[activeChapterIndex].videoUrl ? (
                                     editorChapters[activeChapterIndex].videoUrl.includes("youtube") ? 
                                     <iframe src={editorChapters[activeChapterIndex].videoUrl.replace("watch?v=", "embed/")} className="w-full h-full" frameBorder="0" allowFullScreen></iframe> 
                                     : 
                                     <video src={editorChapters[activeChapterIndex].videoUrl} className="w-full h-full" controls></video>
                                  ) : (<div className="w-full h-full flex items-center justify-center text-gray-500"><Video size={48} className="mb-2 opacity-50"/> No video</div>)}
                              </div>
                              <div className="bg-white p-8 rounded-xl text-gray-800 max-w-5xl mx-auto shadow-lg">
                                  <h2 className="text-3xl font-bold mb-4">{editorChapters[activeChapterIndex].title}</h2>
                                  <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                                     {editorChapters[activeChapterIndex].textContent || editorChapters[activeChapterIndex].description || "No text content available."}
                                  </div>
                              </div>
                          </div>
                      ) : <div className="text-white mt-20">Select a chapter</div>}
                  </div>
                  
                  <div className="w-full lg:w-96 bg-gray-50 border-l border-gray-200 flex flex-col h-full overflow-hidden shrink-0">
                      <div className="p-4 bg-white border-b border-gray-200 font-bold text-gray-700 flex justify-between items-center">
                          <span>Modules</span>
                          {isEditingContent && <button onClick={handleAddChapter} className="text-xs flex items-center gap-1 bg-mint-100 text-mint-700 px-2 py-1 rounded"><Plus size={14}/> Add</button>}
                      </div>
                      <div className="flex-grow overflow-y-auto p-3 space-y-3">
                          {editorChapters.map((chapter, index) => (
                              <div key={index} onClick={() => !isEditingContent && setActiveChapterIndex(index)} className={`p-3 rounded-lg border transition-all ${index === activeChapterIndex ? 'bg-white border-mint-500 shadow-sm ring-1 ring-mint-500' : 'bg-gray-100 border-transparent hover:bg-white'} ${!isEditingContent && 'cursor-pointer'}`}>
                                  {isEditingContent ? (
                                      <div className="space-y-3">
                                          <input className="w-full p-2 border rounded text-sm font-bold" value={chapter.title} onChange={(e) => handleChapterChange(index, 'title', e.target.value)} placeholder="Lesson Title"/>
                                          <div className="flex gap-2">
                                              <input className="flex-1 p-2 border rounded text-xs" value={chapter.videoUrl} onChange={(e) => handleChapterChange(index, 'videoUrl', e.target.value)} placeholder="Video URL"/>
                                              <label className="cursor-pointer bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"><UploadCloud size={16}/><input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e, index)}/></label>
                                          </div>
                                          {isUploading && <p className="text-xs text-blue-500 animate-pulse">Uploading...</p>}
                                          <textarea className="w-full p-2 border rounded text-xs min-h-[80px]" value={chapter.textContent} onChange={(e) => handleChapterChange(index, 'textContent', e.target.value)} placeholder="Full text content..."/>
                                          <div className="flex justify-between items-center">
                                              <input className="w-20 p-1 border rounded text-xs" value={chapter.duration} onChange={(e) => handleChapterChange(index, 'duration', e.target.value)} placeholder="10m"/>
                                              <button onClick={() => handleRemoveChapter(index)} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 size={12}/> Remove</button>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex justify-between items-center">
                                          <div><p className="font-medium text-sm text-gray-800 line-clamp-1">{chapter.title}</p><p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/> {chapter.duration}</p></div>
                                          {index === activeChapterIndex && <PlayCircle size={16} className="text-mint-600"/>}
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Assign Employee</h2><button onClick={() => setShowAssignModal(false)}><X size={24} className="text-gray-400" /></button></div>
            <form onSubmit={handleAssignUser} className="space-y-4">
                <select required className="input-std w-full" value={assignData.userId} onChange={e => setAssignData({...assignData, userId: e.target.value})}>
                    <option value="">Select Employee</option>
                    {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                </select>
                <select required className="input-std w-full" value={assignData.courseId} onChange={e => setAssignData({...assignData, courseId: e.target.value})}>
                    <option value="">Select Course</option>
                    {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                </select>
                <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg">Assign Now</button>
            </form>
          </div>
        </div>
      )}
      
      {showAdminPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Requests</h2><button onClick={() => setShowAdminPanel(false)}><X/></button></div>
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase"><tr><th className="p-3">User</th><th className="p-3">Course</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                          {adminRequests.map(req => (
                              <tr key={req.id}>
                                  <td className="p-3">{req.userName}</td><td className="p-3">{req.courseTitle}</td><td className="p-3">{req.status}</td>
                                  <td className="p-3 flex gap-2">{req.status === 'PENDING' && (<><button onClick={() => handleAdminAction(req.id, 'APPROVED')} className="p-1 bg-green-100 text-green-600 rounded"><Check size={16}/></button><button onClick={() => handleAdminAction(req.id, 'REJECTED')} className="p-1 bg-red-100 text-red-600 rounded"><Ban size={16}/></button></>)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      <style>{` .input-std { width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; } `}</style>
    </div>
  );
};

export default Courses;