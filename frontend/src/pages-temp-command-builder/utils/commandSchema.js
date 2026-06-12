export const COMMAND_SCHEMA = {
  'git checkout': {
    steps: ['operation', 'target', 'options'],
    hasTargetBranch: true,
  },
  'git branch': {
    steps: ['operation', 'branchName', 'baseBranch', 'options'],
    hasTargetBranch: false,
    hasBaseBranch: true,
  },
  'git merge': {
    steps: ['operation', 'targetBranch', 'strategy', 'options'],
    hasTargetBranch: true,
  },
  'git rebase': {
    steps: ['operation', 'targetBranch', 'options'],
    hasTargetBranch: true,
  },
  'git cherry-pick': {
    steps: ['operation', 'commits', 'options'],
    hasCommits: true,
  },
  'git stash': {
    steps: ['operation', 'stashMessage', 'options'],
  },
  'git reset': {
    steps: ['operation', 'resetMode', 'targetCommit', 'options'],
  },
  'git log': {
    steps: ['operation', 'logFilters'],
  },
  'git diff': {
    steps: ['operation', 'diffOptions'],
  },
  'git clean': {
    steps: ['operation', 'cleanOptions'],
  },
  'git remote': {
    steps: ['operation', 'remoteAction', 'remoteDetails'],
  },
  'git tag': {
    steps: ['operation', 'tagDetails'],
  },
  'git bisect': {
    steps: ['operation', 'bisectSteps'],
  },
  'git reflog': {
    steps: ['operation', 'reflogRecovery'],
  }
};
