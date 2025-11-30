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
  Lightbulb, Edit2, Download, Upload, Database
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
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  // Revision Add State
  const [newRevNote, setNewRevNote] = useState('');
  const [newRevAmount, setNewRevAmount] = useState('');
  
  // Revision Edit State
  const [editingRevIndex, setEditingRevIndex] = useState(null);
  const [editRevData, setEditRevData] = useState({ amount: '', note: '' });

  const [finalCostInput, setFinalCostInput] = useState(''); 

  const [projectForm, setProjectForm] = useState({
    projectIdDisplay: '', 
    name: '', client: '', manager: '', salesRep: '', contractMethod: '수의계약'
  });

  const fileInputRef = useRef(null);

  // --- Tailwind CSS 강제 로드 ---
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
        if (updated) {
          setSelectedProject(updated);
          if (updated.finalCost && !finalCostInput) setFinalCostInput(updated.finalCost);
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

  // --- Backup & Restore Handlers ---
  const handleBackup = async () => {
    if (!user || projects.length === 0) return alert('백업할 데이터가 없습니다.');
    if (!window.confirm('현재 데이터를 JSON 파일로 다운로드하시겠습니까?')) return;

    try {
      // Fetch fresh data just in case
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = href;
      link.download = `backup_switchgear_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (e) {
      alert('백업 중 오류 발생: ' + e.message);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error("잘못된 데이터 형식입니다.");

        if (!window.confirm(`총 ${data.length}개의 프로젝트 데이터를 복원하시겠습니까?\n(동일한 ID의 데이터는 덮어씌워집니다)`)) return;

        let successCount = 0;
        for (const item of data) {
          if (item.id) {
            // 원본 ID 그대로 복원 (덮어쓰기)
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', item.id), item);
            successCount++;
          }
        }
        alert(`${successCount}개의 프로젝트가 성공적으로 복원되었습니다.`);
      } catch (err) {
        alert("복원 실패: " + err.message);
      }
      // Reset input
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  // --- Project Handlers ---
  const handleOpenCreateModal = () => {
    const defaultId = `PJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setProjectForm({ 
      projectIdDisplay: defaultId, 
      name: '', client: '', manager: '', salesRep: '', contractMethod: '수의계약' 
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

  // --- Revision Edit Handlers ---
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
      await updateDoc(projectRef, {
        revisions: updatedRevisions,
        lastModifier: user.uid
      });
      setEditingRevIndex(null);
      alert('수정되었습니다.');
    } catch (e) {
      alert('수정 실패: ' + e.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingRevIndex(null);
    setEditRevData({ amount: '', note: '' });
  };

  const handleStatusChange = async (status) => {
    if (!selectedProject) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id), { status });
  };

  const handleUpdateFinalCost = async () => {
    if (!selectedProject) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', selectedProject.id), { 
        finalCost: parseInt(finalCostInput || 0)
      });
      alert("실행원가가 저장되었습니다.");
    } catch (e) { alert('원가 저장 실패'); }
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

  // --- Gemini Features ---

  const handleRefineNote = async () => {
    if (!newRevNote) return alert("다듬을 내용을 입력해주세요.");
    setAiLoading(true);
    const prompt = `사용자가 입력한 견적 수정 사유를 보고서용으로 다듬어주세요.\n- 입력: "${newRevNote}"\n- 출력: 문장 하나만.`;
    const result = await generateGeminiContent(prompt);
    setNewRevNote(result.trim());
    setAiLoading(false);
  };

  const handleAnalyzeProject = async () => {
    if (!selectedProject) return;
    setAiLoading(true);
    const lastRev = selectedProject.revisions[selectedProject.revisions.length - 1];
    const margin = calculateMargin(lastRev.amount, selectedProject.finalCost || 0);
    
    const prompt = `
      당신은 배전반 및 전기 공사 분야의 전문 프로젝트 매니저입니다.
      아래 프로젝트 현황 데이터를 분석하여 위험 요소와 개선할
