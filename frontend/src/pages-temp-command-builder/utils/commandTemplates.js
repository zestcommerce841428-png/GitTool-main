export const COMMAND_TEMPLATES = [
  {
    id: "create-feature",
    label: "Create Feature Branch",
    danger: "safe",
    commands: [
      "git checkout main",
      "git pull origin main",
      "git checkout -b feature/my-feature"
    ]
  },
  {
    id: "squash-commits",
    label: "Squash last 3 commits",
    danger: "warning",
    commands: [
      "git reset --soft HEAD~3",
      "git commit -m \"chore: squashed commits\""
    ]
  },
  {
    id: "delete-branch",
    label: "Delete Local Branch",
    danger: "warning",
    commands: [
      "git branch -d branch-name"
    ]
  },
  {
    id: "undo-commit",
    label: "Undo Last Commit",
    danger: "safe",
    commands: [
      "git reset --soft HEAD~1"
    ]
  },
  {
    id: "hard-reset",
    label: "Hard Reset to Remote",
    danger: "danger",
    commands: [
      "git fetch origin",
      "git reset --hard origin/main"
    ]
  },
  {
    id: "clean-working-dir",
    label: "Clean Working Directory",
    danger: "danger",
    commands: [
      "git checkout -- .",
      "git clean -fd"
    ]
  },
  {
    id: "stash-everything",
    label: "Stash All (incl untracked)",
    danger: "safe",
    commands: [
      "git stash push -u -m \"quick-save\""
    ]
  },
  {
    id: "view-log",
    label: "View Compact History",
    danger: "safe",
    commands: [
      "git log --oneline --graph --all --decorate"
    ]
  }
];

export const COMMAND_LIBRARY = [
  { action: 'git checkout', label: 'Switch Context', desc: 'Change branch or restore working tree files' },
  { action: 'git branch', label: 'Manage Branches', desc: 'List, create, or delete branches' },
  { action: 'git merge', label: 'Join Histories', desc: 'Join two or more development histories together' },
  { action: 'git rebase', label: 'Reapply Commits', desc: 'Reapply commits on top of another base tip' },
  { action: 'git cherry-pick', label: 'Apply specific commits', desc: 'Apply the changes introduced by some existing commits' },
  { action: 'git reset', label: 'Reset HEAD', desc: 'Reset current HEAD to the specified state' },
  { action: 'git stash', label: 'Stash changes', desc: 'Stash the changes in a dirty working directory away' },
];
