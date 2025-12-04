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
} from 'lucide-react';
import StatusBadge from '../StatusBadge';

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

export default ProjectHeader;
