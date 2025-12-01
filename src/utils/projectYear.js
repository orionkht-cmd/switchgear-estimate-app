export const getProjectYear = (project) => {
  if (project.createdAt?.seconds) {
    return new Date(project.createdAt.seconds * 1000).getFullYear();
  }

  if (project.projectIdDisplay) {
    const match = project.projectIdDisplay.match(/(\d{4})/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
};

