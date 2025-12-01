import React, { useEffect, useState } from 'react';

const CompanySettingsModal = ({
  isOpen,
  companies,
  onSave,
  onClose,
}) => {
  const [localCompanies, setLocalCompanies] = useState(companies);

  useEffect(() => {
    setLocalCompanies(companies);
  }, [companies, isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    const next = [...localCompanies];
    next[index] = value;
    setLocalCompanies(next);
  };

  const handleAdd = () => {
    setLocalCompanies([...localCompanies, '']);
  };

  const handleRemove = (index) => {
    const next = localCompanies.filter((_, i) => i !== index);
    setLocalCompanies(next);
  };

  const handleSave = () => {
    const cleaned = localCompanies
      .map((c) => (c || '').trim())
      .filter((c) => c.length > 0);
    if (cleaned.length === 0) {
      alert('최소 1개 이상의 회사명이 필요합니다.');
      return;
    }
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <h3 className="text-lg font-bold mb-3">회사 목록 설정</h3>
        <p className="text-xs text-slate-500 mb-3">
          사이드바와 프로젝트 폼에서 사용할 회사 이름을 수정할 수 있습니다.
        </p>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {localCompanies.map((name, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className="flex-1 border rounded px-2 py-1 text-sm"
                value={name}
                onChange={(e) =>
                  handleChange(index, e.target.value)
                }
                placeholder={`회사명 ${index + 1}`}
              />
              <button
                onClick={() => handleRemove(index)}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            onClick={handleAdd}
            className="w-full text-xs border border-dashed border-slate-300 rounded py-1 mt-1 text-slate-500 hover:bg-slate-50"
          >
            + 회사 추가
          </button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs text-slate-500"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsModal;

