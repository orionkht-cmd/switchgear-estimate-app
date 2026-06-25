import React from 'react';

const PRODUCT_TYPE_OPTIONS = [
  '수배전반',
  'MCC',
  '분전반',
  '공사',
  '자동제어',
  '용역',
  '기타',
];
const CUSTOM_PRODUCT_TYPE_VALUE = '__custom_product_type__';

function digitsOnly(v) {
  return (v || '').replace(/[^0-9]/g, '');
}

function isISODate10(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isValidYMD(y, m, d) {
  const yy = Number(y);
  const mm = Number(m);
  const dd = Number(d);
  if (!Number.isInteger(yy) || !Number.isInteger(mm) || !Number.isInteger(dd)) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;

  // UTC 기준으로 검증 (로컬 타임존 영향 최소화)
  const dt = new Date(Date.UTC(yy, mm - 1, dd));
  return (
    dt.getUTCFullYear() === yy &&
    dt.getUTCMonth() === mm - 1 &&
    dt.getUTCDate() === dd
  );
}

function formatDigitsToISO(digits) {
  // digits: 'YYYYMMDD' or 'YYMMDD'
  if (digits.length === 8) {
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);
    if (!isValidYMD(y, m, d)) return { ok: false, value: `${y}-${m}-${d}` };
    return { ok: true, value: `${y}-${m}-${d}` };
  }
  if (digits.length === 6) {
    const y = '20' + digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const d = digits.slice(4, 6);
    if (!isValidYMD(y, m, d)) return { ok: false, value: `${y}-${m}-${d}` };
    return { ok: true, value: `${y}-${m}-${d}` };
  }
  return { ok: false, value: digits };
}

function pad2(v) {
  return String(v).padStart(2, '0');
}

function getTodayLocalISODate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = pad2(today.getMonth() + 1);
  const date = pad2(today.getDate());
  return `${year}-${month}-${date}`;
}

function isTodayDateShortcut(e) {
  if (!(e.ctrlKey || e.metaKey)) return false;
  return !e.shiftKey && (e.key === ';' || e.code === 'Semicolon');
}

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

function buildAttachmentRecord(file) {
  return {
    id: `pending-${Date.now()}-${file.name}`,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    extension: file.name.includes('.')
      ? file.name.split('.').pop().toLowerCase()
      : '',
    addedAt: new Date().toISOString(),
    isPending: true,
  };
}

const ProjectFormModal = ({
  isOpen,
  isEditMode,
  projectForm,
  setProjectForm,
  companiesList,
  onSave,
  onClose,
}) => {
  const [lockedDate, setLockedDate] = React.useState('');
  const [dateError, setDateError] = React.useState('');
  const [isCustomProductType, setIsCustomProductType] = React.useState(false);
  const attachedFiles = Array.isArray(projectForm.attachedFiles)
    ? projectForm.attachedFiles
    : [];
  const pendingAttachmentFiles = Array.isArray(projectForm.pendingAttachmentFiles)
    ? projectForm.pendingAttachmentFiles
    : [];
  const pendingAttachmentRecords = pendingAttachmentFiles.map(({ file, record }) => record);
  const displayedAttachedFiles = [...attachedFiles, ...pendingAttachmentRecords];

  // 모달 열릴 때 "원본 날짜" 고정 (잠금 판정에 사용)
  React.useEffect(() => {
    if (isOpen) {
      setLockedDate(projectForm.estimateDate || '');
      setDateError('');
      setIsCustomProductType(Boolean(
        projectForm.productType && !PRODUCT_TYPE_OPTIONS.includes(projectForm.productType),
      ));
    } else {
      setLockedDate('');
      setDateError('');
      setIsCustomProductType(false);
    }
  }, [isOpen, projectForm.estimateDate]); // estimateDate가 바뀔 때가 아니라 모달이 '열릴 때'의 값을 잡아야 함

  const isDateLocked = isEditMode && isISODate10(lockedDate);

  // Keyboard Shortcuts
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSave, onClose]);

  // (옵션) 모달 열릴 때 body 스크롤 잠금
  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleEnterNavigation = (e) => {
    if (e.key !== 'Enter') return;

    const tag = e.target.tagName;
    // select에서 Enter는 UX가 애매해서 제외(원하면 제거 가능)
    if (tag === 'BUTTON' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    e.preventDefault();

    const root = e.currentTarget;
    const elements = Array.from(
      root.querySelectorAll('input, select, button, textarea')
    ).filter((el) => !el.disabled && el.tabIndex !== -1);

    const index = elements.indexOf(e.target);
    if (index > -1 && index < elements.length - 1) {
      elements[index + 1].focus();
    }
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const nextFiles = files.map((file) => ({
      file,
      record: buildAttachmentRecord(file),
    }));
    setProjectForm((prev) => ({
      ...prev,
      pendingAttachmentFiles: [
        ...(Array.isArray(prev.pendingAttachmentFiles) ? prev.pendingAttachmentFiles : []),
        ...nextFiles,
      ],
    }));
    e.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId) => {
    setProjectForm((prev) => ({
      ...prev,
      attachedFiles: (Array.isArray(prev.attachedFiles) ? prev.attachedFiles : []).filter(
        (file) => file.id !== attachmentId,
      ),
      deletedAttachmentIds: [
        ...(Array.isArray(prev.deletedAttachmentIds) ? prev.deletedAttachmentIds : []),
        ...((Array.isArray(prev.attachedFiles) ? prev.attachedFiles : []).some(
          (file) => file.id === attachmentId,
        )
          ? [attachmentId]
          : []),
      ],
      pendingAttachmentFiles: (Array.isArray(prev.pendingAttachmentFiles)
        ? prev.pendingAttachmentFiles
        : []
      ).filter(({ record }) => record.id !== attachmentId),
    }));
  };

  if (!isOpen) return null;

  const isUsingCustomProductType = isCustomProductType || Boolean(
    projectForm.productType && !PRODUCT_TYPE_OPTIONS.includes(projectForm.productType),
  );
  const selectedProductType = isUsingCustomProductType
    ? CUSTOM_PRODUCT_TYPE_VALUE
    : projectForm.productType || '수배전반';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        // (옵션) 바깥 클릭 닫기
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        <h3 id="project-modal-title" className="text-lg font-bold mb-4">
          {isEditMode ? '프로젝트 정보 수정' : '신규 프로젝트 등록'}
        </h3>

        <div className="space-y-3" onKeyDown={handleEnterNavigation}>
          <div>
            <label htmlFor="project-ledger-name" className="text-xs text-slate-500 block mb-1">
              소속 대장 (회사 선택)
            </label>
            <select
              id="project-ledger-name"
              className="w-full border p-2 rounded bg-slate-50 font-bold"
              value={projectForm.ledgerName}
              onChange={(e) =>
                setProjectForm((prev) => ({
                  ...prev,
                  ledgerName: e.target.value,
                }))
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
            <label htmlFor="project-id-display" className="text-xs text-slate-500 block mb-1">
              프로젝트 번호
            </label>
            <input
              id="project-id-display"
              className="w-full border p-2 rounded bg-slate-50"
              value={projectForm.projectIdDisplay}
              onChange={(e) =>
                setProjectForm((prev) => ({
                  ...prev,
                  projectIdDisplay: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label htmlFor="project-estimate-date" className="text-xs text-slate-500 block mb-1">
              견적일 (숫자 6자리 혹은 8자리 입력 가능, Ctrl + ;로 오늘 날짜 입력){' '}
              {isDateLocked && (
                <span className="text-orange-600 font-bold">(변경불가)</span>
              )}
            </label>

            <input
              id="project-estimate-date"
              type="text"
              className={`w-full border p-2 rounded bg-slate-50 ${dateError ? 'border-red-400' : ''
                }`}
              value={projectForm.estimateDate}
              placeholder="예: 250101 또는 20250101"
              onKeyDown={(e) => {
                if (!isTodayDateShortcut(e)) return;
                e.preventDefault();
                setDateError('');
                setProjectForm((prev) => ({
                  ...prev,
                  estimateDate: getTodayLocalISODate(),
                }));
              }}
              onChange={(e) => {
                let val = digitsOnly(e.target.value);
                if (val.length > 8) val = val.slice(0, 8);

                // 8자리 완성 시 즉시 ISO 포맷
                if (val.length === 8) {
                  const { ok, value } = formatDigitsToISO(val);
                  setDateError(ok ? '' : '유효하지 않은 날짜예요.');
                  setProjectForm((prev) => ({ ...prev, estimateDate: value }));
                  return;
                }

                // 입력 중에는 숫자만 유지(6자리도 여기서는 포맷하지 않음)
                setDateError('');
                setProjectForm((prev) => ({ ...prev, estimateDate: val }));
              }}
              onBlur={(e) => {
                // blur 시 6자리면 ISO 포맷 변환
                const val = digitsOnly(e.target.value);
                if (val.length === 6) {
                  const { ok, value } = formatDigitsToISO(val);
                  setDateError(ok ? '' : '유효하지 않은 날짜예요.');
                  setProjectForm((prev) => ({ ...prev, estimateDate: value }));
                } else if (val.length === 8) {
                  // 혹시 숫자 8자리만 남아있을 때도 안전 처리
                  const { ok, value } = formatDigitsToISO(val);
                  setDateError(ok ? '' : '유효하지 않은 날짜예요.');
                  setProjectForm((prev) => ({ ...prev, estimateDate: value }));
                }
              }}
              disabled={isDateLocked}
            />

            {dateError && (
              <p className="text-xs text-red-500 mt-1">{dateError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="project-delivery-deadline" className="text-xs text-slate-500 block mb-1">
                계약일
              </label>
              <input
                id="project-delivery-deadline"
                type="date"
                className="w-full border p-2 rounded"
                value={projectForm.deliveryDeadline || ''}
                onChange={(e) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    deliveryDeadline: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor="project-completion-deadline" className="text-xs text-slate-500 block mb-1">
                준공기한(납품기한)
              </label>
              <input
                id="project-completion-deadline"
                type="date"
                className="w-full border p-2 rounded"
                value={projectForm.completionDeadline || ''}
                onChange={(e) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    completionDeadline: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="project-contract-number" className="text-xs text-slate-500 block mb-1">
                계약번호
              </label>
              <input
                id="project-contract-number"
                className="w-full border p-2 rounded"
                value={projectForm.contractNumber || ''}
                onChange={(e) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    contractNumber: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor="project-product-type" className="text-xs text-slate-500 block mb-1">품명</label>
              <select
                id="project-product-type"
                className="w-full border p-2 rounded"
                value={selectedProductType}
                onChange={(e) => {
                  const nextProductType = e.target.value;
                  if (nextProductType === CUSTOM_PRODUCT_TYPE_VALUE) {
                    setIsCustomProductType(true);
                    setProjectForm((prev) => ({
                      ...prev,
                      productType: '',
                    }));
                    return;
                  }
                  setIsCustomProductType(false);
                  setProjectForm((prev) => ({
                    ...prev,
                    productType: nextProductType,
                  }));
                }}
              >
                {PRODUCT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value={CUSTOM_PRODUCT_TYPE_VALUE}>직접 입력</option>
              </select>
              {isUsingCustomProductType && (
                <input
                  id="project-product-type-custom"
                  className="w-full border p-2 rounded mt-2"
                  value={projectForm.productType || ''}
                  placeholder="품명 직접 입력"
                  onChange={(e) =>
                    setProjectForm((prev) => ({
                      ...prev,
                      productType: e.target.value,
                    }))
                  }
                />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="project-ordering-department" className="text-xs text-slate-500 block mb-1">발주부서</label>
            <input
              id="project-ordering-department"
              className="w-full border p-2 rounded"
              value={projectForm.orderingDepartment}
              onChange={(e) =>
                setProjectForm((prev) => ({
                  ...prev,
                  orderingDepartment: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label htmlFor="project-name" className="text-xs text-slate-500 block mb-1">사업명</label>
            <input
              id="project-name"
              className="w-full border p-2 rounded"
              value={projectForm.name}
              onChange={(e) =>
                setProjectForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div>
            <label htmlFor="project-client" className="text-xs text-slate-500 block mb-1">수요기관</label>
            <input
              id="project-client"
              className="w-full border p-2 rounded"
              value={projectForm.client}
              onChange={(e) =>
                setProjectForm((prev) => ({ ...prev, client: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="project-sales-rep" className="text-xs text-slate-500 block mb-1">영업자</label>
              <input
                id="project-sales-rep"
                className="w-full border p-2 rounded"
                value={projectForm.salesRep}
                onChange={(e) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    salesRep: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor="project-manager" className="text-xs text-slate-500 block mb-1">담당자</label>
              <input
                id="project-manager"
                className="w-full border p-2 rounded"
                value={projectForm.manager}
                onChange={(e) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    manager: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label htmlFor="project-contract-amount" className="text-xs text-slate-500 block mb-1">
              견적금액 (VAT포함)
            </label>
            <input
              id="project-contract-amount"
              type="number"
              className="w-full border p-2 rounded"
              value={projectForm.contractAmount}
              onChange={(e) =>
                setProjectForm((prev) => ({
                  ...prev,
                  contractAmount: e.target.value,
                }))
              }
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="project-contract-method" className="text-xs text-slate-500 block mb-1">계약 방법</label>
            <select
              id="project-contract-method"
              className="w-full border p-2 rounded"
              value={projectForm.contractMethod}
              onChange={(e) =>
                setProjectForm((prev) => ({
                  ...prev,
                  contractMethod: e.target.value,
                }))
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

          <div>
            <label htmlFor="project-attachments" className="text-xs text-slate-500 block mb-1">
              PDF / 압축파일
            </label>
            <input
              id="project-attachments"
              type="file"
              multiple
              accept=".pdf,.zip,.7z,.rar,application/pdf,application/zip,application/x-zip-compressed,application/x-7z-compressed,application/vnd.rar"
              className="w-full border p-2 rounded bg-slate-50 text-sm"
              onChange={handleAttachmentChange}
            />
            {displayedAttachedFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {displayedAttachedFiles.map((file) => (
                  <div
                    key={file.id || file.name}
                    className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-700">
                        {file.name}
                      </div>
                      <div className="text-slate-400">
                        {formatFileSize(file.size)}
                        {file.isPending ? ' · 저장 시 업로드' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(file.id)}
                      className="shrink-0 rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onSave}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {isEditMode ? '저장' : '등록'}
          </button>
          <button onClick={onClose} className="w-full text-slate-500 py-2">
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
