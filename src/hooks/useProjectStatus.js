import { projectApi } from '../services/apiClient';

export const useProjectStatus = (project, onUpdate) => {
    const handleStatusChange = async (status) => {
        if (!project) return;

        try {
            // 1. 상태 업데이트
            const statusRes = await projectApi.updateStatus(project.id, status);
            let updatedProject = statusRes?.status ? { ...project, status: statusRes.status } : { ...project, status };

            // 2. 상태에 따른 진행 단계 자동 업데이트 (동기화)
            const statusToProgressKey = {
                '설계': 'design',
                '계약': 'contract',
                '제작': 'production',
                '납품': 'delivery',
                '완료': 'collection'
            };

            const progressKey = statusToProgressKey[status];
            if (progressKey) {
                const currentProgress = updatedProject.progress || {};
                // 해당 단계가 아직 완료되지 않았다면 자동으로 완료 처리
                if (!currentProgress[progressKey]) {
                    const progressRes = await projectApi.updateProgress(project.id, progressKey);
                    if (progressRes?.progress) {
                        updatedProject = { ...updatedProject, progress: progressRes.progress };
                    }
                }
            }

            // 3. 최종 변경 사항 반영
            if (onUpdate) {
                onUpdate(updatedProject);
            }
        } catch (e) {
            console.error(e);
            alert('상태 변경 실패');
        }
    };

    const handleProgressToggle = async (stage) => {
        if (!project) return;
        try {
            const res = await projectApi.updateProgress(project.id, stage);
            // 진행 단계 변경 후 콜백 호출
            if (onUpdate) {
                onUpdate(res?.progress ? { ...project, progress: res.progress } : null);
            }
        } catch (e) {
            console.error('Progress update failed', e);
            alert('진행 단계 변경 실패');
        }
    };

    return {
        handleStatusChange,
        handleProgressToggle,
    };
};
