import React from 'react';
import { History, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const ProjectHistory = ({
    project,
    editingRevIndex,
    editRevData,
    onEditRevision,
    onCancelEdit,
    onSaveEditedRevision,
    onDeleteRevision,
    onSaveAsNewRevision,
}) => (
    <div className="flex-1 overflow-auto p-6 border-r border-slate-100 bg-slate-50/30 print:bg-white print:border-none">
        <h3 className="font-bold mb-4 flex items-center gap-2">
            <History className="w-4 h-4" /> 견적 히스토리
        </h3>
        {project.updatedAt && (
            <div className="mb-4 text-xs text-slate-500 bg-slate-100 p-2 rounded flex justify-between">
                <span>
                    최근 업데이트:{' '}
                    {project.updatedAt?.toDate
                        ? project.updatedAt.toDate().toLocaleString()
                        : project.updatedAt}
                </span>
                {project.lastModifier && <span>By: {project.lastModifier}</span>}
            </div>
        )}
        <div className="space-y-4">
            {[...(project.revisions || [])].reverse().map((rev, idx) => {
                const isEditing = editingRevIndex === idx;
                const revNumber = (project.revisions || []).length - idx;
                return (
                    <div
                        key={idx}
                        className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative group"
                    >
                        {!isEditing ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100">
                                        Rev.{revNumber}
                                    </span>
                                    <span className="text-xs text-slate-400">{rev.date}</span>
                                </div>
                                <div className="flex justify-between items-end mb-3">
                                    <div className="font-bold text-lg text-slate-800">
                                        {formatCurrency(rev.amount)}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                    {rev.note}
                                </p>
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEditRevision(idx, rev)}
                                        className="text-xs text-slate-400 hover:text-slate-700"
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => onDeleteRevision(rev.id)}
                                        className="text-xs text-red-400 hover:text-red-600"
                                        title={`Rev.${revNumber} 삭제`}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
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
                                        onClick={onSaveAsNewRevision}
                                        className="text-xs bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"
                                        title="새 버전으로 저장"
                                    >
                                        <Plus className="w-3 h-3" /> 새 버전
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

export default ProjectHistory;
