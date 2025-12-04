import React from 'react';

const ProjectFormModal = ({
  isOpen,
  isEditMode,
  projectForm,
  setProjectForm,
  companiesList,
  onSave,
  onClose,
}) => {
  // Keyboard Shortcuts
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSave, onClose]);

  const handleEnterNavigation = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const form = e.currentTarget;
      const elements = Array.from(form.querySelectorAll('input, select, button, textarea'));
      const index = elements.indexOf(e.target);
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">
          {isEditMode ? '프로젝트 정보 수정' : '신규 프로젝트 등록'}
        </h3>
        <div className="space-y-3" onKeyDown={handleEnterNavigation}>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              소속 대장 (회사 선택)
            </label>
            <select
              className="w-full border p-2 rounded bg-slate-50 font-bold"
              value={projectForm.ledgerName}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  ledgerName: e.target.value,
                })
              }
            >
              {companiesList.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              프로젝트 번호
            </label>
            <input
              className="w-full border p-2 rounded bg-slate-50"
              value={projectForm.projectIdDisplay}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  projectIdDisplay: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              프로젝트명
            </label>
            <input
              className="w-full border p-2 rounded"
              value={projectForm.name}
              onChange={(e) =>
                setProjectForm({ ...projectForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              발주처
            </label>
            <input
              className="w-full border p-2 rounded"
              value={projectForm.client}
              onChange={(e) =>
                setProjectForm({ ...projectForm, client: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                영업 담당
              </label>
              <input
                className="w-full border p-2 rounded"
                value={projectForm.salesRep}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    salesRep: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                설계/PM 담당
              </label>
              <input
                className="w-full border p-2 rounded"
                value={projectForm.manager}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    manager: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              견적금액 (VAT포함)
            </label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={projectForm.contractAmount}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  contractAmount: e.target.value,
                })
              }
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              계약 방법
            </label>
            <select
              className="w-full border p-2 rounded"
              value={projectForm.contractMethod}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  contractMethod: e.target.value,
                })
              }
            >
              <option value="수의계약">수의계약</option>
              <option value="지명경쟁">지명경쟁</option>
              <option value="일반경쟁">일반경쟁</option>
              <option value="마스(MAS)">마스(MAS)</option>
              <option value="3자단가">3자단가</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <button
            onClick={onSave}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {isEditMode ? '저장' : '등록'}
          </button>
          <button
            onClick={onClose}
            className="w-full text-slate-500 py-2"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;

