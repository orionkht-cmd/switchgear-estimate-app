import { projectApi } from './apiClient';

export const deleteProjectById = (projectId) => {
  return projectApi.remove(projectId);
};

export const updateProjectFields = (projectId, data) => {
  return projectApi.update(projectId, data);
};



