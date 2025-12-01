import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '../utils/format';

const SortIcon = ({ columnKey, sortConfig }) => {
  if (sortConfig.key !== columnKey) {
    return (
      <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1" />
    );
  }
  return sortConfig.direction === 'asc' ? (
    <ArrowUp className="w-3 h-3 text-blue-500 ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 text-blue-500 ml-1" />
  );
};

const ProjectListView = ({
  projects,
  sortConfig,
  onSort,
  onOpenDetail,
  onCreateProject,
  selectedCompany,
}) => {
  const hasProjects = projects.length > 0;

  if (!hasProjects) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in flex flex-col h-full">
        <div className="p-10 flex flex-col items-center justify-center text-center h-full">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            데이터가 없습니다
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            선택한 대장(
            {selectedCompany === 'all' ? '전체' : selectedCompany})에
            프로젝트가 없습니다.
          </p>
          <button
            onClick={onCreateProject}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            신규 등록
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
            <tr>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                onClick={() => onSort('status')}
              >
                상태{' '}
                <SortIcon
                  columnKey="status"
                  sortConfig={sortConfig}
                />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                onClick={() => onSort('name')}
              >
                프로젝트명{' '}
                <SortIcon
                  columnKey="name"
                  sortConfig={sortConfig}
                />
              </th>
              <th className="px-4 py-3">소속대장</th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                onClick={() => onSort('manager')}
              >
                담당자 (영업/설계){' '}
                <SortIcon
                  columnKey="manager"
                  sortConfig={sortConfig}
                />
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => onSort('contractAmount')}
              >
                계약금액(VAT포함){' '}
                <SortIcon
                  columnKey="contractAmount"
                  sortConfig={sortConfig}
                />
              </th>
              <th className="px-4 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.map((p) => {
              const lastRev =
                p.revisions?.[p.revisions.length - 1] || {
                  amount: 0,
                };
              const displayAmount =
                p.contractAmount > 0 ? p.contractAmount : lastRev.amount;
              const progress = p.progress || {};
              const doneCount = [
                'contract',
                'production',
                'delivery',
                'collection',
              ].filter((k) => !!progress[k]).length;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {p.client}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {p.ledgerName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="font-medium">{p.salesRep}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span>{p.manager}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(displayAmount)}
                    {p.contractAmount > 0 && (
                      <span className="text-[10px] text-green-600 block">
                        계약확정
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onOpenDetail(p)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      상세
                    </button>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {doneCount}/4 단계
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectListView;

