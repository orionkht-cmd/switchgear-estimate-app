import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, setDoc, getDocs,
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
  Users, RefreshCw, Sparkles, Printer, FileSpreadsheet,
  Wifi, WifiOff, AlertCircle, Trash2, Edit, Truck, Hammer, Coins, FileSignature,
  Lightbulb, Edit2, Download, Upload, ArrowUpDown, ArrowUp, ArrowDown,
  Building2, Globe, LayoutList, PieChart
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

// 통계 계산 헬퍼 함수 (리스트를 받아서 통계 객체 반환)
const calculateStatsFromList = (dataList) => {
  const ongoing = dataList.filter(p => p.status === '진행중' || p.status === 'In Progress').length;
  const won = dataList.filter(p => p.status === '수주' || p.status === 'Won').length;
  let totalWonAmount = 0, totalWonProfit = 0;
  dataList.forEach(p => {
    if (p.status === '수주' || p.status === 'Won') {
      const amount = p.contractAmount || p.revisions?.[p.revisions.length - 1]?.amount || 0;
      totalWonAmount += amount;
      totalWonProfit += (amount - (p.finalCost || 0));
    }
  });
  const avgMargin = totalWonAmount > 0 ? ((totalWonProfit / totalWonAmount) * 100).toFixed(1) : 0;
  return { ongoing, won, totalWonAmount, avgMargin };
};

// Status 한글화
const StatusBadge = ({ status }) => {
  const styles = {
    '진행중': 'bg-blue-100 text-blue-800 border-blue-200',
    '수주': 'bg-green-100 text-green-800 border-green-200',
    '실주': 'bg-red-100 text-red-800 border-red-200',
    '보류': 'bg-gray-100 text-gray-800 border-gray-200',
  };
  
  const label = {
    'In Progress': '진행중',
    'Won': '수주',
    'Lost': '실주',
    'Hold': '보류'
  }[status] || status;

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[label] || styles['보류']}`}>
      {label}
    </span>
  );
};

// --- Main Component ---
export default function App() {
  const [user, setUser] = useState(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'projects'
  const [selectedCompany, setSelectedCompany] = useState('all'); // 'all' or company name (프로젝트 리스트 필터용)

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // UI State
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  // Data Inputs
  const [newRevNote, setNewRevNote] = useState('');
  const [newRevAmount, setNewRevAmount] = useState('');
  const [editingRevIndex, setEditingRevIndex] = useState(null);
  const [editRevData, setEditRevData] = useState({ amount: '', note: '' });
  const [finalCostInput, setFinalCostInput] = useState(''); 
  const [contractAmountInput, setContractAmountInput] = useState('');

  const companiesList = ['골드텍', '한양기전공업', '한양기전', '새봄엔지니어링'];

  const [projectForm, setProjectForm] = useState({
    projectIdDisplay: '', 
    name: '', client: '', manager: '', salesRep: '', 
    contractMethod: '수의계약',
    ledgerName: '골드텍',
    contractAmount: 0
  });

  const fileInputRef = useRef(null);

  // --- Tailwind CSS Load ---
  useEffect(() => {
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
        if (updated) {
          setSelectedProject(updated);
          if (updated.finalCost && !finalCostInput) setFinalCostInput(updated.finalCost);
          if (updated.contractAmount && !contractAmountInput) setContractAmountInput(updated.contractAmount);
        }
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

  // --- Filtering & Sorting Logic ---
  const filteredAndSortedProjects = useMemo(() => {
    let data = [...projects];

    // 0. 대장(회사) 필터링
    if (selectedCompany !== 'all') {
      data = data.filter(p => p.ledgerName === selectedCompany);
    }

    // 1. 검색 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) || 
        (p.salesRep && p.salesRep.toLowerCase().includes(query)) ||
        (p.client && p.client.toLowerCase().includes(query))
      );
    }

    // 2. 정렬
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'amount') {
          aValue = a.revisions?.[a.revisions.length - 1]?.amount || 0;
          bValue = b.revisions?.[b.revisions.length - 1]?.amount || 0;
        } 
        else if (sortConfig.key === 'contractAmount') {
          aValue = a.contractAmount || 0;
          bValue = b.contractAmount || 0;
        }
        else if (sortConfig.key === 'manager') {
          aValue = (a.salesRep || '') + (a.manager || '');
          bValue = (b.salesRep || '') + (b.manager || '');
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [projects, searchQuery, sortConfig, selectedCompany]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- Handlers ---
  const handleMenuClick = (tab, company = 'all') => {
    setActiveTab(tab);
    if(tab === 'projects') {
        setSelectedCompany(company);
    }
  };

  const handleOpenCreateModal = () => {
    const defaultId = `PJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setProjectForm({ 
      projectIdDisplay: defaultId, 
      name: '', client: '', manager: '', salesRep: '', contractMethod: '수의계약',
      ledgerName: selectedCompany !== 'all' ? selectedCompany : '골드텍', 
      contractAmount: 0
    });
    setIsEditMode(false);
    setIsNewProjectModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedProject) return;
    setProjectForm({
      projectIdDisplay: selectedProject.projectIdDisplay, 
      name: selectedProject.name,
      client: selectedProject.client,
      manager: selectedProject.manager,
      salesRep: selectedProject.salesRep,
      contractMethod: selectedProject.contractMethod,
      ledgerName: selectedProject.ledgerName || '골드텍',
      contractAmount: selectedProject.contractAmount || 0
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
          contractAmount: parseInt(projectForm.contractAmount || 0),
          updatedAt: serverTimestamp(),
          lastModifier: user.uid
        });
        alert("프로젝트 정보가 수정되었습니다.");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), {
          ...projectForm,
          contractAmount: parseInt(projectForm.contractAmount || 0),
          status: '진행중', 
          finalCost: 0, 
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          revisions: [{ rev: 0, date: new Date().toISOString().split('T')[0], amount: 0, note: '최초 생성', file: '-' }],
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
    if (!newRevAmount || !selectedProject) return;
    const newRev = {
      rev: selectedProject.revisions.length,
      date: new Date().toISOString().split('T')[0],
      amount: parseInt(newRevAmount),
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
      setNewRevAmount('');
      alert('견적 이력이 업데이트되었습니다.');
    } catch (e) { alert('업데이트 실패'); }
  };

  const handleEditRevision = (index, rev) => {
    setEditingRevIndex(index);
    setEditRevData({ amount: rev.amount, note: rev.note });
  };

  const handleSaveEditedRevision = async (index) => {
    if (!selectedProject) return;
    const updatedRevisions = [...selectedProject.revisions];
    const realIndex = selectedProject.revisions.length - 1 - index;
    updatedRevisions[realIndex] = {
      ...updatedRevisions[realIndex],
      amount: parseInt(editRevData.amount),
      note: editRevData.note,
      updatedAt: new Date().toISOString()
    };
    try {
      const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id);
      await updateDoc(projectRef, { revisions: updatedRevisions, lastModifier: user.uid });
      setEditingRevIndex(null);
      alert('수정되었습니다.');
    } catch (e) { alert('수정 실패'); }
  };

  const handleCancelEdit = () => {
    setEditingRevIndex(null);
    setEditRevData({ amount: '', note: '' });
  };

  const handleStatusChange = async (status) => {
    if (!selectedProject) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id), { status });
  };

  const handleUpdateCostAndContract = async () => {
    if (!selectedProject) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id), { 
        finalCost: parseInt(finalCostInput || 0),
        contractAmount: parseInt(contractAmountInput || 0)
      });
      alert("금액 정보가 저장되었습니다.");
    } catch (e) { alert('저장 실패'); }
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

  const handleRefineNote = async () => {
    if (!newRevNote) return alert("내용을 입력해주세요.");
    setAiLoading(true);
    const prompt = `견적 수정 사유 정제: "${newRevNote}"`;
    const result = await generateGeminiContent(prompt);
    setNewRevNote(result.trim());
    setAiLoading(false);
  };

  const handleAnalyzeProject = async () => {
    if (!selectedProject) return;
    setAiLoading(true);
    const lastRev = selectedProject.revisions[selectedProject.revisions.length - 1];
    const margin = calculateMargin(selectedProject.contractAmount || lastRev.amount, selectedProject.finalCost || 0);
    const prompt = `프로젝트 분석: ${selectedProject.name}, 계약금: ${formatCurrency(selectedProject.contractAmount)}, 원가: ${formatCurrency(selectedProject.finalCost)}, 마진율: ${margin}%. 리스크와 조언 3줄 요약.`;
    const result = await generateGeminiContent(prompt);
    setAiAnalysisResult(result);
    setAiLoading(false);
  };

  const handlePrint = () => { window.print(); };

  const handleExportExcel = () => {
    if (!window.XLSX || !selectedProject) return alert("엑셀 로딩중");
    const revisions = [...selectedProject.revisions].reverse();
    const wb = window.XLSX.utils.book_new();
    const wsData = [
      ["프로젝트 관리 카드"],
      [`대장(소속): ${selectedProject.ledgerName}`],
      [`프로젝트명: ${selectedProject.name}`, `계약금액: ${formatCurrency(selectedProject.contractAmount)}`],
      [`발주처: ${selectedProject.client}`, `담당자: ${selectedProject.manager}`],
      [`최종 실행원가: ${formatCurrency(selectedProject.finalCost || 0)}`],
      [],
      ["Rev", "날짜", "수정 사유", "견적금액", "이익금", "이익률"]
    ];
    revisions.forEach((rev) => {
      wsData.push([rev.rev, rev.date, rev.note, rev.amount, rev.amount - (selectedProject.finalCost || 0), 0]);
    });
    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    window.XLSX.utils.book_append_sheet(wb, ws, "이력");
    window.XLSX.writeFile(wb, `${selectedProject.name}_관리카드.xlsx`);
  };

  const handleBackup = async () => { 
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };
  const handleRestoreClick = () => { fileInputRef.current.click(); };
  const handleFileChange = (event) => { 
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async(e) => {
      const data = JSON.parse(e.target.result);
      if(confirm(`${data.length}개 데이터 복원하시겠습니까?`)){
        for(const item of data) if(item.id) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', item.id), item);
        alert('복원 완료');
      }
    };
    reader.readAsText(file);
  };

  // --- Render (Stats Calculation) ---
  // 실시간으로 통계를 계산해서 렌더링
  const totalStats = useMemo(() => calculateStatsFromList(projects), [projects]);

  if (!db) return <div className="p-10 text-center">Firebase 설정 필요</div>;
  if (loading) return <div className="flex h-screen items-center justify-center space-y-4"><div className="text-slate-500 animate-pulse">시스템 연결 중...</div></div>;

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500 ml-1" /> : <ArrowDown className="w-3 h-3 text-blue-500 ml-1" />;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white; padding: 20px; z-index: 9999; } .no-print { display: none !important; } }`}</style>

      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col z-20 no-print flex-shrink-0">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="text-green-400" /> Team<span className="text-green-400">Sync</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">AI-Powered Quotation</p>
          </div>
          
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            <div className="mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">보기 모드</div>
            <button 
                onClick={() => handleMenuClick('dashboard', 'all')} 
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-4 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <PieChart className="w-4 h-4" /> 통합 대시보드
            </button>

            <div className="mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">업체별 관리대장</div>
            {companiesList.map((company) => (
              <button 
                key={company}
                onClick={() => handleMenuClick('projects', company)} 
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${selectedCompany === company && activeTab === 'projects' ? 'bg-slate-700 text-white border-l-4 border-green-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <FolderKanban className="w-4 h-4" /> {company}
              </button>
            ))}
            <button onClick={() => handleMenuClick('projects', 'all')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mt-2 ${selectedCompany === 'all' && activeTab === 'projects' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Globe className="w-4 h-4" /> 전체 프로젝트 보기
            </button>
          </nav>
          
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900">
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
              <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '시스템 정상 연결' : '연결 끊김'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
              <button onClick={handleBackup} className="flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 py-2 rounded bg-slate-800 border border-slate-700"><Download className="w-3 h-3" /> 백업</button>
              <button onClick={handleRestoreClick} className="flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 py-2 rounded bg-slate-800 border border-slate-700"><Upload className="w-3 h-3" /> 복원</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 no-print">
             <div className="flex items-center gap-4 flex-1">
               <h1 className="font-bold text-lg flex items-center gap-2 whitespace-nowrap">
                 {activeTab === 'dashboard' ? '통합 경영 대시보드' : (selectedCompany === 'all' ? '전체 프로젝트' : `${selectedCompany} 대장`)}
               </h1>
               
               {activeTab === 'projects' && (
                 <div className="relative max-w-xs w-full ml-auto hidden md:block">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                 </div>
               )}
             </div>
             
             <button onClick={handleOpenCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 whitespace-nowrap ml-4">
               <Plus className="w-4 h-4" /> 프로젝트 등록
             </button>
          </header>

          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'dashboard' ? (
              <div className="animate-fade-in space-y-8">
                {/* 1. Global Total Stats */}
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600"/> 전체 통합 현황 (Total)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
                      <p className="text-slate-400 text-sm font-medium">진행중 견적</p>
                      <p className="text-3xl font-bold mt-2">{totalStats.ongoing}<span className="text-sm font-normal ml-1 text-slate-400">건</span></p>
                    </div>
                    <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
                      <p className="text-slate-400 text-sm font-medium">수주 성공</p>
                      <p className="text-3xl font-bold mt-2 text-green-400">{totalStats.won}<span className="text-sm font-normal ml-1 text-slate-400">건</span></p>
                    </div>
                    <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
                      <p className="text-slate-400 text-sm font-medium">수주 총액</p>
                      <p className="text-3xl font-bold mt-2">{new Intl.NumberFormat('ko-KR', { notation: "compact" }).format(totalStats.totalWonAmount)}</p>
                    </div>
                    <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
                      <p className="text-slate-400 text-sm font-medium">평균 이익률</p>
                      <p className="text-3xl font-bold mt-2 text-orange-400">{totalStats.avgMargin}<span className="text-xl ml-1">%</span></p>
                    </div>
                  </div>
                </div>

                {/* 2. Company Breakdown */}
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-slate-600"/> 업체별 현황 (Breakdown)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {companiesList.map(company => {
                      const companyProjects = projects.filter(p => p.ledgerName === company);
                      const stats = calculateStatsFromList(companyProjects);
                      
                      return (
                        <div key={company} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-slate-700 text-lg">{company}</h3>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{companyProjects.length} Projects</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">진행중</span>
                              <span className="font-bold text-blue-600">{stats.ongoing}건</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">수주</span>
                              <span className="font-bold text-green-600">{stats.won}건</span>
                            </div>
                            <div className="pt-3 border-t border-slate-100">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500">수주액</span>
                                <span className="font-bold text-slate-800">{new Intl.NumberFormat('ko-KR', { notation: "compact" }).format(stats.totalWonAmount)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">이익률</span>
                                <span className={`font-bold ${stats.avgMargin < 10 ? 'text-red-500' : 'text-orange-500'}`}>{stats.avgMargin}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleMenuClick('projects', company)}
                            className="w-full mt-4 bg-slate-50 text-slate-600 text-xs py-2 rounded hover:bg-slate-100 transition-colors"
                          >
                            대장 바로가기
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // --- Project List View (Existing) ---
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in flex flex-col h-full">
                {filteredAndSortedProjects.length > 0 ? (
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>상태 <SortIcon columnKey="status" /></th>
                          <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>프로젝트명 <SortIcon columnKey="name" /></th>
                          <th className="px-4 py-3">소속대장</th>
                          <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('manager')}>담당자 (영업/설계) <SortIcon columnKey="manager" /></th>
                          <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('contractAmount')}>계약금액(VAT포함) <SortIcon columnKey="contractAmount" /></th>
                          <th className="px-4 py-3 text-center">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredAndSortedProjects.map(p => {
                          const lastRev = p.revisions?.[p.revisions.length - 1] || { amount: 0 };
                          const displayAmount = p.contractAmount > 0 ? p.contractAmount : lastRev.amount;
                          const progress = p.progress || {};
                          const doneCount = ['contract', 'production', 'delivery', 'collection'].filter(k => !!progress[k]).length;
                          
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-800">{p.name}</div>
                                <div className="text-xs text-slate-500">{p.client}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{p.ledgerName}</td>
                              <td className="px-4 py-3 text-slate-600">
                                <span className="font-medium">{p.salesRep}</span>
                                <span className="text-slate-400 mx-1">/</span>
                                <span>{p.manager}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-900">
                                {formatCurrency(displayAmount)}
                                {p.contractAmount > 0 && <span className="text-[10px] text-green-600 block">계약확정</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => { setSelectedProject(p); setIsModalOpen(true); setFinalCostInput(p.finalCost || 0); setContractAmountInput(p.contractAmount || 0); setAiAnalysisResult(''); }} className="text-blue-600 hover:underline font-medium">상세</button>
                                <span className="text-[10px] text-slate-400 block mt-1">{doneCount}/4 단계</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 flex flex-col items-center justify-center text-center h-full">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Search className="w-8 h-8 text-slate-400" /></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">데이터가 없습니다</h3>
                    <p className="text-slate-500 text-sm mb-4">선택한 대장({selectedCompany === 'all' ? '전체' : selectedCompany})에 프로젝트가 없습니다.</p>
                    <button onClick={handleOpenCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">신규 등록</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals included implicitly */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{isEditMode ? '프로젝트 정보 수정' : '신규 프로젝트 등록'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">소속 대장 (회사 선택)</label>
                <select className="w-full border p-2 rounded bg-slate-50 font-bold" value={projectForm.ledgerName} onChange={e => setProjectForm({...projectForm, ledgerName: e.target.value})}>
                  <option value="골드텍">골드텍</option>
                  <option value="한양기전공업">한양기전공업</option>
                  <option value="한양기전">한양기전</option>
                  <option value="새봄엔지니어링">새봄엔지니어링</option>
                </select>
              </div>
              <div><label className="text-xs text-slate-500 block mb-1">프로젝트 번호</label><input className="w-full border p-2 rounded bg-slate-50" value={projectForm.projectIdDisplay} onChange={e => setProjectForm({...projectForm, projectIdDisplay: e.target.value})} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">프로젝트명</label><input className="w-full border p-2 rounded" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">발주처</label><input className="w-full border p-2 rounded" value={projectForm.client} onChange={e => setProjectForm({...projectForm, client: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-500 block mb-1">영업 담당</label><input className="w-full border p-2 rounded" value={projectForm.salesRep} onChange={e => setProjectForm({...projectForm, salesRep: e.target.value})} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">설계/PM 담당</label><input className="w-full border p-2 rounded" value={projectForm.manager} onChange={e => setProjectForm({...projectForm, manager: e.target.value})} /></div>
              </div>
              <div><label className="text-xs text-slate-500 block mb-1">계약금액 (확정시 입력)</label><input type="number" className="w-full border p-2 rounded" value={projectForm.contractAmount} onChange={e => setProjectForm({...projectForm, contractAmount: e.target.value})} placeholder="0" /></div>
              <div>
                 <label className="text-xs text-slate-500 block mb-1">계약 방법</label>
                 <select className="w-full border p-2 rounded" value={projectForm.contractMethod} onChange={e => setProjectForm({...projectForm, contractMethod: e.target.value})}>
                    <option value="수의계약">수의계약</option>
                    <option value="지명경쟁">지명경쟁</option>
                    <option value="일반경쟁">일반경쟁</option>
                    <option value="마스(MAS)">마스(MAS)</option>
                    <option value="3자단가">3자단가</option>
                    <option value="기타">기타</option>
                 </select>
              </div>
              <button onClick={handleSaveProject} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{isEditMode ? '저장' : '등록'}</button>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="w-full text-slate-500 py-2">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:block print:bg-white print:static">
          <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] print:h-auto print:w-full print:max-w-none flex flex-col shadow-2xl print:shadow-none print-area animate-scale-in">
            {/* Header */}
            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 print:bg-white print:border-b-2 gap-4">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded">{selectedProject.ledgerName}</span>
                   <StatusBadge status={selectedProject.status} />
                 </div>
                 <h2 className="font-bold text-xl flex items-center gap-2 text-slate-900">
                   {selectedProject.name}
                 </h2>
                 <p className="text-sm text-slate-500 mt-1">{selectedProject.projectIdDisplay} • {selectedProject.client}</p>
                 <div className="flex gap-4 mt-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 inline-block">
                    <span className="flex items-center gap-1"><Briefcase className="w-4 h-4 text-slate-400"/> 영업: <strong>{selectedProject.salesRep}</strong></span>
                    <span className="w-px h-4 bg-slate-300"></span>
                    <span className="flex items-center gap-1"><User className="w-4 h-4 text-slate-400"/> 설계/PM: <strong>{selectedProject.manager}</strong></span>
                 </div>
               </div>
               
               <div className="flex items-center gap-2 no-print">
                 <button onClick={handleOpenEditModal} className="p-2 hover:bg-blue-50 text-slate-600 rounded-lg"><Edit className="w-5 h-5 text-blue-600" /></button>
                 <button onClick={handleDeleteProject} className="p-2 hover:bg-red-50 text-slate-600 rounded-lg"><Trash2 className="w-5 h-5 text-red-600" /></button>
                 <div className="w-px h-6 bg-slate-300 mx-1"></div>
                 <button onClick={handlePrint} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"><Printer className="w-4 h-4" /></button>
                 <button onClick={handleExportExcel} className="p-2 hover:bg-green-50 text-slate-600 rounded-lg"><FileSpreadsheet className="w-4 h-4" /></button>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="text-slate-400 hover:text-slate-600"/></button>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 no-print">
              <div className="grid grid-cols-4 gap-4">
                {[{ key: 'contract', label: '계약', icon: FileSignature }, { key: 'production', label: '제작', icon: Hammer }, { key: 'delivery', label: '납품', icon: Truck }, { key: 'collection', label: '수금', icon: Coins }].map((step) => {
                  const isDone = !!(selectedProject.progress || {})[step.key];
                  return (
                    <button key={step.key} onClick={() => handleProgressToggle(step.key)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isDone ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                      <step.icon className="w-5 h-5 mb-1" />
                      <span className="font-bold text-sm">{step.label}</span>
                      <span className="text-[10px] opacity-80">{(selectedProject.progress || {})[step.key] || '-'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row print:block print:overflow-visible">
              {/* History */}
              <div className="flex-1 overflow-auto p-6 border-r border-slate-100 bg-slate-50/30 print:bg-white print:border-none">
                <h3 className="font-bold mb-4 flex items-center gap-2"><History className="w-4 h-4"/> 견적 히스토리</h3>
                <div className="space-y-4">
                  {[...selectedProject.revisions].reverse().map((rev, idx) => {
                    const isEditing = editingRevIndex === idx;
                    return (
                      <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative group">
                        {!isEditing && (
                          <button onClick={() => handleEditRevision(idx, rev)} className="absolute top-3 right-3 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity no-print"><Edit2 className="w-4 h-4" /></button>
                        )}
                        {isEditing ? (
                          <div className="space-y-2 mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <input type="number" className="w-full p-1 text-sm border rounded" value={editRevData.amount} onChange={(e) => setEditRevData({...editRevData, amount: e.target.value})} placeholder="금액" />
                            <textarea className="w-full p-1 text-sm border rounded h-16 resize-none" value={editRevData.note} onChange={(e) => setEditRevData({...editRevData, note: e.target.value})} placeholder="사유" />
                            <div className="flex justify-end gap-2"><button onClick={handleCancelEdit} className="text-xs text-slate-500">취소</button><button onClick={() => handleSaveEditedRevision(idx)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded">저장</button></div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100">Rev.{rev.rev}</span>
                              <span className="text-xs text-slate-400">{rev.date}</span>
                            </div>
                            <div className="flex justify-between items-end mb-3">
                               <div className="font-bold text-lg text-slate-800">{formatCurrency(rev.amount)}</div>
                               {selectedProject.finalCost > 0 && <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">마진 {calculateMargin(rev.amount, selectedProject.finalCost)}%</div>}
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{rev.note}</p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-80 p-6 bg-white overflow-auto no-print flex flex-col gap-6">
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                  <h4 className="font-bold text-sm text-emerald-900 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4"/> 계약 및 원가 관리</h4>
                  <div className="space-y-3">
                    <div><label className="text-[10px] font-bold text-emerald-800 block mb-1">최종 계약금액 (VAT포함)</label><input type="number" className="w-full border p-2 rounded text-sm bg-white" placeholder="0" value={contractAmountInput} onChange={(e) => setContractAmountInput(e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-emerald-800 block mb-1">최종 실행원가 (VAT포함)</label><input type="number" className="w-full border p-2 rounded text-sm bg-white" placeholder="0" value={finalCostInput} onChange={(e) => setFinalCostInput(e.target.value)} /></div>
                    <button onClick={handleUpdateCostAndContract} className="w-full bg-emerald-600 text-white py-2 rounded text-xs font-bold hover:bg-emerald-700">금액 정보 저장</button>
                  </div>
                  {contractAmountInput > 0 && finalCostInput > 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 text-right">
                      <div className="text-xs text-emerald-700">예상 이익금</div>
                      <div className="font-bold text-emerald-900">{formatCurrency(contractAmountInput - finalCostInput)}</div>
                      <div className="text-xs text-emerald-700 mt-1">이익률 <span className="font-bold">{calculateMargin(contractAmountInput, finalCostInput)}%</span></div>
                    </div>
                  )}
                </div>

                <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
                  <h4 className="font-bold text-sm text-purple-900 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4"/> AI 프로젝트 분석</h4>
                  {!aiAnalysisResult && <button onClick={handleAnalyzeProject} disabled={aiLoading} className="w-full bg-purple-600 text-white py-2 rounded text-xs font-bold hover:bg-purple-700 shadow-sm flex items-center justify-center gap-2">{aiLoading ? '분석 중...' : '✨ 분석 실행하기'}</button>}
                  {aiAnalysisResult && <div className="bg-white p-3 rounded-lg border border-purple-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed animate-fade-in">{aiAnalysisResult}<button onClick={() => setAiAnalysisResult('')} className="block w-full text-center text-[10px] text-slate-400 mt-2 hover:underline">다시 분석</button></div>}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-500 mb-2 uppercase">상태 변경</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['진행중', '수주', '실주', '보류'].map(s => <button key={s} onClick={() => handleStatusChange(s)} className={`text-xs py-2 rounded border font-medium ${selectedProject.status === s ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-50 text-slate-600'}`}>{s}</button>)}
                  </div>
                </div>

                <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
                  <h4 className="font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/> 새 견적 리비전</h4>
                  <div className="space-y-3">
                    <input type="number" className="w-full border p-2 rounded text-sm bg-white" value={newRevAmount} onChange={e => setNewRevAmount(e.target.value)} placeholder="견적금액 (VAT포함)" />
                    <div className="relative">
                      <textarea className="w-full border p-2 rounded text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 bg-white" value={newRevNote} onChange={e => setNewRevNote(e.target.value)} placeholder="수정 사유..." />
                      <button onClick={handleRefineNote} disabled={aiLoading} className="absolute bottom-2 right-2 text-indigo-600 hover:text-indigo-800 bg-white/80 p-1 rounded-full"><Sparkles className="w-4 h-4" /></button>
                    </div>
                    <button onClick={handleAddRevision} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all">리비전 저장</button>
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
