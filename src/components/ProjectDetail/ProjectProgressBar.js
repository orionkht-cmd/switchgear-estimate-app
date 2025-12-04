import React from 'react';
import { FileSignature, Hammer, Truck, Coins } from 'lucide-react';

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
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isDone
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                    >
                        <step.icon className="w-5 h-5 mb-1" />
                        <span className="font-bold text-sm">{step.label}</span>
                        <span className="text-[10px] opacity-80 mt-1">
                            {(project.progress || {})[step.key] || '-'}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

export default ProjectProgressBar;
