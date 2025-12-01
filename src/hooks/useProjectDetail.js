import { useState, useEffect } from 'react';
import { refineRevisionNote, analyzeProject } from '../utils/analysis';
import {
  deleteProjectById,
  updateProjectFields,
  exportProjectToExcel,
} from '../services/projectDetailService';

export const useProjectDetail = ({
  project,
  user,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [newRevNote, setNewRevNote] = useState('');
  const [newRevAmount, setNewRevAmount] = useState('');
  const [editingRevIndex, setEditingRevIndex] = useState(null);
  const [editRevData, setEditRevData] = useState({ amount: '', note: '' });
  const [finalCostInput, setFinalCostInput] = useState('');
  const [contractAmountInput, setContractAmountInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [memo, setMemo] = useState('');
  const [memoList, setMemoList] = useState([]);
  const [activeMemoIndex, setActiveMemoIndex] = useState(-1);
  const [isMemoOpen, setIsMemoOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !project) return;
    setFinalCostInput(project.finalCost || 0);
    setContractAmountInput(project.contractAmount || 0);
    setNewRevNote('');
    setNewRevAmount('');
    setEditingRevIndex(null);
    setEditRevData({ amount: '', note: '' });
    setAnalysisResult('');

    const initialMemos = Array.isArray(project.memos)
      ? project.memos
      : [];
    setMemoList(initialMemos);

    if (initialMemos.length > 0) {
      setActiveMemoIndex(0);
      setMemo(initialMemos[0].content || '');
    } else {
      setActiveMemoIndex(-1);
      setMemo(project.memo || '');
    }

    setIsMemoOpen(false);
  }, [isOpen, project?.id]);

  const handleDeleteProject = async () => {
    if (!project) return;
    if (
      !window.confirm(
        '정말로 이 프로젝트를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
      )
    )
      return;
    try {
      await deleteProjectById(project.id);
      if (onDeleted) onDeleted(project.id);
      onClose();
      alert('프로젝트가 삭제되었습니다.');
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  const handleAddRevision = async () => {
    if (!newRevAmount || !project) return;
    const newRev = {
      rev: project.revisions.length,
      date: new Date().toISOString().split('T')[0],
      amount: parseInt(newRevAmount, 10),
      note: newRevNote || '정기 수정',
      file: `EST_Rev${project.revisions.length}.xlsx`,
    };
    try {
      await updateProjectFields(project.id, {
        revisions: [...project.revisions, newRev],
        updatedAt: new Date().toISOString(),
        lastModifier: user?.uid || null,
      });
      setNewRevNote('');
      setNewRevAmount('');
      alert('견적 이력이 업데이트되었습니다.');
    } catch (e) {
      alert('업데이트 실패');
    }
  };

  const handleEditRevision = (index, rev) => {
    setEditingRevIndex(index);
    setEditRevData({ amount: rev.amount, note: rev.note });
  };

  const handleSaveEditedRevision = async (index) => {
    if (!project) return;
    const updatedRevisions = [...project.revisions];
    const realIndex = project.revisions.length - 1 - index;
    updatedRevisions[realIndex] = {
      ...updatedRevisions[realIndex],
      amount: parseInt(editRevData.amount, 10),
      note: editRevData.note,
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateProjectFields(project.id, {
        revisions: updatedRevisions,
        lastModifier: user?.uid || null,
      });
      setEditingRevIndex(null);
      alert('수정되었습니다.');
    } catch (e) {
      alert('수정 실패');
    }
  };

  const handleCancelEdit = () => {
    setEditingRevIndex(null);
    setEditRevData({ amount: '', note: '' });
  };

  const handleStatusChange = async (status) => {
    if (!project) return;
    try {
      await updateProjectFields(project.id, { status });
    } catch (e) {
      alert('상태 변경 실패');
    }
  };

  const handleUpdateCostAndContract = async () => {
    if (!project) return;
    try {
      await updateProjectFields(project.id, {
        finalCost: parseInt(finalCostInput || 0, 10),
        contractAmount: parseInt(contractAmountInput || 0, 10),
      });
      alert('금액 정보가 저장되었습니다.');
    } catch (e) {
      alert('저장 실패');
    }
  };

  const handleProgressToggle = async (stage) => {
    if (!project) return;
    const currentProgress = project.progress || {};
    const isCompleted = !!currentProgress[stage];
    const newProgress = {
      ...currentProgress,
      [stage]: isCompleted
        ? null
        : new Date().toISOString().split('T')[0],
    };
    try {
      await updateProjectFields(project.id, { progress: newProgress });
    } catch (e) {
      console.error('Progress update failed', e);
    }
  };

  const handleRefineNote = () => {
    if (!newRevNote) {
      alert('내용을 입력해주세요.');
      return;
    }
    const refined = refineRevisionNote(newRevNote);
    setNewRevNote(refined);
  };

  const handleAnalyzeProject = () => {
    if (!project) return;
    const result = analyzeProject(project);
    setAnalysisResult(result);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportProjectToExcel(project);
  };

  const handleSaveMemo = async () => {
    if (!project) return;
    try {
      const now = new Date().toISOString();
      let memos = Array.isArray(memoList) ? [...memoList] : [];

      if (activeMemoIndex >= 0 && memos[activeMemoIndex]) {
        memos[activeMemoIndex] = {
          ...memos[activeMemoIndex],
          content: memo,
          updatedAt: now,
        };
      } else {
        const index = memos.length;
        memos.push({
          id: `memo-${index + 1}`,
          title: `메모 ${index + 1}`,
          content: memo,
          createdAt: now,
          updatedAt: now,
        });
        setActiveMemoIndex(index);
      }

      await updateProjectFields(project.id, {
        memos,
        updatedAt: now,
        lastModifier: user?.uid || null,
      });

      setMemoList(memos);
      alert('메모가 저장되었습니다.');
    } catch (e) {
      alert('메모 저장 실패');
    }
  };

  const handleDeleteMemo = async (index) => {
    if (!project) return;
    if (!Array.isArray(memoList) || !memoList[index]) return;

    if (!window.confirm('선택한 메모를 삭제하시겠습니까?')) return;

    try {
      const newMemos = memoList.filter((_, i) => i !== index);
      await updateProjectFields(project.id, {
        memos: newMemos,
        updatedAt: new Date().toISOString(),
        lastModifier: user?.uid || null,
      });

      setMemoList(newMemos);

      if (newMemos.length === 0) {
        setActiveMemoIndex(-1);
        setMemo('');
      } else {
        const nextIndex = Math.min(index, newMemos.length - 1);
        setActiveMemoIndex(nextIndex);
        setMemo(newMemos[nextIndex].content || '');
      }

      alert('메모가 삭제되었습니다.');
    } catch (e) {
      alert('메모 삭제 실패');
    }
  };

  return {
    // state
    newRevNote,
    newRevAmount,
    editingRevIndex,
    editRevData,
    finalCostInput,
    contractAmountInput,
    analysisResult,
    memo,
    memoList,
    activeMemoIndex,
    isMemoOpen,

    // setters
    setNewRevNote,
    setNewRevAmount,
    setEditRevData,
    setFinalCostInput,
    setContractAmountInput,
    setMemo,
    setMemoList,
    setActiveMemoIndex,
    setIsMemoOpen,
    setAnalysisResult,

    // handlers
    handleDeleteProject,
    handleAddRevision,
    handleEditRevision,
    handleSaveEditedRevision,
    handleCancelEdit,
    handleStatusChange,
    handleUpdateCostAndContract,
    handleProgressToggle,
    handleRefineNote,
    handleAnalyzeProject,
    handlePrint,
    handleExportExcel,
    handleSaveMemo,
    handleDeleteMemo,
  };
};
