import { useState, useEffect } from 'react';
import { updateProjectFields } from '../services/projectDetailService';
import { projectApi } from '../services/apiClient';

export const useProjectCost = (project, onUpdate) => {
    const [finalCostInput, setFinalCostInput] = useState('');
    const [contractAmountInput, setContractAmountInput] = useState('');
    const [isCostConfirmed, setIsCostConfirmed] = useState(false);

    useEffect(() => {
        if (project) {
            setFinalCostInput(project.finalCost || 0);
            setContractAmountInput(project.contractAmount || 0);
            setIsCostConfirmed(!!project.isCostConfirmed);
        }
    }, [project]);

    const handleUpdateCostAndContract = async () => {
        if (!project) return;
        try {
            const parsedFinalCost = parseInt(finalCostInput || 0, 10);
            const parsedContractAmount = parseInt(contractAmountInput || 0, 10);

            const updatedFields = {
                finalCost: parsedFinalCost,
                contractAmount: parsedContractAmount,
                isCostConfirmed,
            };

            await updateProjectFields(project.id, updatedFields);

            let updatedProject = {
                ...project,
                ...updatedFields,
            };

            if (parsedContractAmount > 0) {
                if (updatedProject.status !== '설계') {
                    const statusRes = await projectApi.updateStatus(project.id, '설계');
                    updatedProject = {
                        ...updatedProject,
                        status: statusRes?.status || '설계',
                    };
                }

                const currentProgress = updatedProject.progress || {};
                if (!currentProgress.design) {
                    const progressRes = await projectApi.updateProgress(project.id, 'design');
                    if (progressRes?.progress) {
                        updatedProject = {
                            ...updatedProject,
                            progress: progressRes.progress,
                        };
                    }
                }
            }

            if (onUpdate) {
                onUpdate(updatedProject);
            }

            alert('금액 정보가 저장되었습니다.');
        } catch (e) {
            alert('저장 실패');
        }
    };

    return {
        finalCostInput,
        setFinalCostInput,
        contractAmountInput,
        setContractAmountInput,
        isCostConfirmed,
        setIsCostConfirmed,
        handleUpdateCostAndContract,
    };
};
