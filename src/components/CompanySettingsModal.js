import React, { useEffect, useState } from 'react';

const CompanySettingsModal = ({
  isOpen,
  companies,
  projects = [],
  companyAliases = {},
  onSave,
  onClose,
}) => {
  const [localCompanies, setLocalCompanies] = useState(companies);
  const [localAliases, setLocalAliases] = useState(companyAliases);

  useEffect(() => {
    setLocalCompanies(companies);
    setLocalAliases(companyAliases);
  }, [companies, companyAliases, isOpen]);

  if (!isOpen) return null;

  const projectCountsByLedger = projects.reduce((acc, project) => {
    const ledgerName = project.ledgerName || '';
    if (!ledgerName) return acc;
    acc[ledgerName] = (acc[ledgerName] || 0) + 1;
    return acc;
  }, {});

  const cleanedCompanies = localCompanies
    .map((c) => (c || '').trim())
    .filter((c) => c.length > 0);
  const companySet = new Set(cleanedCompanies);
  const unmatchedLedgerNames = Object.keys(projectCountsByLedger).filter(
    (name) => !companySet.has(name),
  );

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

  const handleAliasChange = (ledgerName, targetName) => {
    setLocalAliases((prev) => {
      const next = { ...prev };
      if (targetName) {
        next[ledgerName] = targetName;
      } else {
        delete next[ledgerName];
      }
      return next;
    });
  };

  const handleSave = () => {
    const cleaned = cleanedCompanies;
    if (cleaned.length === 0) {
      alert('최소 1개 이상의 회사명이 필요합니다.');
      return;
    }

    const validTargets = new Set(cleaned);
    const nextAliases = {};

    Object.entries(localAliases).forEach(([ledgerName, targetName]) => {
      if (
        ledgerName &&
        targetName &&
        ledgerName !== targetName &&
        validTargets.has(targetName)
      ) {
        nextAliases[ledgerName] = targetName;
      }
    });

    companies.forEach((oldName, index) => {
      const previousName = (oldName || '').trim();
      const nextName = (cleaned[index] || '').trim();
      if (
        previousName &&
        nextName &&
        previousName !== nextName &&
        projectCountsByLedger[previousName] &&
        validTargets.has(nextName)
      ) {
        nextAliases[previousName] = nextName;
      }
    });

    onSave(cleaned, nextAliases);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-5 shadow-xl">
        <h3 className="text-lg font-bold mb-3">회사 목록 설정</h3>
        <p className="text-xs text-slate-500 mb-3">
          사이드바와 프로젝트 등록창에서 사용할 회사 이름을 수정할 수 있습니다.
        </p>
        <div className="space-y-2 max-h-[38vh] overflow-auto">
          {localCompanies.map((name, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className="flex-1 border rounded px-2 py-1 text-sm"
                value={name}
                onChange={(e) => handleChange(index, e.target.value)}
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

        <div className="mt-5 border-t border-slate-200 pt-4">
          <h4 className="text-sm font-bold text-slate-700 mb-2">
            기존 장부명 매칭
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            회사 이름을 바꾼 뒤 기존 자료가 안 보이면, 기존 장부명을 새 이름에 연결하세요.
          </p>
          {unmatchedLedgerNames.length === 0 ? (
            <p className="text-xs text-slate-400">
              현재 추가로 연결할 기존 장부명이 없습니다.
            </p>
          ) : (
            <div className="space-y-2 max-h-[24vh] overflow-auto">
              {unmatchedLedgerNames.map((ledgerName) => (
                <div
                  key={ledgerName}
                  className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-700 truncate">
                      {ledgerName}
                    </div>
                    <div className="text-slate-400">
                      {projectCountsByLedger[ledgerName]}건
                    </div>
                  </div>
                  <span className="text-slate-300">→</span>
                  <select
                    className="border rounded px-2 py-1 bg-white"
                    value={localAliases[ledgerName] || ''}
                    onChange={(e) =>
                      handleAliasChange(ledgerName, e.target.value)
                    }
                  >
                    <option value="">연결 안 함</option>
                    {cleanedCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
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
