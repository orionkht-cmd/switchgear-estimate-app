import { useState } from 'react';
import { deleteProjectById } from '../services/projectDetailService';
import { exportProjectToExcel } from '../services/excelService';
import { analyzeProject } from '../utils/analysis';

export const useProjectActions = (project, onClose, onDeleted) => {
    const [analysisResult, setAnalysisResult] = useState('');

    const handleDeleteProject = async () => {
        if (!project) return;
        if (
            !window.confirm(
                '정말로 이 프로젝트를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
            )
        )
            return;
        try {
            await deleteProjectById(project.id);
            if (onDeleted) onDeleted(project.id);
            onClose();
            alert('프로젝트가 삭제되었습니다.');
            window.location.reload();
        } catch (e) {
            alert('삭제 실패: ' + e.message);
        }
    };

    const handleAnalyzeProject = () => {
        if (!project) return;
        const result = analyzeProject(project);
        setAnalysisResult(result);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        exportProjectToExcel(project);
    };

    return {
        analysisResult,
        setAnalysisResult,
        handleDeleteProject,
        handleAnalyzeProject,
        handlePrint,
        handleExportExcel,
    };
};
