import { useState, useEffect } from 'react';
import { projectApi } from '../services/apiClient';

export const useProjectMemo = (project, user) => {
    const [memo, setMemo] = useState('');
    const [memoList, setMemoList] = useState([]);
    const [activeMemoIndex, setActiveMemoIndex] = useState(-1);
    const [isMemoOpen, setIsMemoOpen] = useState(false);

    // Sync state with project data
    useEffect(() => {
        if (project) {
            setMemoList(project.memos || []);
            if (project.memos?.length > 0) {
                setActiveMemoIndex(0);
                setMemo(project.memos[0].content);
            } else {
                setActiveMemoIndex(-1);
                setMemo(project.memo || '');
            }
        }
    }, [project]);

    const handleSaveMemo = async () => {
        if (!project) return;
        try {
            const now = new Date().toISOString();
            let memos = Array.isArray(memoList) ? [...memoList] : [];

            if (activeMemoIndex >= 0 && memos[activeMemoIndex]) {
                const target = memos[activeMemoIndex];
                const updatedProject = await projectApi.updateMemo(project.id, target.id, {
                    title: target.title,
                    content: memo,
                });
                memos = updatedProject.memos || [];
            } else {
                const index = memos.length;
                const updatedProject = await projectApi.createMemo(project.id, {
                    title: `메모 ${index + 1}`,
                    content: memo,
                });
                memos = updatedProject.memos || [];
                setActiveMemoIndex(index);
            }

            setMemoList(memos);
            alert('메모가 저장되었습니다.');
        } catch (e) {
            alert('메모 저장 실패');
        }
    };

    const handleDeleteMemo = async (index) => {
        if (!project) return;
        if (!Array.isArray(memoList) || !memoList[index]) return;

        if (!window.confirm('선택한 메모를 삭제하시겠습니까?')) return;

        try {
            const target = memoList[index];
            const updatedProject = await projectApi.deleteMemo(project.id, target.id, {
                userId: user?.uid || null,
            });
            const newMemos = updatedProject.memos || [];

            if (newMemos.length === 0) {
                setActiveMemoIndex(-1);
                setMemo('');
            } else {
                const nextIndex = Math.min(index, newMemos.length - 1);
                setActiveMemoIndex(nextIndex);
                setMemo(newMemos[nextIndex].content || '');
            }

            setMemoList(newMemos);

            alert('메모가 삭제되었습니다.');
        } catch (e) {
            alert('메모 삭제 실패');
        }
    };

    return {
        memo,
        setMemo,
        memoList,
        setMemoList,
        activeMemoIndex,
        setActiveMemoIndex,
        isMemoOpen,
        setIsMemoOpen,
        handleSaveMemo,
        handleDeleteMemo,
    };
};
