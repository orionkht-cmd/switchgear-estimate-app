import { updateProjectFields } from '../services/projectDetailService';

export const useProjectStatus = (project) => {
    const handleStatusChange = async (status) => {
        if (!project) return;
        
        // Status to Progress Key Mapping
        const statusToProgressKey = {
            '계약': 'contract',
            '제작': 'production',
            '납품': 'delivery'
        };

        const progressKey = statusToProgressKey[status];
        let updates = { status };

        // If there is a corresponding progress key and it's not set yet, set it to today
        if (progressKey) {
            const currentProgress = project.progress || {};
            if (!currentProgress[progressKey]) {
                updates.progress = {
                    ...currentProgress,
                    [progressKey]: new Date().toISOString().split('T')[0]
                };
            }
        }

        try {
            await updateProjectFields(project.id, updates);
        } catch (e) {
            alert('상태 변경 실패');
        }
    };

    const handleProgressToggle = async (stage) => {
        if (!project) return;
        const currentProgress = project.progress || {};
        const isCompleted = !!currentProgress[stage];
        const newProgress = {
            ...currentProgress,
            [stage]: isCompleted
                ? null
                : new Date().toISOString().split('T')[0],
        };
        try {
            await updateProjectFields(project.id, { progress: newProgress });
        } catch (e) {
            console.error('Progress update failed', e);
        }
    };

    return {
        handleStatusChange,
        handleProgressToggle,
    };
};
