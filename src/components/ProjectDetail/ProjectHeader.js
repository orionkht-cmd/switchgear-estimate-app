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
    Download,
    Eye,
} from 'lucide-react';
import StatusBadge from '../StatusBadge';
import { projectApi } from '../../services/apiClient';

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
    const openAttachmentBlob = async (file, { preview = false } = {}) => {
        try {
            const blob = await projectApi.getAttachmentBlob(project.id, file.id);
            const url = URL.createObjectURL(blob);

            if (preview) {
                const opened = window.open(url, '_blank', 'noopener,noreferrer');
                if (!opened) {
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.click();
                }
                window.setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
                return;
            }

            const link = document.createElement('a');
            link.href = url;
            link.download = file.name || 'attachment';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            alert('첨부파일을 불러오지 못했습니다.');
        }
    };

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
                            <div
                                key={file.id || file.name}
                                className="inline-flex max-w-[320px] items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1"
                                title={file.name}
                            >
                                <Paperclip className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate">{file.name}</span>
                                <span className="shrink-0 text-slate-400">
                                    {formatFileSize(file.size)}
                                </span>
                                {file.extension === 'pdf' && (
                                    <button
                                        type="button"
                                        onClick={() => openAttachmentBlob(file, { preview: true })}
                                        className="shrink-0 rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                        aria-label={`${file.name} 미리보기`}
                                        title="미리보기"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => openAttachmentBlob(file)}
                                    className="shrink-0 rounded p-1 text-slate-500 hover:bg-green-50 hover:text-green-600"
                                    aria-label={`${file.name} 다운로드`}
                                    title="다운로드"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </button>
                            </div>
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
