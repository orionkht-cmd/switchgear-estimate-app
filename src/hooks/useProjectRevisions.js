import { useState } from 'react';
import { refineRevisionNote } from '../utils/analysis';
import { projectApi } from '../services/apiClient';

export const useProjectRevisions = (project, user) => {
    const [newRevNote, setNewRevNote] = useState('');
    const [newRevAmount, setNewRevAmount] = useState('');
    const [editingRevIndex, setEditingRevIndex] = useState(null);
    const [editingRevId, setEditingRevId] = useState(null);
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
            await projectApi.addRevision(project.id, {
                amount: newRev.amount,
                note: newRev.note,
                userId: user?.uid || null,
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
        setEditingRevId(rev.id || null);
        setEditRevData({ amount: rev.amount, note: rev.note });
    };

    const handleSaveEditedRevision = async (index) => {
        if (!project) return;
        if (!editingRevId) {
            alert('수정할 이력을 찾을 수 없습니다.');
            return;
        }
        try {
            await projectApi.updateRevision(project.id, editingRevId, {
                amount: parseInt(editRevData.amount, 10),
                note: editRevData.note,
                userId: user?.uid || null,
            });
            setEditingRevIndex(null);
            setEditingRevId(null);
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
