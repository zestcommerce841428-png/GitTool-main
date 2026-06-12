'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface WorkspaceContextValue {
    selectedRepo: any;
    setSelectedRepo: (repo: any) => void;
    selectedBranch: string;
    setSelectedBranch: (branch: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
    selectedRepo: null,
    setSelectedRepo: () => {},
    selectedBranch: 'main',
    setSelectedBranch: () => {},
});

export function useWorkspace() {
    return useContext(WorkspaceContext);
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [selectedBranch, setSelectedBranch] = useState('main');

    useEffect(() => {
        const savedRepo = localStorage.getItem('workspace_repo');
        const savedBranch = localStorage.getItem('workspace_branch');

        if (savedRepo) {
            setSelectedRepo(JSON.parse(savedRepo));
        }

        if (savedBranch) {
            setSelectedBranch(savedBranch);
        }
    }, []);

    // Save to localStorage whenever they change
    useEffect(() => {
        if (selectedRepo) {
            localStorage.setItem('workspace_repo', JSON.stringify(selectedRepo));
        } else {
            localStorage.removeItem('workspace_repo');
        }
    }, [selectedRepo]);

    useEffect(() => {
        if (selectedBranch) {
            localStorage.setItem('workspace_branch', selectedBranch);
        } else {
            localStorage.removeItem('workspace_branch');
        }
    }, [selectedBranch]);

    const value = {
        selectedRepo,
        setSelectedRepo,
        selectedBranch,
        setSelectedBranch
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}
