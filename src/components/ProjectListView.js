import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency, calculateMargin } from '../utils/format';

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
          <thead className="bg-slate-50 border-b sticky top-0 z-20 shadow-sm text-sm uppercase tracking-wider text-slate-500">
            <tr>
              <th
                className="px-4 py-3 text-center sticky left-0 z-30 bg-slate-50 border-r border-slate-200 w-[80px]"
                onClick={() => onSort('status')}
              >
                상태
                <SortIcon columnKey="status" sortConfig={sortConfig} />
              </th>
              <th
                className="px-4 py-3 text-right sticky left-[80px] z-30 bg-slate-50 border-r border-slate-200 w-[120px] cursor-pointer hover:bg-slate-100"
                onClick={() => onSort('contractAmount')}
              >
                금액
                <SortIcon columnKey="contractAmount" sortConfig={sortConfig} />
              </th>
              <th className="px-4 py-3 text-center sticky left-[200px] z-30 bg-slate-50 border-r border-slate-200 w-[80px]">
                마진
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 min-w-[200px]"
                onClick={() => onSort('name')}
              >
                프로젝트명
                <SortIcon columnKey="name" sortConfig={sortConfig} />
              </th>
              <th className="px-4 py-3 w-[100px]">소속대장</th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 w-[140px]"
                onClick={() => onSort('manager')}
              >
                담당자
                <SortIcon columnKey="manager" sortConfig={sortConfig} />
              </th>
              <th className="px-4 py-3 text-center w-[80px]">관리</th>
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
                'design',
                'contract',
                'production',
                'delivery',
                'collection',
              ].filter((k) => !!progress[k]).length;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 transition-colors text-sm"
                >
                  <td className="px-4 py-3 text-center sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 sticky left-[80px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                    {formatCurrency(displayAmount)}
                    {p.contractAmount > 0 && p.isCostConfirmed && (
                      <span className="text-xs text-green-600 block">
                        확정
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center sticky left-[200px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                    {p.contractAmount > 0 && p.finalCost > 0 ? (
                      <span
                        className={`font-bold ${calculateMargin(p.contractAmount, p.finalCost) < 10
                          ? 'text-red-500'
                          : 'text-slate-600'
                          }`}
                      >
                        {calculateMargin(p.contractAmount, p.finalCost)}%
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800 truncate max-w-[300px]" title={p.name}>
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[300px]" title={p.client}>
                      {p.client}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 truncate">
                    {p.ledgerName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 truncate">
                    <span className="font-medium">{p.salesRep}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span>{p.manager}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onOpenDetail(p)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      상세
                    </button>
                    <span className="text-xs text-slate-400 block">
                      {doneCount}/5
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

