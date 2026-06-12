import { useState, useEffect } from 'react';
import api from '../../../../lib/apiClient';

export function useRepoContext(repo) {
  const [context, setContext] = useState({ branches: [], tags: [], remotes: [], defaultBranch: 'main' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!repo) return;
    
    let isMounted = true;
    const fetchContext = async () => {
      setLoading(true);
      setError(null);
      try {
        const owner = repo.owner?.login || repo.full_name?.split('/')[0];
        const res = await api.get(`/repos/${owner}/${repo.name}/context`);
        if (isMounted) {
          setContext({
            branches: res.branches || [],
            tags: res.tags || [],
            remotes: res.remotes || ['origin'],
            defaultBranch: res.defaultBranch || 'main'
          });
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch repo context');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContext();

    return () => { isMounted = false; };
  }, [repo]);

  return { ...context, loading, error };
}
