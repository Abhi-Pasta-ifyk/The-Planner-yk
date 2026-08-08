import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import API from '../api';
import { useAccent } from '../AccentContext'; // <-- Import accent hook

const RevisionTracker = () => {
  const { themeClasses } = useAccent(); // <-- Destructure global theme

  // --- STATE MANAGEMENT ---
  const [masterSubjects, setMasterSubjects] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newSubtext, setNewSubtext] = useState('');
  const [newStudyDate, setNewStudyDate] = useState('');

  // Fetch subjects AND planner items from MongoDB on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both collections in parallel for speed
        const [subjectsRes, plannerRes] = await Promise.all([
          API.get('/subjects'),
          API.get('/planner')
        ]);

        setMasterSubjects(subjectsRes.data);
        
        // Set the default dropdown value to the first subject if it exists
        if (subjectsRes.data.length > 0) {
          setNewSubjectName(subjectsRes.data[0].name);
        }

        const formatted = plannerRes.data.map(item => ({
          ...item,
          id: item._id,
          subjectName: item.subject || 'General'
        }));
        setRevisions(formatted);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterOptions = ['All', ...masterSubjects.map(s => s.name)];

  const getSubjectBadgeStyle = (subjectName) => {
    const sub = masterSubjects.find(s => s.name === subjectName);
    return sub ? `bg-gray-100 dark:bg-slate-800 ${sub.textColor || 'text-gray-700 dark:text-gray-300'}` : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400';
  };

  const getConfidenceStyle = (level) => {
    switch (level) {
      case 'Mastered': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-300 dark:border-green-800 focus:ring-green-500';
      case 'Good': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800 focus:ring-yellow-500';
      case 'Needs Review': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-300 dark:border-red-800 focus:ring-red-500';
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-slate-700';
    }
  };

  // --- ACTIONS ---
  const toggleRevision = async (rowId, revKey) => {
    const targetRow = revisions.find(r => r.id === rowId);
    if (!targetRow) return;

    const updatedRevField = { 
      ...targetRow[revKey], 
      done: !targetRow[revKey].done 
    };

    setRevisions(revisions.map(row => 
      row.id === rowId ? { ...row, [revKey]: updatedRevField } : row
    ));

    try {
      await API.put(`/planner/${rowId}`, { [revKey]: updatedRevField });
    } catch (err) {
      console.error("Failed to update revision status:", err);
    }
  };

  const handleConfidenceChange = async (rowId, newLevel) => {
    setRevisions(revisions.map(row =>
      row.id === rowId ? { ...row, confidenceLevel: newLevel } : row
    ));

    try {
      await API.put(`/planner/${rowId}`, { confidenceLevel: newLevel });
    } catch (err) {
      console.error("Failed to update confidence:", err);
    }
  };

  const handleRevisionDateEdit = async (rowId, revKey, newDate) => {
    const targetRow = revisions.find(r => r.id === rowId);
    if (!targetRow) return;

    const updatedRevField = { 
      ...targetRow[revKey], 
      date: newDate 
    };

    setRevisions(revisions.map(row =>
      row.id === rowId ? { ...row, [revKey]: updatedRevField } : row
    ));

    try {
      await API.put(`/planner/${rowId}`, { [revKey]: updatedRevField });
    } catch (err) {
      console.error("Failed to update revision date:", err);
    }
  };

  const deleteRevision = async (rowId) => {
    setRevisions(revisions.filter(row => row.id !== rowId));
    try {
      await API.delete(`/planner/${rowId}`);
    } catch (err) {
      console.error("Failed to delete planner item:", err);
    }
  };

  const handleInlineEdit = async (rowId, field, value) => {
    setRevisions(revisions.map(row => row.id === rowId ? { ...row, [field]: value } : row));
    try {
      await API.put(`/planner/${rowId}`, { [field]: value });
    } catch (err) {
      console.error("Failed inline update:", err);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newTopic.trim() || !newStudyDate || !newSubjectName) return;

    const d = new Date(newStudyDate);
    const formatDate = (dateObj) => dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const r1 = new Date(d); r1.setDate(d.getDate() + 7);
    const r2 = new Date(d); r2.setDate(d.getDate() + 14);
    const r3 = new Date(d); r3.setDate(d.getDate() + 30);

    const payload = {
      subject: newSubjectName,
      topic: newTopic,
      subtext: newSubtext,
      studiedDate: formatDate(d),
      confidenceLevel: 'Needs Review',
      rev1: { date: formatDate(r1), done: false },
      rev2: { date: formatDate(r2), done: false },
      rev3: { date: formatDate(r3), done: false }
    };

    try {
      const response = await API.post('/planner', payload);
      const savedItem = {
        ...response.data,
        id: response.data._id,
        subjectName: response.data.subject
      };

      setRevisions([...revisions, savedItem]);
      setNewTopic('');
      setNewSubtext('');
      setNewStudyDate('');
    } catch (err) {
      console.error("Failed to create planner entry:", err);
      setErrorMessage(err.response?.data?.error || "Failed to save topic to database.");
    }
  };

  const topicsTracked = revisions.length;
  let dueCount = 0;
  let completedCount = 0;
  revisions.forEach(row => {
    ['rev1', 'rev2', 'rev3'].forEach(rev => {
      if (row[rev]?.done) completedCount++;
      else dueCount++; 
    });
  });

  const filteredRevisions = activeFilter === 'All' ? revisions : revisions.filter(row => row.subjectName === activeFilter);

  if (loading) return <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium">Loading Revision Tracker from database...</div>;

  return (
    <div className="w-full pt-12 pb-16">
      
      <header className="flex justify-between items-end mb-8 border-b-2 border-gray-200/50 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">Revision Tracker</h1>
        </div>
        <div className="flex gap-10 text-center">
          <div>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{topicsTracked}</span>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Topics Tracked</p>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-orange-500">{dueCount}</span>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Total Due</p>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-green-600 dark:text-green-500">{completedCount}</span>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Completed Rev.</p>
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm font-bold flex items-center gap-2 transition-colors">
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {filterOptions.map(option => (
          <button
            key={option}
            onClick={() => setActiveFilter(option)}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
              activeFilter === option 
                ? themeClasses.primary 
                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 text-[10px] text-gray-400 dark:text-gray-500 tracking-widest uppercase transition-colors">
              <th className="py-4 px-6 font-bold w-32">Subject</th>
              <th className="py-4 px-6 font-bold">Topic</th>
              <th className="py-4 px-4 font-bold text-center w-28">Studied</th>
              <th className="py-4 px-4 font-bold text-center w-36">Confidence</th>
              <th className="py-4 px-4 font-bold text-center w-16">Count</th>
              <th className="py-4 px-4 font-bold text-center w-28">Rev. 1</th>
              <th className="py-4 px-4 font-bold text-center w-28">Rev. 2</th>
              <th className="py-4 px-4 font-bold text-center w-28">Rev. 3</th>
              <th className="py-4 px-4 font-bold text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredRevisions.length > 0 ? (
              filteredRevisions.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-slate-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="py-5 px-6">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors ${getSubjectBadgeStyle(row.subjectName)}`}>
                      {row.subjectName}
                    </span>
                  </td>
                  <td className="py-5 px-6 pr-10">
                    <input 
                      value={row.topic} 
                      onChange={(e) => handleInlineEdit(row.id, 'topic', e.target.value)}
                      className="font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none w-full border-b border-transparent focus:border-gray-300 dark:focus:border-slate-600 transition-colors mb-0.5"
                    />
                    <input 
                      value={row.subtext || ''} 
                      onChange={(e) => handleInlineEdit(row.id, 'subtext', e.target.value)}
                      className="text-[10px] text-gray-400 dark:text-gray-500 font-medium bg-transparent outline-none w-full border-b border-transparent focus:border-gray-200 dark:focus:border-slate-600 transition-colors"
                      placeholder="Add subtext..."
                    />
                  </td>
                  <td className="py-5 px-4 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">{row.studiedDate}</td>
                  
                  <td className="py-5 px-4 text-center">
                    <select
                      value={row.confidenceLevel || 'Needs Review'}
                      onChange={(e) => handleConfidenceChange(row.id, e.target.value)}
                      className={`min-w-[115px] pl-3 pr-7 py-1.5 text-[11px] font-bold rounded border shadow-sm outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 transition-all cursor-pointer ${getConfidenceStyle(row.confidenceLevel || 'Needs Review')}`}
                    >
                      <option value="Needs Review">Needs Review</option>
                      <option value="Good">Good</option>
                      <option value="Mastered">Mastered</option>
                    </select>
                  </td>

                  <td className="py-5 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs shadow-sm transition-colors ${themeClasses.primary}`}>
                      {(row.rev1?.done ? 1 : 0) + (row.rev2?.done ? 1 : 0) + (row.rev3?.done ? 1 : 0)}
                    </span>
                  </td>

                  {['rev1', 'rev2', 'rev3'].map(revKey => (
                     <td key={revKey} className="py-5 px-2">
                       <div className={`flex items-center justify-between w-full py-1 pl-2 pr-1 rounded-md border shadow-sm transition-colors ${
                         row[revKey]?.done
                           ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50'
                           : 'bg-red-50/50 dark:bg-red-900/10 text-red-500 dark:text-red-400 border-red-100 dark:border-red-900/30'
                       }`}>
                         <input
                           type="text"
                           value={row[revKey]?.date || ''}
                           onChange={(e) => handleRevisionDateEdit(row.id, revKey, e.target.value)}
                           className="w-full bg-transparent outline-none text-[11px] font-bold text-center"
                         />
                         
                         <button
                           onClick={() => toggleRevision(row.id, revKey)}
                           className={`ml-1 p-1 rounded transition-colors ${
                             row[revKey]?.done ? 'hover:bg-green-200 dark:hover:bg-green-800/50' : 'hover:bg-red-100 dark:hover:bg-red-900/40 text-red-400 dark:text-red-500'
                           }`}
                         >
                           {row[revKey]?.done
                             ? <Check size={14} strokeWidth={3} />
                             : <div className="w-3.5 h-3.5 rounded-[3px] border-[2px] border-current opacity-70"></div>
                           }
                         </button>
                       </div>
                     </td>
                  ))}

                  <td className="py-5 px-4 text-center">
                     <button onClick={() => deleteRevision(row.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="9" className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium">No revisions tracked for {activeFilter}.</td></tr>
            )}
          </tbody>
        </table>

        {masterSubjects.length > 0 ? (
          <form onSubmit={handleAddTopic} className="flex items-center gap-4 bg-gray-50/80 dark:bg-slate-800/50 p-5 border-t border-gray-100 dark:border-slate-800 transition-colors">
             <div className={`p-2 rounded-lg transition-colors ${themeClasses.bgLight} ${themeClasses.text}`}><Plus size={18} /></div>
             
             <select 
               value={newSubjectName} 
               onChange={(e) => setNewSubjectName(e.target.value)}
               className={`text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-transparent focus:ring-2 transition-colors ${themeClasses.ring}`}
             >
               {masterSubjects.map(opt => <option key={opt.id || opt._id || opt.name} value={opt.name}>{opt.name}</option>)}
             </select>

             <div className="flex-1 flex flex-col gap-1">
               <input 
                 type="text" required value={newTopic} onChange={e => setNewTopic(e.target.value)}
                 className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
                 placeholder="New topic to revise..."
               />
             </div>

             <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition-colors focus-within:border-transparent focus-within:ring-2 ${themeClasses.ring}`}>
               <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
               <input 
                 type="date" required value={newStudyDate} onChange={e => setNewStudyDate(e.target.value)}
                 className="text-xs font-bold text-slate-600 dark:text-slate-300 outline-none bg-transparent cursor-pointer transition-colors"
               />
             </div>

             <button type="submit" disabled={!newTopic.trim() || !newStudyDate} className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors ${themeClasses.primary}`}>
               Track Topic
             </button>
          </form>
        ) : (
          <div className="p-5 text-center text-sm text-gray-400 dark:text-gray-500 bg-gray-50/80 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 transition-colors">
             Please create a Subject in the Tracker before adding revisions.
          </div>
        )}
      </div>

    </div>
  );
};

export default RevisionTracker;