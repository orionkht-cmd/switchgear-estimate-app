import React, { useMemo } from 'react';
import { Globe, Building2 } from 'lucide-react';
import { calculateStatsFromList } from '../utils/stats';

const DashboardView = ({ projects, companiesList, onSelectCompany }) => {
  const totalStats = useMemo(
    () => calculateStatsFromList(projects),
    [projects]
  );

  return (
    <div className="animate-fade-in space-y-8">
      {/* 1. Global Total Stats */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" /> 전체 통합 현황 (Total)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
            <p className="text-slate-400 text-sm font-medium">진행중 견적</p>
            <p className="text-3xl font-bold mt-2">
              {totalStats.ongoing}
              <span className="text-sm font-normal ml-1 text-slate-400">
                건
              </span>
            </p>
          </div>
          <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
            <p className="text-slate-400 text-sm font-medium">수주 성공</p>
            <p className="text-3xl font-bold mt-2 text-green-400">
              {totalStats.won}
              <span className="text-sm font-normal ml-1 text-slate-400">
                건
              </span>
            </p>
          </div>
          <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
            <p className="text-slate-400 text-sm font-medium">수주 총액</p>
            <p className="text-3xl font-bold mt-2">
              {new Intl.NumberFormat('ko-KR', {
                notation: 'compact',
              }).format(totalStats.totalWonAmount)}
            </p>
          </div>
          <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
            <p className="text-slate-400 text-sm font-medium">평균 이익률</p>
            <p className="text-3xl font-bold mt-2 text-orange-400">
              {totalStats.avgMargin}
              <span className="text-xl ml-1">%</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Company Breakdown */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-600" /> 업체별 현황 (Breakdown)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {companiesList.map((company) => {
            const companyProjects = projects.filter(
              (p) => p.ledgerName === company
            );
            const stats = calculateStatsFromList(companyProjects);

            return (
              <div
                key={company}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-700 text-lg">
                    {company}
                  </h3>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                    {companyProjects.length} Projects
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">진행중</span>
                    <span className="font-bold text-blue-600">
                      {stats.ongoing}건
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">수주</span>
                    <span className="font-bold text-green-600">
                      {stats.won}건
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">수주액</span>
                      <span className="font-bold text-slate-800">
                        {new Intl.NumberFormat('ko-KR', {
                          notation: 'compact',
                        }).format(stats.totalWonAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">이익률</span>
                      <span
                        className={`font-bold ${
                          stats.avgMargin < 10
                            ? 'text-red-500'
                            : 'text-orange-500'
                        }`}
                      >
                        {stats.avgMargin}%
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCompany(company)}
                  className="w-full mt-4 bg-slate-50 text-slate-600 text-xs py-2 rounded hover:bg-slate-100 transition-colors"
                >
                  대장 바로가기
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

