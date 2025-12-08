import React from 'react';
import { DollarSign, Lightbulb, Plus, Sparkles } from 'lucide-react';
import { formatCurrency, calculateMargin } from '../../utils/format';

const ProjectSidebar = ({
    project,
    finalCostInput,
    contractAmountInput,
    isCostConfirmed,
    setFinalCostInput,
    setContractAmountInput,
    setIsCostConfirmed,
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
                        최종 견적금액 (VAT포함)
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
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        id="confirmCost"
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                        checked={isCostConfirmed}
                        onChange={(e) => setIsCostConfirmed(e.target.checked)}
                    />
                    <label htmlFor="confirmCost" className="text-xs text-emerald-800 font-bold select-none cursor-pointer">
                        금액 확정
                    </label>
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
                {['설계', '계약', '제작', '납품', '완료', '보류'].map((s) => (
                    <button
                        key={s}
                        onClick={() => onStatusChange(s)}
                        className={`text-xs py-2 rounded border font-medium ${status === s
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

export default ProjectSidebar;
