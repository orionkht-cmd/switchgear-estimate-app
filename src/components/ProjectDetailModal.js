import React from 'react';
import {
  History,
  Briefcase,
  User,
  FileSignature,
  Hammer,
  Truck,
  Coins,
  DollarSign,
  Lightbulb,
  Plus,
  Sparkles,
  X,
  Printer,
  FileSpreadsheet,
  Trash2,
  Edit,
  FileText,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency, calculateMargin } from '../utils/format';
import ProjectMemoPad from './ProjectMemoPad';
import { useProjectDetail } from '../hooks/useProjectDetail';

const ProjectHeader = ({
  project,
  onOpenEdit,
  onDelete,
  onPrint,
  onExport,
  onClose,
  onOpenMemo,
}) => {
  return (
    <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 print:bg-white print:border-b-2 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded">
            {project.ledgerName}
          </span>
          <StatusBadge status={project.status} />
        </div>
        <h2 className="font-bold text-xl flex items-center gap-2 text-slate-900">
          {project.name}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {project.projectIdDisplay} • {project.client}
        </p>
        <div className="flex gap-4 mt-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 inline-block">
          <span className="flex items-center gap-1">
            <Briefcase className="w-4 h-4 text-slate-400" /> 영업:{' '}
            <strong>{project.salesRep}</strong>
          </span>
          <span className="w-px h-4 bg-slate-300"></span>
          <span className="flex items-center gap-1">
            <User className="w-4 h-4 text-slate-400" /> 설계/PM:{' '}
            <strong>{project.manager}</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 no-print">
        <button
          onClick={onOpenMemo}
          className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"
        >
          <FileText className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenEdit}
          className="p-2 hover:bg-blue-50 text-slate-600 rounded-lg"
        >
          <Edit className="w-5 h-5 text-blue-600" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-50 text-slate-600 rounded-lg"
        >
          <Trash2 className="w-5 h-5 text-red-600" />
        </button>
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <button
          onClick={onPrint}
          className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"
        >
          <Printer className="w-4 h-4" />
        </button>
        <button
          onClick={onExport}
          className="p-2 hover:bg-green-50 text-slate-600 rounded-lg"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full"
        >
          <X className="text-slate-400 hover:text-slate-600" />
        </button>
      </div>
    </div>
  );
};

const ProjectProgressBar = ({ project, onToggleStage }) => (
  <div className="p-4 bg-slate-50 border-b border-slate-200 no-print">
    <div className="grid grid-cols-4 gap-4">
      {[
        { key: 'contract', label: '계약', icon: FileSignature },
        { key: 'production', label: '제작', icon: Hammer },
        { key: 'delivery', label: '납품', icon: Truck },
        { key: 'collection', label: '수금', icon: Coins },
      ].map((step) => {
        const isDone = !!(project.progress || {})[step.key];
        return (
          <button
            key={step.key}
            onClick={() => onToggleStage(step.key)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
              isDone
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <step.icon className="w-5 h-5 mb-1" />
            <span className="font-bold text-sm">{step.label}</span>
            <span className="text-[10px] opacity-80">
              {(project.progress || {})[step.key] || '-'}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const ProjectHistory = ({
  project,
  editingRevIndex,
  editRevData,
  onEditRevision,
  onCancelEdit,
  onSaveEditedRevision,
}) => (
  <div className="flex-1 overflow-auto p-6 border-r border-slate-100 bg-slate-50/30 print:bg-white print:border-none">
    <h3 className="font-bold mb-4 flex items-center gap-2">
      <History className="w-4 h-4" /> 견적 히스토리
    </h3>
    <div className="space-y-4">
      {[...(project.revisions || [])].reverse().map((rev, idx) => {
        const isEditing = editingRevIndex === idx;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative group"
          >
            {!isEditing ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100">
                    Rev.{rev.rev}
                  </span>
                  <span className="text-xs text-slate-400">
                    {rev.date}
                  </span>
                </div>
                <div className="flex justify-between items-end mb-3">
                  <div className="font-bold text-lg text-slate-800">
                    {formatCurrency(rev.amount)}
                  </div>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {rev.note}
                </p>
                <button
                  onClick={() => onEditRevision(idx, rev)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 hover:text-slate-700"
                >
                  수정
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="w-32 p-1 text-sm border rounded"
                    value={editRevData.amount}
                    onChange={(e) =>
                      onEditRevision(idx, {
                        ...rev,
                        amount: e.target.value,
                      })
                    }
                    placeholder="금액"
                  />
                  <textarea
                    className="w-full p-1 text-sm border rounded h-16 resize-none"
                    value={editRevData.note}
                    onChange={(e) =>
                      onEditRevision(idx, {
                        ...rev,
                        note: e.target.value,
                      })
                    }
                    placeholder="사유"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onCancelEdit}
                    className="text-xs text-slate-500"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => onSaveEditedRevision(idx)}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    저장
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const ProjectSidebar = ({
  project,
  finalCostInput,
  contractAmountInput,
  setFinalCostInput,
  setContractAmountInput,
  onUpdateCost,
  analysisResult,
  onAnalyze,
  onResetAnalysis,
  onStatusChange,
  status,
  newRevAmount,
  setNewRevAmount,
  newRevNote,
  setNewRevNote,
  onRefineNote,
  onAddRevision,
}) => (
  <div className="w-80 p-6 bg-white overflow-auto no-print flex flex-col gap-6">
    <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
      <h4 className="font-bold text-sm text-emerald-900 mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4" /> 계약 및 원가 관리
      </h4>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold text-emerald-800 block mb-1">
            최종 계약금액 (VAT포함)
          </label>
          <input
            type="number"
            className="w-full border p-2 rounded text-sm bg-white"
            placeholder="0"
            value={contractAmountInput}
            onChange={(e) => setContractAmountInput(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-emerald-800 block mb-1">
            최종 실행원가 (VAT포함)
          </label>
          <input
            type="number"
            className="w-full border p-2 rounded text-sm bg-white"
            placeholder="0"
            value={finalCostInput}
            onChange={(e) => setFinalCostInput(e.target.value)}
          />
        </div>
        <button
          onClick={onUpdateCost}
          className="w-full bg-emerald-600 text-white py-2 rounded text-xs font-bold hover:bg-emerald-700"
        >
          금액 정보 저장
        </button>
      </div>
      {contractAmountInput > 0 && finalCostInput > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-200 text-right">
          <div className="text-xs text-emerald-700">예상 이익금</div>
          <div className="font-bold text-emerald-900">
            {formatCurrency(contractAmountInput - finalCostInput)}
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            이익률{' '}
            <span className="font-bold">
              {calculateMargin(contractAmountInput, finalCostInput)}%
            </span>
          </div>
        </div>
      )}
    </div>

    <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
      <h4 className="font-bold text-sm text-purple-900 mb-2 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" /> 프로젝트 분석
      </h4>
      {!analysisResult && (
        <button
          onClick={onAnalyze}
          className="w-full bg-purple-600 text-white py-2 rounded text-xs font-bold hover:bg-purple-700 shadow-sm flex items-center justify-center gap-2"
        >
          분석 실행하기
        </button>
      )}
      {analysisResult && (
        <div className="bg-white p-3 rounded-lg border border-purple-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed animate-fade-in">
          {analysisResult}
          <button
            onClick={onResetAnalysis}
            className="block w-full text-center text-[10px] text-slate-400 mt-2 hover:underline"
          >
            다시 분석
          </button>
        </div>
      )}
    </div>

    <div>
      <h4 className="font-bold text-xs text-slate-500 mb-2 uppercase">
        상태 변경
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {['진행중', '수주', '실주', '보류'].map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`text-xs py-2 rounded border font-medium ${
              status === s
                ? 'bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-50 text-slate-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>

    <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
      <h4 className="font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2">
        <Plus className="w-4 h-4" /> 새 견적 리비전
      </h4>
      <div className="space-y-3">
        <input
          type="number"
          className="w-full border p-2 rounded text-sm bg-white"
          value={newRevAmount}
          onChange={(e) => setNewRevAmount(e.target.value)}
          placeholder="견적금액 (VAT포함)"
        />
        <div className="relative">
          <textarea
            className="w-full border p-2 rounded text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={newRevNote}
            onChange={(e) => setNewRevNote(e.target.value)}
            placeholder="수정 사유..."
          />
          <button
            onClick={onRefineNote}
            className="absolute bottom-2 right-2 text-indigo-600 hover:text-indigo-800 bg-white/80 p-1 rounded-full"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onAddRevision}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
        >
          리비전 저장
        </button>
      </div>
    </div>
  </div>
);

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

  if (!isOpen || !project) return null;

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
    setEditRevData,
    setFinalCostInput,
    setContractAmountInput,
    setMemo,
    setMemoList,
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:block print:bg-white print:static">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] print:h-auto print:w-full print:max-w-none flex flex-col shadow-2xl print:shadow-none print-area animate-scale-in">
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

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row print:block print:overflow-visible">
          <ProjectHistory
            project={project}
            editingRevIndex={editingRevIndex}
            editRevData={editRevData}
            onEditRevision={(idx, updated) => {
              setEditingRevIndex(idx);
              setEditRevData({
                amount: updated.amount,
                note: updated.note,
              });
            }}
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

        {isMemoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 프로젝트 메모장
                </h3>
                <button
                  onClick={() => setIsMemoOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mb-3 flex flex-wrap gap-2 items-center">
                {memoList.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex items-center gap-1"
                  >
                    <button
                      onClick={() => {
                        setActiveMemoIndex(idx);
                        setMemo(m.content || '');
                      }}
                      className={`px-2 py-1 text-xs rounded border ${
                        activeMemoIndex === idx
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m.title || `메모 ${idx + 1}`}
                    </button>
                    <button
                      onClick={() => handleDeleteMemo(idx)}
                      className="text-[10px] text-slate-400 hover:text-red-500"
                      title="메모 삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setActiveMemoIndex(-1);
                    setMemo('');
                  }}
                  className="px-2 py-1 text-xs rounded border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"
                >
                  + 새 메모
                </button>
              </div>
              <ProjectMemoPad
                value={memo}
                onChange={setMemo}
                onSave={async () => {
                  await handleSaveMemo();
                  setIsMemoOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailModal;
