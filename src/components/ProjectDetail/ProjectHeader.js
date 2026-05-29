import React from 'react';
import {
    Briefcase,
    User,
    X,
    Printer,
    FileSpreadsheet,
    Trash2,
    Edit,
    FileText,
    Paperclip,
} from 'lucide-react';
import StatusBadge from '../StatusBadge';

function formatFileSize(bytes = 0) {
    if (!bytes) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

const ProjectHeader = ({
    project,
    onOpenEdit,
    onDelete,
    onPrint,
    onExport,
    onClose,
    onOpenMemo,
}) => {
    const attachedFiles = Array.isArray(project.attachedFiles)
        ? project.attachedFiles
        : [];

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
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                    <span className="bg-white border border-slate-200 rounded px-2 py-1">
                        품명: <strong>{project.productType || '-'}</strong>
                    </span>
                    <span className="bg-white border border-slate-200 rounded px-2 py-1">
                        계약번호: <strong>{project.contractNumber || '-'}</strong>
                    </span>
                    <span className="bg-white border border-slate-200 rounded px-2 py-1">
                        계약일: <strong>{project.deliveryDeadline || '-'}</strong>
                    </span>
                    <span className="bg-white border border-slate-200 rounded px-2 py-1">
                        준공기한(납품기한): <strong>{project.completionDeadline || '-'}</strong>
                    </span>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 inline-block">
                    <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-slate-400" /> 영업자:{' '}
                        <strong>{project.salesRep}</strong>
                    </span>
                    <span className="w-px h-4 bg-slate-300"></span>
                    <span className="flex items-center gap-1">
                        <User className="w-4 h-4 text-slate-400" /> 담당자:{' '}
                        <strong>{project.manager}</strong>
                    </span>
                </div>
                {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                        {attachedFiles.map((file) => (
                            <span
                                key={file.id || file.name}
                                className="inline-flex max-w-[240px] items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1"
                                title={file.name}
                            >
                                <Paperclip className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate">{file.name}</span>
                                <span className="shrink-0 text-slate-400">
                                    {formatFileSize(file.size)}
                                </span>
                            </span>
                        ))}
                    </div>
                )}
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

export default ProjectHeader;
