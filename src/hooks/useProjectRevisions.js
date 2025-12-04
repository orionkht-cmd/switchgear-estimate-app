import { useState } from 'react';
import { updateProjectFields } from '../services/projectDetailService';
import { refineRevisionNote } from '../utils/analysis';

export const useProjectRevisions = (project, user) => {
    const [newRevNote, setNewRevNote] = useState('');
    const [newRevAmount, setNewRevAmount] = useState('');
    const [editingRevIndex, setEditingRevIndex] = useState(null);
    const [editRevData, setEditRevData] = useState({ amount: '', note: '' });

    const handleAddRevision = async () => {
        if (!newRevAmount || !project) return;
        const newRev = {
            rev: project.revisions.length,
            date: new Date().toISOString().split('T')[0],
            amount: parseInt(newRevAmount, 10),
            note: newRevNote || '정기 수정',
            file: `EST_Rev${project.revisions.length}.xlsx`,
        };
        try {
            await updateProjectFields(project.id, {
                revisions: [...project.revisions, newRev],
                updatedAt: new Date().toISOString(),
                lastModifier: user?.uid || null,
            });
            setNewRevNote('');
            setNewRevAmount('');
            alert('견적 이력이 업데이트되었습니다.');
        } catch (e) {
            alert('업데이트 실패');
        }
    };

    const handleEditRevision = (index, rev) => {
        setEditingRevIndex(index);
        setEditRevData({ amount: rev.amount, note: rev.note });
    };

    const handleSaveEditedRevision = async (index) => {
        if (!project) return;
        const updatedRevisions = [...project.revisions];
        const realIndex = project.revisions.length - 1 - index;
        updatedRevisions[realIndex] = {
            ...updatedRevisions[realIndex],
            amount: parseInt(editRevData.amount, 10),
            note: editRevData.note,
            updatedAt: new Date().toISOString(),
        };
        try {
            await updateProjectFields(project.id, {
                revisions: updatedRevisions,
                lastModifier: user?.uid || null,
            });
            setEditingRevIndex(null);
            alert('수정되었습니다.');
        } catch (e) {
            alert('수정 실패');
        }
    };

    const handleCancelEdit = () => {
        setEditingRevIndex(null);
    };

    const handleRefineNote = () => {
        if (!newRevNote) {
            alert('내용을 입력해주세요.');
            return;
        }
        const refined = refineRevisionNote(newRevNote);
        setNewRevNote(refined);
    };

    return {
        newRevNote,
        setNewRevNote,
        newRevAmount,
        setNewRevAmount,
        editingRevIndex,
        editRevData,
        setEditRevData,
        handleAddRevision,
        handleEditRevision,
        handleSaveEditedRevision,
        handleCancelEdit,
        handleRefineNote,
    };
};
