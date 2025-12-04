import { useRef, useEffect, useState } from 'react';
import { getDocs, query, setDoc } from 'firebase/firestore';
import { getProjectsCollection, getProjectDoc } from '../services/projects';
import { db, appId } from '../firebase';

export const useBackup = () => {
    const fileInputRef = useRef(null);
    const [xlsxLoaded, setXlsxLoaded] = useState(false);

    // XLSX loader
    useEffect(() => {
        if (window.XLSX) {
            setXlsxLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src =
            'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => setXlsxLoaded(true);
        document.body.appendChild(script);
    }, []);

    const handleBackup = async () => {
        const q = query(getProjectsCollection(db, appId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_${new Date()
            .toISOString()
            .slice(0, 10)}.json`;
        link.click();
    };

    const handleRestoreClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = JSON.parse(e.target.result);
            if (
                window.confirm(
                    `${data.length}개 데이터 복원하시겠습니까?`,
                )
            ) {
                for (const item of data) {
                    if (item.id) {
                        await setDoc(
                            getProjectDoc(db, appId, item.id),
                            item,
                        );
                    }
                }
                alert('복원 완료');
            }
        };
        reader.readAsText(file);
    };

    return {
        fileInputRef,
        xlsxLoaded,
        handleBackup,
        handleRestoreClick,
        handleFileChange,
    };
};
