import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useInView } from 'react-intersection-observer'; // <--- NEW: Detects scroll
import { 
  FolderOpen, Trash2, FileText, Code, Image as ImageIcon, Film, Music, Box, 
  RefreshCw, ArrowUpDown, Search, Calendar, HardDrive, Filter, HelpCircle, Archive, 
  Moon, Sun, Eye, X, Monitor, Download, Layout, Loader2 
} from 'lucide-react';

interface FileData {
  name: string;
  path: string;
  extension: string;
  category: string;
  size_bytes: number;
  created_at: number;
}

const API_URL = "http://localhost:8000";

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [currentFolder, setCurrentFolder] = useState<"Downloads" | "Documents" | "Desktop">("Downloads");
  
  // PAGINATION & INFINITE SCROLL STATE
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;
  
  // SCROLL TRIGGER
  const { ref, inView } = useInView(); // Detects when we hit bottom

  const [category, setCategory] = useState("All");
  const [subCategory, setSubCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"name" | "size" | "date">("date");
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // --- THE NEW ENGINE ---
  const fetchFiles = async (isScrolling = false) => {
    if (loading || (isScrolling && !hasMore)) return;

    setLoading(true);
    try {
      const currentOffset = isScrolling ? offset : 0;

      const response = await axios.get(`${API_URL}/scan`, {
        params: { 
          folder: currentFolder,
          sort_by: sortMode, 
          category: category, // <--- NEW: Send category to server
          limit: LIMIT,
          offset: currentOffset
        }
      });
      
      // ... rest of the function stays the same ...

      const newFiles = response.data;

      if (newFiles.length < LIMIT) {
        setHasMore(false); // No more files to load
      } else {
        setHasMore(true);
      }

      if (isScrolling) {
        setFiles(prev => [...prev, ...newFiles]); // Append
        setOffset(prev => prev + LIMIT);
      } else {
        setFiles(newFiles); // Replace
        setOffset(LIMIT);
      }
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
    }
    setLoading(false);
  };

  // 1. Reset & Reload when Folder or Sort changes (The "Strict Reset")
  useEffect(() => {
    setFiles([]);     // Clear screen immediately
    setOffset(0);     // Reset counter
    setHasMore(true); // Enable loading
    fetchFiles(false); // Trigger Fresh Load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder, sortMode, category]);

  // 2. Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchFiles(true); // Trigger Append Load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => {
    setSubCategory("All");
  }, [category]);


  // --- ACTIONS ---
  const handlePreview = async (file: FileData) => {
    setPreviewFile(file);
    setPreviewContent(null);
    if (file.category === "Code" || file.extension === ".txt" || file.extension === ".md" || file.extension === ".json") {
      try {
        const res = await axios.get(`${API_URL}/read?path=${encodeURIComponent(file.path)}`);
        setPreviewContent(typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data);
      } catch (err) {
        setPreviewContent("Error reading file content.");
      }
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewContent(null);
  };

  const openFile = async (path: string) => {
    await axios.post(`${API_URL}/open`, { path });
  };

  const deleteFile = async (path: string) => {
    if(!confirm("Are you sure you want to move this to Trash?")) return;
    try {
      await axios.post(`${API_URL}/delete`, { path });
      setFiles(files.filter(f => f.path !== path));
      if (previewFile?.path === path) closePreview();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert("Failed to delete file.");
    }
  };

  // --- HELPERS ---
  const availableExtensions = useMemo(() => {
    if (category === "All") return [];
    const filesInCat = files.filter(f => f.category === category);
    return Array.from(new Set(filesInCat.map(f => f.extension.toLowerCase()))).sort();
  }, [files, category]);

  const processedFiles = files
    .filter(f => subCategory === "All" || f.extension.toLowerCase() === subCategory)
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    // NOTE: We rely on Server Sorting now, so we removed the client-side .sort() here!

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getIcon = (cat: string) => {
    switch(cat) {
      case 'Code': return <Code size={20} className="text-blue-500 dark:text-blue-400"/>;
      case 'Images': return <ImageIcon size={20} className="text-purple-500 dark:text-purple-400"/>;
      case 'Video': return <Film size={20} className="text-red-500 dark:text-red-400"/>;
      case 'Audio': return <Music size={20} className="text-green-500 dark:text-green-400"/>;
      case 'Archives': return <Archive size={20} className="text-yellow-600 dark:text-yellow-400"/>;
      case '3D Models': return <Box size={20} className="text-orange-500 dark:text-orange-400"/>;
      case 'Others': return <HelpCircle size={20} className="text-slate-400"/>;
      default: return <FileText size={20} className="text-gray-500"/>;
    }
  };

  const renderPreview = () => {
    if (!previewFile) return null;
    const fileUrl = `${API_URL}/read?path=${encodeURIComponent(previewFile.path)}`;
    if (previewFile.category === "Images") return <img src={fileUrl} alt="Preview" className="max-h-[70vh] max-w-full rounded-lg shadow-lg mx-auto" />;
    if (previewFile.category === "Video") return <video src={fileUrl} controls className="max-h-[70vh] max-w-full rounded-lg shadow-lg mx-auto" />;
    if (previewFile.category === "Audio") return <div className="flex flex-col items-center justify-center h-64"><Music size={64} className="text-slate-300 mb-4" /><audio src={fileUrl} controls className="w-full max-w-md" /></div>;
    if (previewFile.extension.toLowerCase() === ".pdf") return <iframe src={fileUrl} className="w-full h-[75vh] rounded-lg border border-slate-200 dark:border-slate-700" />;
    if (previewContent) return <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto h-[70vh] text-xs md:text-sm font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"><code>{previewContent}</code></pre>;
    return (
      <div className="text-center py-20 text-slate-400">
        <Box size={48} className="mx-auto mb-4 opacity-50" />
        <p>No preview available.</p>
        <button onClick={() => openFile(previewFile.path)} className="mt-4 text-blue-500 hover:underline">Open in System App</button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Layout className="text-blue-600" /> Agentic OS
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Locations</p>
          {["Desktop", "Documents", "Downloads"].map((folder: any) => (
            <button key={folder} onClick={() => setCurrentFolder(folder)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${currentFolder === folder ? "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              {folder === "Downloads" ? <Download size={18} /> : folder === "Desktop" ? <Monitor size={18} /> : <FileText size={18} />} {folder}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-8 overflow-y-auto">
        
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{currentFolder}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {/* FIX: Use processedFiles.length instead of files.length */}
              {processedFiles.length} items • {formatSize(processedFiles.reduce((acc, f) => acc + f.size_bytes, 0))}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative group w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="text" placeholder="Search loaded files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white" />
            </div>
            <button onClick={() => {setFiles([]); fetchFiles(false)}} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          </div>
        </div>

        {/* Categories & Sort */}
        <div className="max-w-7xl mx-auto mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 px-2">
            {["All", "Documents", "Code", "Images", "Video", "Audio", "Archives", "3D Models", "Others"].map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${category === cat ? "bg-slate-900 dark:bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{cat}</button>
            ))}
          </div>
          <div className="flex gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
             <button onClick={() => setSortMode('date')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${sortMode === 'date' ? "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><Calendar size={16} /> Recent</button>
             <button onClick={() => setSortMode('size')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${sortMode === 'size' ? "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><HardDrive size={16} /> Size</button>
             <button onClick={() => setSortMode('name')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${sortMode === 'name' ? "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><ArrowUpDown size={16} /> Name</button>
          </div>
        </div>

        {/* Filter Bar */}
        {availableExtensions.length > 0 && (
          <div className="max-w-7xl mx-auto mb-6 flex gap-2 items-center overflow-x-auto pb-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mr-2"><Filter size={16} /><span>Filter:</span></div>
            <button onClick={() => setSubCategory("All")} className={`px-3 py-1 rounded-full text-xs font-bold border transition ${subCategory === "All" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300"}`}>All</button>
            {availableExtensions.map(ext => (
              <button key={ext} onClick={() => setSubCategory(ext)} className={`px-3 py-1 rounded-full text-xs font-mono border transition ${subCategory === ext ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-700" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300"}`}>{ext}</button>
            ))}
          </div>
        )}

        {/* File Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {processedFiles.map((file) => (
            <div key={file.path} className="group bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 relative">
              <div className="flex gap-3 items-start">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">{getIcon(file.category)}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200 truncate text-sm" title={file.name}>{file.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{file.extension}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{formatSize(file.size_bytes)}</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handlePreview(file)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-lg"><Eye size={16} /></button>
                <button onClick={() => openFile(file.path)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg"><FolderOpen size={16} /></button>
                <button onClick={() => deleteFile(file.path)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-red-600 dark:text-red-400 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* INFINITE SCROLL LOADING SPINNER */}
        <div ref={ref} className="flex justify-center py-8">
          {loading && <Loader2 className="animate-spin text-slate-400" />}
          {!hasMore && !loading && files.length > 0 && <p className="text-slate-400 text-sm">End of list</p>}
        </div>

      </main>

      {/* Preview Modal (Same) */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closePreview}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">{getIcon(previewFile.category)}</div>
                <div><h3 className="font-semibold text-slate-800 dark:text-white truncate">{previewFile.name}</h3></div>
              </div>
              <button onClick={closePreview} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-auto flex-1 bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">{renderPreview()}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;