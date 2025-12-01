import { collection, doc } from 'firebase/firestore';

export const getProjectsCollection = (db, appId) =>
  collection(db, 'artifacts', appId, 'public', 'data', 'projects');

export const getProjectDoc = (db, appId, id) =>
  doc(db, 'artifacts', appId, 'public', 'data', 'projects', id);

