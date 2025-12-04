import { useState, useEffect } from 'react';
import { updateProjectFields } from '../services/projectDetailService';

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
                memos[activeMemoIndex] = {
                    ...memos[activeMemoIndex],
                    content: memo,
                    updatedAt: now,
                };
            } else {
                const index = memos.length;
                memos.push({
                    id: `memo-${index + 1}`,
                    title: `메모 ${index + 1}`,
                    content: memo,
                    createdAt: now,
                    updatedAt: now,
                });
                setActiveMemoIndex(index);
            }

            await updateProjectFields(project.id, {
                memos,
                updatedAt: now,
                lastModifier: user?.uid || null,
            });

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
            const newMemos = memoList.filter((_, i) => i !== index);
            await updateProjectFields(project.id, {
                memos: newMemos,
                updatedAt: new Date().toISOString(),
                lastModifier: user?.uid || null,
            });

            setMemoList(newMemos);

            if (newMemos.length === 0) {
                setActiveMemoIndex(-1);
                setMemo('');
            } else {
                const nextIndex = Math.min(index, newMemos.length - 1);
                setActiveMemoIndex(nextIndex);
                setMemo(newMemos[nextIndex].content || '');
            }

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
