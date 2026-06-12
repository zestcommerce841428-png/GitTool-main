import { useState, useCallback } from 'react';
import { COMMAND_SCHEMA } from '../utils/commandSchema';

export function useCommandBuilder(initialAction = 'git checkout') {
  const [action, setAction] = useState(initialAction);
  const [state, setState] = useState({
    branchName: '',
    baseBranch: '',
    targetBranch: '',
    targetCommit: '',
    mergeStrategy: '',
    resetMode: '--mixed',
    stashMessage: '',
    commits: [],
    
    // Checkbox Options
    force: false,
    verbose: false,
    dryRun: false,
    noCheckout: false,
    rebaseInteractive: false,
    cleanDryRun: true,
    cleanForce: false,
    cleanIgnored: false,
  });

  const [chain, setChain] = useState([]);
  
  const updateState = useCallback((key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      // reset specific flags but maybe keep branches for UX?
      force: false, verbose: false, dryRun: false, 
      rebaseInteractive: false, cleanDryRun: true, cleanForce: false 
    }));
  }, []);

  // Use schema or basic action parsing to build command string
  const buildCommand = useCallback(() => {
    let cmd = action;
    
    if (action === 'git checkout' && state.targetBranch) {
      cmd += ` ${state.targetBranch}`;
    } else if (action === 'git branch') {
      if (state.branchName) {
        cmd = `git checkout -b ${state.branchName}`;
        if (state.baseBranch && state.baseBranch !== 'main') cmd += ` ${state.baseBranch}`;
      } else {
        cmd = 'git branch';
      }
    } else if (action === 'git merge' && state.targetBranch) {
      if (state.mergeStrategy) cmd += ` --${state.mergeStrategy}`;
      cmd += ` ${state.targetBranch}`;
    } else if (action === 'git reset') {
      cmd += ` ${state.resetMode || '--mixed'} ${state.targetCommit || 'HEAD~1'}`;
    } else if (action === 'git clean') {
      if (state.cleanDryRun) cmd += ' -n';
      if (state.cleanForce) cmd += ' -f';
      if (state.cleanIgnored) cmd += ' -x';
    } else if (action === 'git rebase' && state.targetBranch) {
      if (state.rebaseInteractive) cmd += ' -i';
      cmd += ` ${state.targetBranch}`;
    } else if (action === 'git stash') {
      cmd = 'git stash push';
      if (state.stashMessage) cmd += ` -m "${state.stashMessage}"`;
    }

    if (state.force) cmd += ' --force';
    if (state.verbose) cmd += ' --verbose';
    if (state.dryRun && action !== 'git clean') cmd += ' --dry-run';

    return cmd;
  }, [action, state]);

  return {
    action,
    setAction,
    state,
    updateState,
    resetState,
    buildCommand,
    chain,
    setChain,
    schema: COMMAND_SCHEMA[action] || { steps: [] }
  };
}
