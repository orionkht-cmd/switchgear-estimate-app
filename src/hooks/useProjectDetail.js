import { useProjectRevisions } from './useProjectRevisions';
import { useProjectMemo } from './useProjectMemo';
import { useProjectStatus } from './useProjectStatus';
import { useProjectCost } from './useProjectCost';
import { useProjectActions } from './useProjectActions';

export const useProjectDetail = ({
  project,
  user,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const revisions = useProjectRevisions(project, user);
  const memos = useProjectMemo(project, user);
  const status = useProjectStatus(project);
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
