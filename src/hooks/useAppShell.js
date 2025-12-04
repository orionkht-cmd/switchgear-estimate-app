import { useState, useEffect } from 'react';
import {
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, appId } from '../firebase';
import { getProjectsCollection, getProjectDoc } from '../services/projects';
import { useAuth } from './useAuth';
import { useCompanySettings } from './useCompanySettings';
import { useBackup } from './useBackup';
import { useProjects } from './useProjects';

export const useAppShell = () => {
  // --- Hooks ---
  const { user, loading, setLoading, authError } = useAuth();
  const { companies, setCompanies } = useCompanySettings();
  const {
    fileInputRef,
    xlsxLoaded,
    handleBackup,
    handleRestoreClick,
    handleFileChange,
  } = useBackup();
  const {
    projects,
    isConnected,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,
    selectedYear,
    setSelectedYear,
    selectedStatus,
    setSelectedStatus,
    selectedCompany,
    setSelectedCompany,
    projectYears,
    yearFilteredProjects,
    filteredAndSortedProjects,
  } = useProjects(user, setLoading);

  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- UI State ---
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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

  // --- Effects ---
  // Sync selectedProject when projects update
  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find((p) => p.id === selectedProject.id);
      if (updated) {
        setSelectedProject(updated);
      }
    }
  }, [projects, selectedProject?.id]);

  // --- Handlers ---
  const handleOpenDetail = (project) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedProject(null);
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

  return {
    // raw data
    user,
    projects,
    loading,
    authError,
    isConnected,
    xlsxLoaded,

    // navigation / companies
    activeTab,
    selectedCompany,
    selectedYear,
    selectedStatus,
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
    setSelectedStatus,
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
