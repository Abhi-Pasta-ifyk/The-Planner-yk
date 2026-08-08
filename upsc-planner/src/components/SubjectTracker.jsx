import React, { useState, useEffect } from 'react';
import { ChevronRight, BookOpen, FileText, CheckCircle2, Circle, Plus, Sparkles, Trash2, X, Loader, Image as ImageIcon, BookText } from 'lucide-react';
import API from '../api'; 
import { useAccent } from '../AccentContext'; 

const SubjectTracker = () => {
  const { themeClasses } = useAccent(); 

  // --- STATE ---
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);

  // Forms State
  const [newChapterName, setNewChapterName] = useState('');
  const [isGeneratingBook, setIsGeneratingBook] = useState(false);
  const [bookQuery, setBookQuery] = useState('');
  
  // Smart Syllabus State
  const [bookPreview, setBookPreview] = useState(null);

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', priority: 'Medium' });

  const colorPalette = [
    { bg: 'bg-emerald-600', text: 'text-emerald-600' },
    { bg: 'bg-orange-500', text: 'text-orange-500' },
    { bg: 'bg-cyan-600', text: 'text-cyan-600' },
    { bg: 'bg-rose-600', text: 'text-rose-600' },
    { bg: 'bg-indigo-600', text: 'text-indigo-600' },
    { bg: 'bg-amber-500', text: 'text-amber-500' }
  ];

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await API.get('/subjects');
        setSubjects(response.data);
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const syncSubjectToDB = async (updatedSubject) => {
    try {
      await API.put(`/subjects/${updatedSubject._id}`, updatedSubject);
    } catch (err) {
      console.error("Failed to sync subject updates to database:", err);
    }
  };

  // --- CALCULATIONS ---
  const getBookStats = (book) => {
    const total = book.chapters?.length || 0;
    const done = book.chapters?.filter(c => c.status === 'Done').length || 0;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, percent };
  };

  const getSubjectStats = (subject) => {
    let totalChapters = 0;
    let doneChapters = 0;
    subject.books?.forEach(book => {
      totalChapters += book.chapters?.length || 0;
      doneChapters += book.chapters?.filter(c => c.status === 'Done').length || 0;
    });
    const percent = totalChapters === 0 ? 0 : Math.round((doneChapters / totalChapters) * 100);
    return { totalChapters, doneChapters, percent };
  };

  const getOverallStats = () => {
    let total = 0;
    let done = 0;
    let hours = 0;
    subjects.forEach(sub => {
      hours += sub.hours || 0;
      const stats = getSubjectStats(sub);
      total += stats.totalChapters;
      done += stats.doneChapters;
    });
    return { total, done, hours, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  };

  // --- ACTIONS (SUBJECTS & BOOKS) ---
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    
    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    
    const subjectToAdd = {
      name: newSubject.name,
      priority: newSubject.priority,
      color: randomColor.bg,
      textColor: randomColor.text,
      hours: 0,
      books: []
    };

    try {
      const response = await API.post('/subjects', subjectToAdd);
      setSubjects([...subjects, response.data]);
      setIsSubjectModalOpen(false);
      setNewSubject({ name: '', priority: 'Medium' });
    } catch (err) {
      console.error("Failed to add subject:", err);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm("Are you sure you want to delete this entire subject and all its books?")) {
      try {
        await API.delete(`/subjects/${id}`);
        setSubjects(subjects.filter(s => s._id !== id));
        setActiveSubjectId(null);
      } catch (err) {
        console.error("Failed to delete subject:", err);
      }
    }
  };

  const handleSmartSearch = async (e) => {
    e.preventDefault();
    if (!bookQuery.trim()) return;
    setIsGeneratingBook(true);
    
    try {
      const response = await API.post('/books/generate', { bookName: bookQuery });
      setBookPreview(response.data); 
    } catch (err) {
      console.error("Failed to generate book:", err);
      alert("The AI couldn't generate the syllabus. Make sure your backend route is set up!");
    } finally {
      setIsGeneratingBook(false);
    }
  };

  const handleConfirmSmartBook = (subId) => {
    if (!bookPreview) return;

    const newBook = {
      id: Date.now(), 
      title: bookPreview.title || bookQuery,
      author: bookPreview.author || 'AI Extracted',
      pages: bookPreview.pages || 0,
      coverUrl: bookPreview.coverUrl || '',
      chapters: bookPreview.chapters.map((ch, idx) => ({
        id: Date.now() + idx,
        name: ch.name || ch,
        diff: 'Medium',
        status: 'Pending'
      }))
    };
    
    const updatedSubjects = subjects.map(sub => {
      if (sub._id === subId) {
        const updatedSub = { ...sub, books: [...(sub.books || []), newBook] };
        syncSubjectToDB(updatedSub); 
        return updatedSub;
      }
      return sub;
    });

    setSubjects(updatedSubjects);
    setBookPreview(null);
    setBookQuery('');
  };

  const handleDeleteBook = (subId, bookId) => {
    if (window.confirm("Delete this book?")) {
      const updatedSubjects = subjects.map(sub => {
        if (sub._id === subId) {
          const updatedSub = { ...sub, books: sub.books.filter(b => b.id !== bookId) };
          syncSubjectToDB(updatedSub); 
          return updatedSub;
        }
        return sub;
      });
      setSubjects(updatedSubjects);
    }
  };

  // --- MAGIC GITHUB AUTOMATION ---
  const handleMagicGithub = (subId) => {
    const numChaps = parseInt(window.prompt("How many chapters are in this book?"));
    if (!numChaps || isNaN(numChaps)) return;

    const bookTitle = window.prompt("Enter the Book Title (e.g., Physics Part I):");

    const newBook = {
      id: Date.now(),
      title: bookTitle || `Imported Book`,
      author: 'Official NCERT (via GitHub)',
      pages: 'Full Book',
      coverUrl: '', 
      chapters: Array.from({ length: numChaps }, (_, i) => {
        return {
          id: Date.now() + i,
          name: `Chapter ${i + 1}`,
          diff: 'Medium',
          status: 'Pending'
        };
      })
    };

    const updatedSubjects = subjects.map(sub => {
      if (sub._id === subId) {
        const updatedSub = { ...sub, books: [...(sub.books || []), newBook] };
        syncSubjectToDB(updatedSub); 
        return updatedSub;
      }
      return sub;
    });

    setSubjects(updatedSubjects);
  };

  // --- ACTIONS (CHAPTERS) ---
  const toggleChapterStatus = (subId, bookId, chapId) => {
    const updatedSubjects = subjects.map(sub => {
      if (sub._id !== subId) return sub;
      const updatedSub = {
        ...sub,
        books: sub.books.map(book => {
          if (book.id !== bookId) return book;
          return {
            ...book,
            chapters: book.chapters.map(chap => 
              chap.id === chapId ? { ...chap, status: chap.status === 'Done' ? 'Pending' : 'Done' } : chap
            )
          };
        })
      };
      syncSubjectToDB(updatedSub); 
      return updatedSub;
    });
    setSubjects(updatedSubjects);
  };

  const handleAddChapter = (e, subId, bookId) => {
    e.preventDefault();
    if (!newChapterName.trim()) return;
    
    const updatedSubjects = subjects.map(sub => {
      if (sub._id !== subId) return sub;
      const updatedSub = {
        ...sub,
        books: sub.books.map(book => {
          if (book.id !== bookId) return book;
          return { ...book, chapters: [...(book.chapters || []), { id: Date.now(), name: newChapterName, diff: 'Medium', status: 'Pending' }] };
        })
      };
      syncSubjectToDB(updatedSub); 
      return updatedSub;
    });

    setSubjects(updatedSubjects);
    setNewChapterName('');
  };

  const deleteChapter = (subId, bookId, chapId) => {
    const updatedSubjects = subjects.map(sub => {
      if (sub._id !== subId) return sub;
      const updatedSub = {
        ...sub,
        books: sub.books.map(book => {
          if (book.id !== bookId) return book;
          return { ...book, chapters: book.chapters.filter(c => c.id !== chapId) };
        })
      };
      syncSubjectToDB(updatedSub); 
      return updatedSub;
    });
    setSubjects(updatedSubjects);
  };

  // --- RENDER VARS ---
  const activeSubject = subjects.find(s => s._id === activeSubjectId);
  const activeBook = activeSubject?.books?.find(b => b.id === activeBookId);
  const overallStats = getOverallStats();

  if (loading) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Syllabus from database...</div>;

  return (
    <div className="w-full pt-12 pb-16">
      
      {/* BREADCRUMB HEADER */}
      <header className="mb-8 border-b-2 border-gray-200/50 dark:border-slate-800 pb-4 transition-colors">
        <h2 className="text-xs font-bold text-green-600 dark:text-green-500 tracking-widest mb-2 uppercase">Integrated Tracker</h2>
        <div className="flex items-center gap-2 text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
          <span 
            className={`cursor-pointer transition-colors hover:${themeClasses.text} ${!activeSubjectId ? 'text-slate-800 dark:text-slate-100' : 'text-gray-400 dark:text-gray-500'}`}
            onClick={() => { setActiveSubjectId(null); setActiveBookId(null); }}
          >
            Syllabus
          </span>
          
          {activeSubjectId && (
            <>
              <ChevronRight className="text-gray-300 dark:text-gray-600 mt-1" />
              <span 
                className={`cursor-pointer transition-colors hover:${themeClasses.text} ${!activeBookId ? 'text-slate-800 dark:text-slate-100' : 'text-gray-400 dark:text-gray-500'}`}
                onClick={() => setActiveBookId(null)}
              >
                {activeSubject.name}
              </span>
            </>
          )}

          {activeBookId && (
            <>
              <ChevronRight className="text-gray-300 dark:text-gray-600 mt-1" />
              <span className="text-slate-800 dark:text-slate-100">{activeBook.title}</span>
            </>
          )}
        </div>
      </header>

      {/* ================= LEVEL 1: SUBJECT GRID ================= */}
      {!activeSubjectId && (
        <>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors">Overview</h3>
            <div className="flex gap-6 text-right">
              <div>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{overallStats.done}<span className="text-sm text-gray-400 dark:text-gray-500">/{overallStats.total}</span></span>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Total Chapters</p>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-green-600 dark:text-green-500">{overallStats.hours}h</span>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Hours Invested</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => {
              const stats = getSubjectStats(sub);
              return (
                <div 
                  key={sub._id} 
                  onClick={() => setActiveSubjectId(sub._id)}
                  className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all transform hover:-translate-y-1 hover:${themeClasses.border}`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${sub.color}`}></div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 transition-colors">{sub.name}</h3>
                    </div>
                    <span className={`font-extrabold text-sm ${sub.textColor}`}>{stats.percent}%</span>
                  </div>
                  
                  <div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 mb-3 transition-colors">
                      <div className={`h-1.5 rounded-full ${sub.color} transition-all duration-500`} style={{ width: `${stats.percent}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 font-medium transition-colors">
                      <span>{stats.doneChapters}/{stats.totalChapters} chapters</span>
                      <span>{sub.books?.length || 0} books</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* ADD NEW SUBJECT BUTTON */}
            <div 
              onClick={() => setIsSubjectModalOpen(true)}
              className={`border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all text-gray-400 dark:text-gray-500 min-h-[160px] hover:${themeClasses.bgLight} hover:${themeClasses.border} hover:${themeClasses.text}`}
            >
              <Plus size={28} className="mb-2" />
              <span className="text-sm font-bold">Add Subject</span>
            </div>
          </div>
        </>
      )}

      {/* ================= LEVEL 2: BOOK TRACKER ================= */}
      {activeSubjectId && !activeBookId && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 flex items-center justify-between group transition-colors">
            <div>
               <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 transition-colors">
                 {activeSubject.name} Dashboard
                 <button onClick={() => handleDeleteSubject(activeSubject._id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30">
                   <Trash2 size={18} />
                 </button>
               </h3>
               <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Track books and materials for this subject.</p>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{getSubjectStats(activeSubject).doneChapters}<span className="text-sm text-gray-400 dark:text-gray-500">/{getSubjectStats(activeSubject).totalChapters}</span></p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Chapters</p>
               </div>
               
               <div className="w-16 h-16 relative flex items-center justify-center">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                   <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" className="text-gray-100 dark:text-slate-800 transition-colors" strokeWidth="12" />
                   <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" 
                     strokeDasharray={2 * Math.PI * 40} 
                     strokeDashoffset={(2 * Math.PI * 40) - ((2 * Math.PI * 40) * getSubjectStats(activeSubject).percent) / 100} 
                     className={`${activeSubject.textColor} transition-all duration-1000`} strokeLinecap="round" 
                   />
                 </svg>
                 <span className={`absolute text-sm font-bold ${activeSubject.textColor}`}>{getSubjectStats(activeSubject).percent}%</span>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 text-[10px] text-gray-400 dark:text-gray-500 tracking-widest uppercase transition-colors">
                  <th className="py-4 px-6 font-bold w-1/2">Book Title</th>
                  <th className="py-4 px-6 font-bold text-center">Chapters</th>
                  <th className="py-4 px-6 font-bold">Progress</th>
                  <th className="py-4 px-6 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {activeSubject.books?.length > 0 ? (
                  activeSubject.books.map(book => {
                    const stats = getBookStats(book);
                    return (
                      <tr key={book.id} className="border-b border-gray-100 dark:border-slate-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group/row">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            {book.coverUrl ? (
                              <img 
                                src={book.coverUrl} 
                                alt="cover" 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&size=120&background=4f46e5&color=fff&length=2`;
                                }}
                                className="w-10 h-14 object-cover rounded-md shadow-sm border border-gray-200 dark:border-slate-700" 
                              />
                            ) : (
                              <div className="w-10 h-14 bg-gray-100 dark:bg-slate-800 rounded-md flex items-center justify-center text-gray-300 dark:text-gray-600 transition-colors">
                                <BookOpen size={20} />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 transition-colors">{book.title}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 transition-colors">{book.author} · {book.pages || '?'} pages</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                           <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md transition-colors">{stats.done}/{stats.total}</span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 transition-colors">
                              <div className={`h-1.5 rounded-full ${activeSubject.color} transition-all duration-500`} style={{ width: `${stats.percent}%` }}></div>
                            </div>
                            <span className="w-8 text-xs font-bold text-slate-700 dark:text-slate-300 text-right transition-colors">{stats.percent}%</span>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-right flex justify-end items-center gap-2">
                          <button 
                            onClick={() => setActiveBookId(book.id)}
                            className={`text-xs font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg shadow-sm transition-colors hover:${themeClasses.border} hover:${themeClasses.text}`}
                          >
                            Open
                          </button>
                          <button onClick={() => handleDeleteBook(activeSubject._id, book.id)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity rounded-md">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm transition-colors">No books added to {activeSubject.name} yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
             
             {/* QUICK IMPORT BUTTON */}
             <button 
               onClick={() => handleMagicGithub(activeSubjectId)}
               className={`px-5 py-2 flex items-center justify-center text-white text-xs font-bold rounded-lg shadow-sm transition-colors bg-indigo-600 hover:bg-indigo-700`}
             >
               <BookText size={14} className="mr-2" /> Quick Import
             </button>

             <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-2"></div>

             {/* EXISTING SMART SYLLABUS FORM */}
             <form onSubmit={handleSmartSearch} className="flex-1 flex items-center gap-3">
               <div className="p-2 bg-slate-800 dark:bg-slate-800/80 rounded-lg text-yellow-400 transition-colors"><Sparkles size={18} /></div>
               <input 
                 type="text" value={bookQuery} onChange={e => setBookQuery(e.target.value)} disabled={isGeneratingBook}
                 className="flex-1 text-sm outline-none bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-colors"
                 placeholder={`Search for a book via AI...`}
               />
               <button 
                 type="submit" 
                 disabled={!bookQuery.trim() || isGeneratingBook} 
                 className={`px-5 py-2 flex items-center justify-center min-w-[140px] text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors ${themeClasses.primary}`}
               >
                 {isGeneratingBook ? <><Loader size={14} className="animate-spin mr-2" /> Generating</> : 'Smart Syllabus'}
               </button>
             </form>
          </div>
        </div>
      )}

      {/* ================= LEVEL 3: CHAPTER TRACKER (NO PDF) ================= */}
      {activeBookId && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 flex justify-between items-center transition-colors">
             <div className="flex items-center gap-4">
                {activeBook.coverUrl ? (
                  <img src={activeBook.coverUrl} alt="cover" className="w-12 h-16 object-cover rounded shadow-sm border border-gray-200 dark:border-slate-700" />
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-gray-400 dark:text-gray-500 transition-colors"><FileText size={24} /></div>
                )}
               <div>
                 <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{activeBook.title}</h3>
                 <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors">{activeBook.author}</p>
               </div>
             </div>
             
             <div className="flex items-center gap-4 w-1/3">
                <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 transition-colors">
                  <div className={`h-2.5 rounded-full ${activeSubject.color} transition-all duration-500`} style={{ width: `${getBookStats(activeBook).percent}%` }}></div>
                </div>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{getBookStats(activeBook).percent}%</span>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 text-[10px] text-gray-400 dark:text-gray-500 tracking-widest uppercase transition-colors">
                  <th className="py-4 px-6 font-bold">Chapter Name</th>
                  <th className="py-4 px-6 font-bold text-center w-32">Status</th>
                  <th className="py-4 px-6 font-bold text-right w-16"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {activeBook.chapters?.length > 0 ? (
                  activeBook.chapters.map(chap => {
                    return (
                      <tr key={chap.id} className="border-b border-gray-100 dark:border-slate-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200 transition-colors">
                          {chap.name}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <button 
                            onClick={() => toggleChapterStatus(activeSubject._id, activeBook.id, chap.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors w-full justify-center ${
                              chap.status === 'Done' ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/50' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {chap.status === 'Done' ? <><CheckCircle2 size={14} /> Done</> : <><Circle size={14} /> Pending</>}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                           <button onClick={() => deleteChapter(activeSubject._id, activeBook.id, chap.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="3" className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm transition-colors">No chapters added yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <form onSubmit={(e) => handleAddChapter(e, activeSubject._id, activeBook.id)} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
             <div className={`p-2 rounded-lg transition-colors ${themeClasses.bgLight} ${themeClasses.text}`}><Plus size={18} /></div>
             <input type="text" value={newChapterName} onChange={e => setNewChapterName(e.target.value)} className="flex-1 text-sm outline-none bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-colors" placeholder="Add a new chapter manually..."/>
             <button type="submit" disabled={!newChapterName.trim()} className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors ${themeClasses.primary}`}>Add Chapter</button>
          </form>
        </div>
      )}

      {/* ================= MODAL: ADD NEW SUBJECT ================= */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-gray-100 dark:border-slate-800 transition-colors">
            <button onClick={() => setIsSubjectModalOpen(false)} className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-slate-800 dark:hover:text-slate-200 bg-gray-50 dark:bg-slate-800 p-2 rounded-full transition-colors"><X size={20} /></button>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 transition-colors">Create New Subject</h2>
            
            <form onSubmit={handleAddSubject} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 transition-colors">Subject Name</label>
                <input 
                  required autoFocus type="text" 
                  value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} 
                  className={`w-full bg-transparent border-2 border-gray-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none transition-colors focus:border-transparent focus:ring-2 ${themeClasses.ring}`} 
                  placeholder="e.g. Current Affairs, Sociology..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 transition-colors">Priority Level</label>
                <select 
                  value={newSubject.priority} onChange={e => setNewSubject({...newSubject, priority: e.target.value})} 
                  className={`w-full bg-transparent border-2 border-gray-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none transition-colors focus:border-transparent focus:ring-2 ${themeClasses.ring}`}
                >
                  <option value="High" className="dark:bg-slate-800">High Priority</option>
                  <option value="Medium" className="dark:bg-slate-800">Medium Priority</option>
                  <option value="Low" className="dark:bg-slate-800">Low Priority</option>
                </select>
              </div>
              
              <button type="submit" className={`mt-4 w-full font-bold py-3.5 rounded-xl shadow-sm transition-colors ${themeClasses.primary}`}>
                Create Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SMART SYLLABUS PREVIEW ================= */}
      {bookPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800 transition-colors">
            
            {/* Left Side: Cover & Info */}
            <div className="w-1/3 bg-gray-50 dark:bg-slate-800/50 p-8 border-r border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center overflow-y-auto transition-colors">
              {bookPreview.coverUrl ? (
                <img 
                  src={bookPreview.coverUrl} 
                  alt="Cover" 
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(bookPreview.title)}&size=400&background=4f46e5&color=fff&length=3&font-size=0.3`;
                  }}
                  className="w-48 h-64 object-cover rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 mb-6 transition-colors" 
                />
              ) : (
                <div className="w-48 h-64 bg-gray-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 mb-6 shadow-inner transition-colors">
                  <ImageIcon size={48} />
                </div>
              )}
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight mb-2 transition-colors">{bookPreview.title}</h2>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 transition-colors">{bookPreview.author}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 shadow-sm transition-colors">
                <FileText size={12} /> {bookPreview.pages} Pages
              </div>
            </div>

            {/* Right Side: Chapter List & Actions */}
            <div className="w-2/3 flex flex-col h-full bg-white dark:bg-slate-900 transition-colors">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0 transition-colors">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 transition-colors">Generated Syllabus</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors">Review the AI-extracted chapters before adding.</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${themeClasses.bgLight} ${themeClasses.text}`}>
                  {bookPreview.chapters?.length || 0} Chapters Found
                </div>
              </div>

              {/* Scrollable Chapter List */}
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900 min-h-0 transition-colors">
                <div className="space-y-2">
                  {bookPreview.chapters?.map((ch, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-slate-800 transition-colors hover:${themeClasses.border} hover:${themeClasses.bgLight}`}>
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 transition-colors">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">{ch.name || ch}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex gap-4 justify-end shrink-0 transition-colors">
                <button onClick={() => setBookPreview(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={() => handleConfirmSmartBook(activeSubjectId)} 
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-2 ${themeClasses.primary}`}
                >
                  <CheckCircle2 size={16} /> Confirm & Add to Tracker
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTracker;