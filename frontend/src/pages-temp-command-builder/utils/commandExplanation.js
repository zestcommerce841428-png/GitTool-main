export function getCommandExplanation(action, state) {
  const result = {
    title: action,
    description: '',
    effects: [],
    warning: null
  };

  switch (action) {
    case 'git checkout':
      result.title = `Switch context`;
      result.description = `Updates files in the working tree to match the version in the index or the specified tree.`;
      if (state.branchName) result.effects.push(`Switches the local codebase context to branch: ${state.branchName}`);
      else result.effects.push(`Restores working tree files.`);
      break;

    case 'git branch':
      result.title = `Create or manage branches`;
      if (state.branchName) {
        result.description = `Creates a new branch named '${state.branchName}' from the selected base.`;
        result.effects.push("Does not modify commit history");
        result.effects.push("Only affects your local repository");
        if (!state.noCheckout) result.effects.push("Automatically switches to the new branch");
      } else {
        result.description = `Lists, creates, or deletes branches.`;
      }
      break;

    case 'git merge':
      result.title = `Merge histories`;
      result.description = `Incorporates changes from the named commits (since the time their histories diverged from the current branch) into the current branch.`;
      if (state.targetBranch) result.effects.push(`Brings changes from '${state.targetBranch}' into the current branch.`);
      if (state.mergeStrategy === 'squash') result.effects.push('Squashes all branch commits into a single commit.');
      if (state.mergeStrategy === 'no-ff') result.effects.push('Always creates a merge commit.');
      break;

    case 'git rebase':
      result.title = `Reapply commits`;
      result.description = `Reapplies commits on top of another base tip.`;
      result.effects.push(`Rewrites local commit history.`);
      if (state.rebaseInteractive) result.effects.push('Opens interactive editor to squash or reword commits.');
      result.warning = "Do not rebase commits that exist outside your repository (e.g. pushed to remote).";
      break;

    case 'git reset':
      result.title = `Reset current HEAD`;
      if (state.resetMode === '--hard') {
        result.description = `Resets the index and working tree. Any changes to tracked files in the working tree since <commit> are discarded.`;
        result.effects.push('Permanently deletes uncommitted changes.');
        result.warning = "DANGER: This operation is destructive and cannot be undone.";
      } else if (state.resetMode === '--soft') {
        result.description = `Does not touch the index file or the working tree at all (but resets the head).`;
        result.effects.push('Changes remain staged for commit.');
      } else {
        result.description = `Resets the index but not the working tree (i.e., the changed files are preserved but not marked for commit).`;
        result.effects.push('Changes remain unstaged in your working directory.');
      }
      break;

    case 'git clean':
      result.title = `Remove untracked files`;
      if (state.cleanDryRun) {
        result.description = `Dry run: Previews what would be deleted.`;
      } else {
        result.description = `Cleans the working tree by recursively removing files that are not under version control.`;
        result.effects.push('Permanently deletes untracked files.');
        result.warning = "DANGER: This operation is destructive and cannot be undone.";
      }
      if (state.cleanIgnored) result.warning = "Will also remove .gitignore files.";
      break;

    default:
      result.description = `Executes the ${action} command.`;
      result.effects.push(`Performs standard Git operation.`);
      break;
  }

  if (state.force) {
    result.effects.push("Overrides standard safety checks.");
    result.warning = "Warning: --force can rewrite remote history and cause data loss for collaborators.";
  }

  return result;
}
