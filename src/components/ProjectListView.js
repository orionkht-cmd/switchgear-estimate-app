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
        <table className="min-w-[1680px] w-full text-sm text-left">
          <thead className="bg-slate-50 border-b sticky top-0 z-20 shadow-sm text-sm uppercase tracking-wide text-slate-500">
            <tr>
              <th
                className="px-3 py-3 text-center sticky left-0 z-30 bg-slate-50 border-r border-slate-200 w-[110px] cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                onClick={() => onSort('estimateDate')}
              >
                견적일
                <SortIcon columnKey="estimateDate" sortConfig={sortConfig} />
              </th>
              <th className="px-3 py-3 text-center sticky left-[110px] z-30 bg-slate-50 border-r border-slate-200 w-[110px] whitespace-nowrap">
                납품기한
              </th>
              <th className="px-3 py-3 text-center sticky left-[220px] z-30 bg-slate-50 border-r border-slate-200 w-[110px] whitespace-nowrap">
                준공기한
              </th>
              <th className="px-3 py-3 text-center sticky left-[330px] z-30 bg-slate-50 border-r border-slate-200 w-[190px] whitespace-nowrap">
                계약번호
              </th>
              <th className="px-3 py-3 text-center sticky left-[520px] z-30 bg-slate-50 border-r border-slate-200 w-[110px] whitespace-nowrap">
                품명
              </th>
              <th className="px-4 py-3 text-center sticky left-[630px] z-30 bg-slate-50 border-r border-slate-200 w-[150px] whitespace-nowrap">
                수요기관
              </th>
              <th className="px-4 py-3 text-center sticky left-[780px] z-30 bg-slate-50 border-r border-slate-200 w-[150px] whitespace-nowrap">
                발주부서
              </th>
              <th
                className="px-3 py-3 text-center sticky left-[930px] z-30 bg-slate-50 border-r border-slate-200 w-[84px] whitespace-nowrap"
                onClick={() => onSort('status')}
              >
                상태
                <SortIcon columnKey="status" sortConfig={sortConfig} />
              </th>
              <th
                className="px-5 py-3 text-right sticky left-[1014px] z-30 bg-slate-50 border-r border-slate-200 w-[170px] cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                onClick={() => onSort('contractAmount')}
              >
                금액
                <SortIcon columnKey="contractAmount" sortConfig={sortConfig} />
              </th>
              <th className="px-4 py-3 text-center sticky left-[1184px] z-30 bg-slate-50 border-r border-slate-200 w-[110px] whitespace-nowrap">
                계약방법
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 min-w-[180px] whitespace-nowrap"
                onClick={() => onSort('name')}
              >
                사업명
                <SortIcon columnKey="name" sortConfig={sortConfig} />
              </th>
              <th className="px-4 py-3 w-[110px] whitespace-nowrap">소속대장</th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 w-[150px] whitespace-nowrap"
                onClick={() => onSort('manager')}
              >
                영업자/담당자
                <SortIcon columnKey="manager" sortConfig={sortConfig} />
              </th>
              <th className="px-4 py-3 text-center w-[80px] whitespace-nowrap">관리</th>
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
                  <td className="px-3 py-3 text-center sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 whitespace-nowrap">
                    <span className="text-slate-600 text-sm whitespace-nowrap">
                      {p.estimateDate || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center sticky left-[110px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 whitespace-nowrap">
                    {p.deliveryDeadline || '-'}
                  </td>
                  <td className="px-3 py-3 text-center sticky left-[220px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 whitespace-nowrap">
                    {p.completionDeadline || '-'}
                  </td>
                  <td className="px-3 py-3 text-center sticky left-[330px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 text-slate-600 whitespace-nowrap">
                    {p.contractNumber || '-'}
                  </td>
                  <td className="px-3 py-3 text-center sticky left-[520px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 text-slate-600 whitespace-nowrap">
                    {p.productType || '-'}
                  </td>
                  <td className="px-4 py-3 text-center sticky left-[630px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                    <span className="text-slate-600 text-sm truncate max-w-[130px] block" title={p.client}>
                      {p.client || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center sticky left-[780px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                    <span className="text-slate-600 text-sm truncate max-w-[130px] block" title={p.orderingDepartment}>
                      {p.orderingDepartment || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center sticky left-[930px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 whitespace-nowrap">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900 sticky left-[1014px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 whitespace-nowrap">
                    {formatCurrency(displayAmount)}
                    {p.contractAmount > 0 && p.isCostConfirmed && (
                      <span className="text-xs text-green-600 block">
                        확정
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center sticky left-[1184px] z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 italic text-slate-500 whitespace-nowrap">
                    {p.contractMethod || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800 truncate max-w-[260px]" title={p.name}>
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[260px]" title={p.client}>
                      {p.client || '-'}
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
