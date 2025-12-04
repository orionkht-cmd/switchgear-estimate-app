import { useState, useEffect } from 'react';
import { updateProjectFields } from '../services/projectDetailService';

export const useProjectCost = (project) => {
    const [finalCostInput, setFinalCostInput] = useState('');
    const [contractAmountInput, setContractAmountInput] = useState('');

    useEffect(() => {
        if (project) {
            setFinalCostInput(project.finalCost || 0);
            setContractAmountInput(project.contractAmount || 0);
        }
    }, [project]);

    const handleUpdateCostAndContract = async () => {
        if (!project) return;
        try {
            await updateProjectFields(project.id, {
                finalCost: parseInt(finalCostInput || 0, 10),
                contractAmount: parseInt(contractAmountInput || 0, 10),
            });
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
        handleUpdateCostAndContract,
    };
};
