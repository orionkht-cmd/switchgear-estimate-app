import { updateDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { getProjectDoc } from './projects';
import { calculateMargin } from '../utils/format';

export const deleteProjectById = (projectId) => {
  return deleteDoc(getProjectDoc(db, appId, projectId));
};

export const updateProjectFields = (projectId, data) => {
  return updateDoc(getProjectDoc(db, appId, projectId), data);
};



