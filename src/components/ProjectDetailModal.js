import React from 'react';
import { useProjectDetail } from '../hooks/useProjectDetail';
import ProjectHeader from './ProjectDetail/ProjectHeader';
import ProjectProgressBar from './ProjectDetail/ProjectProgressBar';
import ProjectHistory from './ProjectDetail/ProjectHistory';
import ProjectSidebar from './ProjectDetail/ProjectSidebar';
import PrintTemplate from './ProjectDetail/PrintTemplate';
import MemoModal from './ProjectDetail/MemoModal';

const ProjectDetailModal = ({
  isOpen,
  project,
  user,
  onClose,
  onOpenEdit,
  onDeleted,
}) => {
  const detail = useProjectDetail({
    project,
    user,
    isOpen,
    onClose,
    onDeleted,
  });

  const {
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
    setNewRevNote,
    setNewRevAmount,
    setFinalCostInput,
    setContractAmountInput,
    setMemo,
    setActiveMemoIndex,
    setIsMemoOpen,
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
    setAnalysisResult,
  } = detail;

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleUpdateCostAndContract();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleUpdateCostAndContract]);

  if (!isOpen || !project) return null;

  return (
    <>
      <PrintTemplate project={project} />

      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl animate-scale-in">
          <ProjectHeader
            project={project}
            onOpenEdit={onOpenEdit}
            onDelete={handleDeleteProject}
            onPrint={handlePrint}
            onExport={handleExportExcel}
            onClose={onClose}
            onOpenMemo={() => setIsMemoOpen(true)}
          />

          <ProjectProgressBar
            project={project}
            onToggleStage={handleProgressToggle}
          />

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <ProjectHistory
              project={project}
              editingRevIndex={editingRevIndex}
              editRevData={editRevData}
              onEditRevision={handleEditRevision}
              onCancelEdit={handleCancelEdit}
              onSaveEditedRevision={handleSaveEditedRevision}
            />

            <ProjectSidebar
              project={project}
              finalCostInput={finalCostInput}
              contractAmountInput={contractAmountInput}
              setFinalCostInput={setFinalCostInput}
              setContractAmountInput={setContractAmountInput}
              onUpdateCost={handleUpdateCostAndContract}
              analysisResult={analysisResult}
              onAnalyze={handleAnalyzeProject}
              onResetAnalysis={() => setAnalysisResult('')}
              onStatusChange={handleStatusChange}
              status={project.status}
              newRevAmount={newRevAmount}
              setNewRevAmount={setNewRevAmount}
              newRevNote={newRevNote}
              setNewRevNote={setNewRevNote}
              onRefineNote={handleRefineNote}
              onAddRevision={handleAddRevision}
            />
          </div>

          <MemoModal
            isOpen={isMemoOpen}
            onClose={() => setIsMemoOpen(false)}
            memo={memo}
            setMemo={setMemo}
            memoList={memoList}
            activeMemoIndex={activeMemoIndex}
            setActiveMemoIndex={setActiveMemoIndex}
            onSave={handleSaveMemo}
            onDelete={handleDeleteMemo}
          />
        </div>
      </div>
    </>
  );
};

export default ProjectDetailModal;
