import React from 'react';
import {
  RefreshCw,
  PieChart,
  FolderKanban,
  Globe,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Search,
  Plus,
  Edit3,
} from 'lucide-react';
import DashboardView from './components/DashboardView';
import ProjectListView from './components/ProjectListView';
import ProjectFormModal from './components/ProjectFormModal';
import ProjectDetailModal from './components/ProjectDetailModal';
import CompanySettingsModal from './components/CompanySettingsModal';
import { useAppShell } from './hooks/useAppShell';
import { useTailwindCdn } from './hooks/useTailwindCdn';

export default function App() {
  const {
    user,
    loading,
    isConnected,
    activeTab,
    selectedCompany,
    selectedYear,
    projectYears,
    companies,
    searchQuery,
    sortConfig,
    selectedProject,
    isDetailOpen,
    isNewProjectModalOpen,
    isEditMode,
    projectForm,
    yearFilteredProjects,
    filteredAndSortedProjects,
    fileInputRef,
    setSelectedYear,
    setSearchQuery,
    setProjectForm,
    setSelectedProject,
    handleMenuClick,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleOpenEditModal,
    handleSaveProject,
    handleOpenDetail,
    handleCloseDetail,
    handleSort,
    handleBackup,
    handleRestoreClick,
    handleFileChange,
    handleUpdateCompanies,
  } = useAppShell();

  const [isCompanyModalOpen, setIsCompanyModalOpen] = React.useState(false);

  useTailwindCdn();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-slate-500 animate-pulse">
          시스템 연결 중...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <style>
        {`@media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white;
            padding: 20px;
            z-index: 9999;
          }
          .no-print { display: none !important; }
        }`}
      </style>

      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col z-20 no-print flex-shrink-0">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="text-green-400" /> Team
              <span className="text-green-400">Sync</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              AI-Powered Quotation
            </p>
          </div>

          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            <div className="mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              보기 모드
            </div>
            <button
              onClick={() => handleMenuClick('dashboard', 'all')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-4 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" /> 통합 대시보드
            </button>

            <div className="mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>업체별 관리대장</span>
              <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white"
              >
                <Edit3 className="w-3 h-3" /> 편집
              </button>
            </div>
            {companies.map((company) => (
              <button
                key={company}
                onClick={() => handleMenuClick('projects', company)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  selectedCompany === company &&
                  activeTab === 'projects'
                    ? 'bg-slate-700 text-white border-l-4 border-green-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FolderKanban className="w-4 h-4" /> {company}
              </button>
            ))}
            <button
              onClick={() => handleMenuClick('projects', 'all')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mt-2 ${
                selectedCompany === 'all' && activeTab === 'projects'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" /> 전체 프로젝트 보기
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-xs ${
                  isConnected ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {isConnected ? '시스템 정상 연결' : '연결 끊김'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
              <button
                onClick={handleBackup}
                className="flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 py-2 rounded bg-slate-800 border border-slate-700"
              >
                <Download className="w-3 h-3" /> 백업
              </button>
              <button
                onClick={handleRestoreClick}
                className="flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 py-2 rounded bg-slate-800 border border-slate-700"
              >
                <Upload className="w-3 h-3" /> 복원
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 no-print">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="font-bold text-lg flex items-center gap-2 whitespace-nowrap">
                {activeTab === 'dashboard'
                  ? '통합 경영 대시보드'
                  : selectedCompany === 'all'
                  ? '전체 프로젝트'
                  : `${selectedCompany} 대장`}
              </h1>

              <div className="ml-auto flex items-center gap-3 hidden md:flex">
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(
                      e.target.value === 'all'
                        ? 'all'
                        : parseInt(e.target.value, 10),
                    )
                  }
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 text-slate-700"
                >
                  <option value="all">전체 연도</option>
                  {projectYears.map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>

                {activeTab === 'projects' && (
                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 whitespace-nowrap ml-4"
            >
              <Plus className="w-4 h-4" /> 프로젝트 등록
            </button>
          </header>

          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'dashboard' ? (
              <DashboardView
                projects={yearFilteredProjects}
                companiesList={companies}
                onSelectCompany={(company) =>
                  handleMenuClick('projects', company)
                }
              />
            ) : (
              <ProjectListView
                projects={filteredAndSortedProjects}
                sortConfig={sortConfig}
                onSort={handleSort}
                onOpenDetail={handleOpenDetail}
                onCreateProject={handleOpenCreateModal}
                selectedCompany={selectedCompany}
              />
            )}
          </div>
        </main>
      </div>

      <ProjectFormModal
        isOpen={isNewProjectModalOpen}
        isEditMode={isEditMode}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        companiesList={companies}
        onSave={handleSaveProject}
        onClose={handleCloseCreateModal}
      />

      <ProjectDetailModal
        isOpen={isDetailOpen}
        project={selectedProject}
        user={user}
        onClose={handleCloseDetail}
        onOpenEdit={handleOpenEditModal}
        onDeleted={() => setSelectedProject(null)}
      />

      <CompanySettingsModal
        isOpen={isCompanyModalOpen}
        companies={companies}
        onSave={handleUpdateCompanies}
        onClose={() => setIsCompanyModalOpen(false)}
      />
    </div>
  );
}
