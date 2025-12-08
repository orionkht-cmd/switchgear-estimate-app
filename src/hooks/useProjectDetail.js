import { useState, useEffect } from 'react';
import { projectApi } from '../services/apiClient';
import { useProjectRevisions } from './useProjectRevisions';
import { useProjectMemo } from './useProjectMemo';
import { useProjectStatus } from './useProjectStatus';
import { useProjectCost } from './useProjectCost';
import { useProjectActions } from './useProjectActions';

export const useProjectDetail = ({
  project: initialProject,
  user,
  isOpen,
  onClose,
  onDeleted,
  onUpdate,
}) => {
  const [project, setProject] = useState(initialProject);

  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    }
  }, [initialProject]);

  useEffect(() => {
    const fetchFullProject = async () => {
      if (initialProject?.id && isOpen) {
        try {
          const fullData = await projectApi.get(initialProject.id);
          if (fullData) {
            setProject(fullData);
          }
        } catch (error) {
          console.error('Failed to fetch full project details:', error);
        }
      }
    };

    fetchFullProject();
  }, [initialProject?.id, isOpen]);

  const revisions = useProjectRevisions(project, user);
  const memos = useProjectMemo(project, user);
  const status = useProjectStatus(project, onUpdate);
  const cost = useProjectCost(project);
  const actions = useProjectActions(project, onClose, onDeleted);

  return {
    ...revisions,
    ...memos,
    ...status,
    ...cost,
    ...actions,
  };
};
