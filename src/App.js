import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  LayoutDashboard, FolderKanban, FileText, Plus, History, 
  ChevronRight, Search, Save, X, CheckCircle2, TrendingUp, 
  Briefcase, User, Calculator, ScrollText, DollarSign,
  Users, RefreshCw, Sparkles, Mail, Printer, FileSpreadsheet,
  Wifi, WifiOff, AlertCircle, Trash2, Edit, Truck, Hammer, Coins, FileSignature
} from 'lucide-react';

// --- [중요] Firebase 설정 ---
const firebaseConfig = {
  apiKey: "AIzaSyB1T4saWXiTKmTTTz42xMTllwjnVj_dL28",
  authDomain: "myswitchgear-b0a30.firebaseapp.com",
  projectId: "myswitchgear-b0a30",
  storageBucket: "myswitchgear-b0a30.firebasestorage.app",
  messagingSenderId: "445093412286",
  appId: "1:445093412286:web:a64b5ebb951796c2958def",
  measurementId: "G-ZX4E02W52E"
};

// --- Firebase 초기화 ---
let db, auth;
try {
  const config = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
  const app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase 초기화 오류");
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'switchgear-pro';

// --- Gemini API Helper ---
const generateGeminiContent = async (prompt) => {
  const apiKey = ""; 
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!response.ok) throw new Error('API 호출 실패');
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI 응답을 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.";
  }
};

// --- Helper Functions ---
const formatCurrency = (amount) => {
  if (!amount) return '0';
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
};

const calculateMargin = (amount, cost) => {
  if (!amount || !cost) return 0;
  return ((amount - cost) / amount * 100).toFixed(1);
};

const StatusBadge = ({ status }) => {
  const styles = {
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'Won': 'bg-green-100 text-green-800 border-green-200',
    'Lost': 'bg-red-100 text-red-800 border-red-200',
    'Hold': 'bg-gray-100 text-gray-800 border-gray-200',
  };
  const labels = {
    'In Progress': '진행중',
    'Won': '수주',
    'Lost': '실주',
    'Hold': '보류',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[status] || styles['Hold']}`}>
      {labels[status]}
    </span>
  );
};

// --- Main Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // UI State
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  const [newRevNote, setNewRevNote] = useState('');
  const [newRevAmount, setNewRevAmount] = useState('');
  const [newRevCost, setNewRevCost] = useState('');

  const [projectForm, setProjectForm] = useState({
    name: '', client: '', manager: '', salesRep: '', contractMethod: '수의계약'
  });

  // --- [핵심 수정] Tailwind CSS 강제 로드 ---
  useEffect(() => {
    // 이미 로드되었는지 확인
    if (document.getElementById('tailwind-cdn')) return;
    
    const script = document.createElement('script');
    script.id = 'tailwind-cdn';
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);
  }, []);

  // --- Auth & Data Sync ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Failed:", error);
        setAuthError(error.message);
        setLoading(false);
        if (error.code === 'auth/operation-not-allowed') {
          alert("로그인 실패: Firebase 콘솔에서 '익명(Anonymous)' 로그인을 활성화해주세요.");
        } else if (error.code === 'auth/unauthorized-domain') {
           alert("도메인 권한 오류: Firebase 콘솔 > Authentication > Settings > Authorized Domains 에 현재 도메인을 추가해주세요.");
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsConnected(true);
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      projectsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProjects(projectsData);
      
      if (selectedProject) {
        const updated = projectsData.find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
      
      setLoading(false);
    }, (error) => {
      setIsConnected(false);
      console.error("Firestore Error:", error);
      alert("데이터 로드 실패: Firestore 보안 규칙(Rules)을 확인해주세요.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, selectedProject?.id]);

  useEffect(() => {
    if (window.XLSX) {
      setXlsxLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => setXlsxLoaded(true);
    document.body.appendChild(script);
  }, []);

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    setProjectForm({ name: '', client: '', manager: '', salesRep: '', contractMethod: '수의계약' });
    setIsEditMode(false);
    setIsNewProjectModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedProject) return;
    setProjectForm({
      name: selectedProject.name,
      client: selectedProject.client,
      manager: selectedProject.manager,
      salesRep: selectedProject.salesRep,
      contractMethod: selectedProject.contractMethod
    });
    setIsEditMode(true);
    setIsNewProjectModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.name || !projectForm.client) return alert('필수 입력 항목이 비어있습니다.');
    if (!user) return;

    try {
      if (isEditMode && selectedProject) {
        const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id);
        await updateDoc(projectRef, {
          ...projectForm,
          updatedAt: serverTimestamp(),
          lastModifier: user.uid
        });
        alert("프로젝트 정보가 수정되었습니다.");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), {
          ...projectForm,
          projectIdDisplay: `PJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          status: 'In Progress',
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          revisions: [{ rev: 0, date: new Date().toISOString().split('T')[0], amount: 0, cost: 0, note: '최초 생성', file: '-' }],
          progress: { contract: null, production: null, delivery: null, collection: null }
        });
        alert("새 프로젝트가 등록되었습니다.");
      }
      setIsNewProjectModalOpen(false);
    } catch (e) { alert('저장 중 오류가 발생했습니다: ' + e.message); }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    if (!window.confirm("정말로 이 프로젝트를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id));
      setIsModalOpen(false);
      setSelectedProject(null);
      alert("프로젝트가 삭제되었습니다.");
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  const handleAddRevision = async () => {
    if (!newRevAmount || !newRevCost || !selectedProject) return;
    const newRev = {
      rev: selectedProject.revisions.length,
      date: new Date().toISOString().split('T')[0],
      amount: parseInt(newRevAmount),
      cost: parseInt(newRevCost),
      note: newRevNote || '정기 수정',
      file: `EST_Rev${selectedProject.revisions.length}.xlsx`
    };
    try {
      const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id);
      await updateDoc(projectRef, {
        revisions: [...selectedProject.revisions, newRev],
        updatedAt: serverTimestamp(),
        lastModifier: user.uid
      });
      setNewRevNote('');
      alert('견적 이력이 업데이트되었습니다.');
    } catch (e) { alert('업데이트 실패'); }
  };

  const handleStatusChange = async (status) => {
    if (!selectedProject) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id), { status });
  };

  const handleProgressToggle = async (stage) => {
    if (!selectedProject) return;
    const currentProgress = selectedProject.progress || {};
    const isCompleted = !!currentProgress[stage];
    const newProgress = { ...currentProgress, [stage]: isCompleted ? null : new Date().toISOString().split('T')[0] };
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id), { progress: newProgress });
    } catch (e) { console.error("Progress update failed", e); }
  };

  const handleGenerateEmail = async () => {
    if (!selectedProject) return;
    setAiLoading(true);
    const lastRev = selectedProject.revisions[selectedProject.revisions.length - 1];
    const prompt = `당신은 배전반 제조 회사의 전문 영업 담당자입니다... (생략)`;
    const result = await generateGeminiContent(prompt);
    setGeneratedEmail(result);
    setAiLoading(false);
  };

  const handleRefineNote = async () => {
    if (!newRevNote) return alert("다듬을 내용을 입력해주세요.");
    setAiLoading(true);
    const prompt = `사용자가 입력한 견적 수정 사유를 보고서용으로 다듬어주세요.\n- 입력: "${newRevNote}"\n- 출력: 문장 하나만.`;
    const result = await generateGeminiContent(prompt);
    setNewRevNote(result.trim());
    setAiLoading(false);
  };

  const handlePrint = () => { window.print(); };

  const handleExportExcel = () => {
    if (!window.XLSX || !selectedProject) return alert("엑셀 모듈 로딩 중입니다. 잠시 후 시도해주세요.");
    const revisions = [...selectedProject.revisions].reverse();
    const wb = window.XLSX.utils.book_new();
    const wsData = [
      ["견적 관리 카드"],
      [`프로젝트명: ${selectedProject.name}`],
      [`발주처: ${selectedProject.client}`, `담당자: ${selectedProject.manager}`],
      [],
      ["Rev", "날짜", "수정 사유", "견적금액(VAT별도)", "실행원가", "이익금", "이익률(%)"]
    ];
    revisions.forEach((rev, index) => {
      const r = 6 + index; 
      const row = [
        rev.rev, rev.date, rev.note,
        { t: 'n', v: rev.amount, z: '#,##0' },
        { t: 'n', v: rev.cost, z: '#,##0' },
        { t: 'n', f: `D${r}-E${r}`, z: '#,##0' }, 
        { t: 'n', f: `IF(D${r}=0, 0, F${r}/D${r})`, z: '0.0%' }
      ];
      wsData.push(row);
    });
    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
    window.XLSX.utils.book_append_sheet(wb, ws, "견적 이력");
    window.XLSX.writeFile(wb, `${selectedProject.name}_견적현황.xlsx`);
  };

  // --- Stats ---
  const stats = useMemo(() => {
    const total = projects.length;
    const ongoing = projects.filter(p => p.status === 'In Progress').length;
    const won = projects.filter(p => p.status === 'Won').length;
    let totalWonAmount = 0, totalWonProfit = 0;
    projects.forEach(p => {
      if (p.status === 'Won' && p.revisions?.length > 0) {
        const lastRev = p.revisions[p.revisions.length - 1];
        totalWonAmount += (lastRev.amount || 0);
        totalWonProfit += ((lastRev.amount || 0) - (lastRev.cost || 0));
      }
    });
    const avgMargin = totalWonAmount > 0 ? ((totalWonProfit / totalWonAmount) * 100).toFixed(1) : 0;
    return { ongoing, won, totalWonAmount, avgMargin };
  }, [projects]);

  if (!db) return <div className="p-10 text-center">Firebase 설정 필요</div>;
  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center space-y-4">
      <div className="text-slate-500 animate-pulse">시스템 연결 중...</div>
      {authError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md text-sm border border-red-200">
          <strong>로그인 오류:</strong><br/>{authError}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white; padding: 20px; z-index: 9999; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col z-20 no-print">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="text-green-400" /> Team<span className="text-green-400">Sync</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">AI-Powered Quotation</p>
          </div>
          <nav className="p-4 space-y-2 flex-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-slate-800' : 'text-slate-400 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5" /> 대시보드
            </button>
            <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === 'projects' ? 'bg-slate-800' : 'text-slate-400 hover:text-white'}`}>
              <FileText className="w-5 h-5" /> 프로젝트 대장
            </button>
          </nav>
          {/* Connection Status Indicator */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
              <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '시스템 정상 연결' : '연결 끊김 (오프라인)'}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 no-print">
             <h1 className="font-bold text-lg flex items-center gap-2">
               배전반 견적 관리 <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI On</span>
             </h1>
             <button onClick={handleOpenCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
               <Plus className="w-4 h-4" /> 프로젝트 등록
             </button>
          </header>

          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'dashboard' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">진행중</p><p className="text-2xl font-bold">{stats.ongoing}건</p></div>
                <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">수주 성공</p><p className="text-2xl font-bold text-green-600">{stats.won}건</p></div>
                <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">수주 총액</p><p className="text-2xl font-bold">{new Intl.NumberFormat('ko-KR', { notation: "compact" }).format(stats.totalWonAmount)}</p></div>
                <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">이익률</p><p className="text-2xl font-bold text-indigo-600">{stats.avgMargin}%</p></div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in">
                {projects.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr><th className="px-4 py-3">상태</th><th className="px-4 py-3">프로젝트명</th><th className="px-4 py-3">담당자</th><th className="px-4 py-3 text-right">최종 금액</th><th className="px-4 py-3 text-center">관리</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {projects.map(p => {
                        const lastRev = p.revisions?.[p.revisions.length - 1] || { amount: 0 };
                        // 진행 단계 확인
                        const progress = p.progress || {};
                        const doneCount = ['contract', 'production', 'delivery', 'collection'].filter(k => !!progress[k]).length;
                        
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3">
                              <div className="font-bold">{p.name}</div>
                              <div className="text-xs text-slate-500">{p.client}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{p.salesRep} / {p.manager}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(lastRev.amount)}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => { setSelectedProject(p); setIsModalOpen(true); setGeneratedEmail(''); }} className="text-blue-600 hover:underline">상세</button>
                              <span className="text-[10px] text-slate-400 block mt-1">{doneCount}/4 단계</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FolderKanban className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">등록된 프로젝트가 없습니다</h3>
                    <p className="text-slate-500 text-sm mb-4">우측 상단의 '프로젝트 등록' 버튼을 눌러<br/>첫 번째 견적 관리를 시작해보세요.</p>
                    <button onClick={handleOpenCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                      첫 프로젝트 등록하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create / Edit Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{isEditMode ? '프로젝트 정보 수정' : '신규 프로젝트 등록'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">프로젝트명</label>
                <input className="w-full border p-2 rounded" placeholder="프로젝트명" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">발주처 (고객사)</label>
                <input className="w-full border p-2 rounded" placeholder="발주처" value={projectForm.client} onChange={e => setProjectForm({...projectForm, client: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">영업 담당</label>
                  <input className="w-full border p-2 rounded" placeholder="영업 담당" value={projectForm.salesRep} onChange={e => setProjectForm({...projectForm, salesRep: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">설계/PM 담당</label>
                  <input className="w-full border p-2 rounded" placeholder="설계/PM 담당" value={projectForm.manager} onChange={e => setProjectForm({...projectForm, manager: e.target.value})} />
                </div>
              </div>
              <div>
                 <label className="text-xs text-slate-500 block mb-1">계약 방법</label>
                 <select className="w-full border p-2 rounded" value={projectForm.contractMethod} onChange={e => setProjectForm({...projectForm, contractMethod: e.target.value})}>
                    <option value="수의계약">수의계약</option>
                    <option value="지명경쟁">지명경쟁</option>
                    <option value="일반경쟁">일반경쟁</option>
                    <option value="기타">기타</option>
                 </select>
              </div>
              <button onClick={handleSaveProject} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                {isEditMode ? '수정사항 저장' : '등록하기'}
              </button>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="w-full text-slate-500 py-2">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:block print:bg-white print:static">
          <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] print:h-auto print:w-full print:max-w-none flex flex-col shadow-2xl print:shadow-none print-area">
            {/* Header (Printable) */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 print:bg-white print:border-b-2">
               <div>
                 <h2 className="font-bold text-xl flex items-center gap-2">
                   {selectedProject.name} <span className="no-print"><StatusBadge status={selectedProject.status} /></span>
                 </h2>
                 <p className="text-sm text-slate-500">{selectedProject.projectIdDisplay} • {selectedProject.client}</p>
                 <p className="text-xs text-slate-400 mt-1 print:block hidden">출력일: {new Date().toLocaleDateString()}</p>
               </div>
               
               <div className="flex items-center gap-2 no-print">
                 <button onClick={handleOpenEditModal} className="p-2 hover:bg-blue-50 text-slate-600 rounded-lg" title="정보 수정">
                   <Edit className="w-5 h-5 text-blue-600" />
                 </button>
                 <button onClick={handleDeleteProject} className="p-2 hover:bg-red-50 text-slate-600 rounded-lg" title="프로젝트 삭제">
                   <Trash2 className="w-5 h-5 text-red-600" />
                 </button>
                 <div className="w-px h-6 bg-slate-300 mx-1"></div>
                 <button onClick={handlePrint} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 flex items-center gap-1 text-sm border border-slate-200">
                   <Printer className="w-4 h-4" /> <span className="hidden sm:inline">출력</span>
                 </button>
                 <button onClick={handleExportExcel} className="p-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200 rounded-lg text-slate-600 flex items-center gap-1 text-sm border border-slate-200">
                   <FileSpreadsheet className="w-4 h-4" /> <span className="hidden sm:inline">엑셀</span>
                 </button>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full">
                   <X className="text-slate-400 hover:text-slate-600"/>
                 </button>
               </div>
            </div>

            {/* Progress Bar Section (New Feature) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 no-print">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-1">진행 현황 (클릭하여 상태 변경)</h4>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { key: 'contract', label: '계약 완료', icon: FileSignature },
                  { key: 'production', label: '제작 완료', icon: Hammer },
                  { key: 'delivery', label: '납품 완료', icon: Truck },
                  { key: 'collection', label: '수금 완료', icon: Coins }
                ].map((step, idx) => {
                  const progress = selectedProject.progress || {};
                  const isDone = !!progress[step.key];
                  const date = progress[step.key];
                  
                  return (
                    <button 
                      key={step.key}
                      onClick={() => handleProgressToggle(step.key)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        isDone 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                          : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-400'
                      }`}
                    >
                      <step.icon className={`w-6 h-6 mb-2 ${isDone ? 'text-white' : 'text-slate-300'}`} />
                      <span className="font-bold text-sm">{step.label}</span>
                      <span className="text-[10px] mt-1 h-3">{date || '-'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row print:block print:overflow-visible">
              <div className="flex-1 overflow-auto p-6 border-r border-slate-100 bg-slate-50/30 print:bg-white print:border-none print:overflow-visible">
                <h3 className="font-bold mb-4 flex items-center gap-2 print:text-lg print:border-b print:pb-2">
                  <History className="w-4 h-4"/> 견적 히스토리
                </h3>
                <div className="space-y-4 print:space-y-6">
                  {[...selectedProject.revisions].reverse().map((rev, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm print:shadow-none print:border-slate-800 print:break-inside-avoid">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs print:text-black print:bg-white print:border print:border-black">Rev.{rev.rev}</span>
                        <span className="text-xs text-slate-400 print:text-slate-600">{rev.date}</span>
                      </div>
                      <div className="flex justify-between items-end mb-3">
                         <div>
                           <div className="text-xs text-slate-500">견적가 (VAT별도)</div>
                           <div className="font-bold text-lg">{formatCurrency(rev.amount)}</div>
                         </div>
                         <div className="text-right">
                           <div className="text-xs text-slate-500">실행원가 / 이익률</div>
                           <div className={`font-bold text-sm ${calculateMargin(rev.amount, rev.cost) < 10 ? 'text-red-500' : 'text-green-600'} print:text-black`}>
                             {formatCurrency(rev.cost)} / {calculateMargin(rev.amount, rev.cost)}%
                           </div>
                         </div>
                      </div>
                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded print:bg-white print:border print:border-slate-200 print:text-xs">{rev.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-80 border-r border-slate-100 flex flex-col bg-white no-print">
                <div className="p-4 border-b">
                  <h3 className="font-bold text-sm flex items-center gap-2 text-slate-800"><Mail className="w-4 h-4 text-purple-600"/> 고객 이메일 작성</h3>
                </div>
                <div className="p-4 flex-1 overflow-auto flex flex-col">
                  {generatedEmail ? (
                    <div className="flex-1 flex flex-col">
                      <textarea className="w-full flex-1 border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2" value={generatedEmail} onChange={(e) => setGeneratedEmail(e.target.value)}></textarea>
                      <button onClick={() => {navigator.clipboard.writeText(generatedEmail); alert('복사되었습니다');}} className="w-full bg-slate-100 text-slate-700 py-2 rounded text-sm hover:bg-slate-200">클립보드 복사</button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-4">
                      <Sparkles className="w-8 h-8 mb-2 text-purple-200" />
                      <p className="text-xs mb-4">견적 내용을 바탕으로<br/>AI가 이메일 초안을 작성합니다.</p>
                      <button onClick={handleGenerateEmail} disabled={aiLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                        {aiLoading ? '작성 중...' : '✨ 이메일 초안 생성'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-80 p-6 bg-white overflow-auto no-print">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-xs text-slate-500 mb-2 uppercase">Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['In Progress', 'Won', 'Lost', 'Hold'].map(s => (
                        <button key={s} onClick={() => handleStatusChange(s)} className={`text-xs py-2 rounded border ${selectedProject.status === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white hover:bg-slate-50'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
                    <h4 className="font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/> 새 리비전 등록</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-slate-500 block mb-1">견적가</label><input type="number" className="w-full border p-2 rounded text-sm" value={newRevAmount} onChange={e => setNewRevAmount(e.target.value)} placeholder="0"/></div>
                        <div><label className="text-xs text-slate-500 block mb-1">실행원가</label><input type="number" className="w-full border p-2 rounded text-sm" value={newRevCost} onChange={e => setNewRevCost(e.target.value)} placeholder="0"/></div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1 flex justify-between"><span>수정 사유</span><button onClick={handleRefineNote} disabled={aiLoading} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px]"><Sparkles className="w-3 h-3"/> {aiLoading ? '...' : 'AI 다듬기'}</button></label>
                        <textarea className="w-full border p-2 rounded text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={newRevNote} onChange={e => setNewRevNote(e.target.value)} placeholder="예: 자재비 상승으로..."></textarea>
                      </div>
                      <button onClick={handleAddRevision} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all">업데이트 저장</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
