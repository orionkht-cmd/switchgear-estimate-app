import React from 'react';
import { FileText } from 'lucide-react';

const ProjectMemoPad = ({ value, onChange, onSave }) => {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4" /> 프로젝트 메모장
      </h4>
      <textarea
        className="w-full border rounded p-2 text-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="이 프로젝트와 관련된 메모를 자유롭게 기록하세요..."
      />
      <button
        onClick={onSave}
        className="mt-3 w-full bg-slate-800 text-white py-2 rounded text-xs font-bold hover:bg-slate-900"
      >
        메모 저장
      </button>
    </div>
  );
};

export default ProjectMemoPad;

