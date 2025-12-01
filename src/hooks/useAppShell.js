import { useState, useEffect, useMemo, useRef } from 'react';
import {
  addDoc,
  updateDoc,
  setDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
} from 'firebase/firestore';
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from 'firebase/auth';
import { db, auth, appId } from '../firebase';
import { getProjectsCollection, getProjectDoc } from '../services/projects';
import { getProjectYear } from '../utils/projectYear';

export const useAppShell = () => {
  const defaultCompanies = ['골드텍', '한양기전공업', '한양기전', '새봄엔지니어링'];

  const [user, setUser] = useState(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompany, setSelectedCompany] = useState('all');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc',
  });
  const [selectedYear, setSelectedYear] = useState('all');

  // UI State
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] =
    useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  const [companies, setCompanies] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('companiesList');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load companies from localStorage', e);
    }
    return defaultCompanies;
  });

  const [projectForm, setProjectForm] = useState({
    projectIdDisplay: '',
    name: '',
    client: '',
    manager: '',
    salesRep: '',
    contractMethod: '수의계약',
    ledgerName: '골드텍',
    contractAmount: 0,
  });

  const fileInputRef = useRef(null);

  // --- Auth ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== 'undefined' &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Auth Failed:', error);
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

  // --- Projects subscription ---
  useEffect(() => {
    if (!user || !db) return;
    const q = query(getProjectsCollection(db, appId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIsConnected(true);
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        projectsData.sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );
        setProjects(projectsData);

        if (selectedProject) {
          const updated = projectsData.find(
            (p) => p.id === selectedProject.id,
          );
          if (updated) {
            setSelectedProject(updated);
          }
        }
        setLoading(false);
      },
      (error) => {
        setIsConnected(false);
        console.error('Firestore Error:', error);
        alert(
          '데이터 로드 실패: Firestore 보안 규칙(Rules)을 확인해주세요.',
        );
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user, selectedProject?.id]);

  // --- XLSX loader ---
  useEffect(() => {
    if (window.XLSX) {
      setXlsxLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => setXlsxLoaded(true);
    document.body.appendChild(script);
  }, []);

  // --- Companies persistence ---
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'companiesList',
          JSON.stringify(companies),
        );
      }
    } catch (e) {
      console.warn('Failed to save companies to localStorage', e);
    }
  }, [companies]);

  // --- Derived values ---
  const projectYears = useMemo(() => {
    const years = new Set();
    projects.forEach((p) => {
      const year = getProjectYear(p);
      if (year) years.add(year);
    });
    return Array.from(years).sort();
  }, [projects]);

  const yearFilteredProjects = useMemo(() => {
    if (selectedYear === 'all') return projects;
    return projects.filter((p) => getProjectYear(p) === selectedYear);
  }, [projects, selectedYear]);

  const filteredAndSortedProjects = useMemo(() => {
    let data = [...yearFilteredProjects];

    if (selectedCompany !== 'all') {
      data = data.filter((p) => p.ledgerName === selectedCompany);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.salesRep && p.salesRep.toLowerCase().includes(q)) ||
          (p.client && p.client.toLowerCase().includes(q)),
      );
    }

    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'amount') {
          aValue =
            a.revisions?.[a.revisions.length - 1]?.amount || 0;
          bValue =
            b.revisions?.[b.revisions.length - 1]?.amount || 0;
        } else if (sortConfig.key === 'contractAmount') {
          aValue = a.contractAmount || 0;
          bValue = b.contractAmount || 0;
        } else if (sortConfig.key === 'manager') {
          aValue = (a.salesRep || '') + (a.manager || '');
          bValue = (b.salesRep || '') + (b.manager || '');
        }

        if (aValue < bValue)
          return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [
    yearFilteredProjects,
    searchQuery,
    sortConfig,
    selectedCompany,
  ]);

  // --- Handlers ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenDetail = (project) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleMenuClick = (tab, company = 'all') => {
    setActiveTab(tab);
    if (tab === 'projects') {
      setSelectedCompany(company);
    }
  };

  const handleOpenCreateModal = () => {
    const defaultId = `PJ-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, '0')}`;
    setProjectForm({
      projectIdDisplay: defaultId,
      name: '',
      client: '',
      manager: '',
      salesRep: '',
      contractMethod: '수의계약',
      ledgerName:
        selectedCompany !== 'all'
          ? selectedCompany
          : companies[0] || '골드텍',
      contractAmount: 0,
    });
    setIsEditMode(false);
    setIsNewProjectModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsNewProjectModalOpen(false);
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
      ledgerName:
        selectedProject.ledgerName || companies[0] || '골드텍',
      contractAmount: selectedProject.contractAmount || 0,
    });
    setIsEditMode(true);
    setIsNewProjectModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.name || !projectForm.client) {
      alert('필수 입력 항목이 비어있습니다.');
      return;
    }
    if (!user) return;

    try {
      if (isEditMode && selectedProject) {
        const projectRef = getProjectDoc(db, appId, selectedProject.id);
        await updateDoc(projectRef, {
          ...projectForm,
          contractAmount: parseInt(
            projectForm.contractAmount || 0,
            10,
          ),
          updatedAt: serverTimestamp(),
          lastModifier: user.uid,
        });
        alert('프로젝트 정보가 수정되었습니다.');
      } else {
        await addDoc(getProjectsCollection(db, appId), {
          ...projectForm,
          contractAmount: parseInt(
            projectForm.contractAmount || 0,
            10,
          ),
          status: '진행중',
          finalCost: 0,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          revisions: [
            {
              rev: 0,
              date: new Date().toISOString().split('T')[0],
              amount: 0,
              note: '최초 생성',
              file: '-',
            },
          ],
          progress: {
            contract: null,
            production: null,
            delivery: null,
            collection: null,
          },
        });
        alert('새 프로젝트가 등록되었습니다.');
      }
      setIsNewProjectModalOpen(false);
    } catch (e) {
      alert('저장 중 오류가 발생했습니다: ' + e.message);
    }
  };

  const handleBackup = async () => {
    const q = query(getProjectsCollection(db, appId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
  };

  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = JSON.parse(e.target.result);
      if (
        window.confirm(
          `${data.length}개 데이터 복원하시겠습니까?`,
        )
      ) {
        for (const item of data) {
          if (item.id) {
            await setDoc(
              getProjectDoc(db, appId, item.id),
              item,
            );
          }
        }
        alert('복원 완료');
      }
    };
    reader.readAsText(file);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedProject(null);
  };

  return {
    // raw data
    user,
    projects,
    loading,
    authError,
    isConnected,

    // navigation / companies
    activeTab,
    selectedCompany,
    selectedYear,
    projectYears,
    companies,

    // search/sort
    searchQuery,
    sortConfig,

    // ui selection
    selectedProject,
    isDetailOpen,
    isNewProjectModalOpen,
    isEditMode,
    projectForm,

    // derived lists
    yearFilteredProjects,
    filteredAndSortedProjects,

    // refs
    fileInputRef,

    // setters/actions
    setSelectedYear,
    setSearchQuery,
    setProjectForm,
    setSelectedProject,
    handleMenuClick,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleOpenEditModal,
    handleSaveProject,
    handleOpenDetail,
    handleCloseDetail,
    handleSort,
    handleBackup,
    handleRestoreClick,
    handleFileChange,
    handleUpdateCompanies: setCompanies,
  };
};
