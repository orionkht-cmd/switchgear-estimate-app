import React from 'react';
import { X, FileText } from 'lucide-react';
import ProjectMemoPad from '../ProjectMemoPad';

const MemoModal = ({
    isOpen,
    onClose,
    memo,
    setMemo,
    memoList,
    activeMemoIndex,
    setActiveMemoIndex,
    onSave,
    onDelete,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> 프로젝트 메모장
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="mb-3 flex flex-wrap gap-2 items-center">
                    {memoList.map((m, idx) => (
                        <div key={m.id || idx} className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    setActiveMemoIndex(idx);
                                    setMemo(m.content || '');
                                }}
                                className={`px-2 py-1 text-xs rounded border ${activeMemoIndex === idx
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {m.title || `메모 ${idx + 1}`}
                            </button>
                            <button
                                onClick={() => onDelete(idx)}
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
                        await onSave();
                        onClose();
                    }}
                />
            </div>
        </div>
    );
};

export default MemoModal;
