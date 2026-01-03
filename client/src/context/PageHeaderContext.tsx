import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PageHeaderState {
    title: string;
    subtitle: string;
    actions: ReactNode;
}

interface PageHeaderContextType {
    header: PageHeaderState;
    setHeader: (header: Partial<PageHeaderState>) => void;
    resetHeader: () => void;
}

const defaultHeader: PageHeaderState = {
    title: '',
    subtitle: '',
    actions: null,
};

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export const PageHeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [header, setHeaderState] = useState<PageHeaderState>(defaultHeader);

    const setHeader = useCallback((newHeader: Partial<PageHeaderState>) => {
        setHeaderState(prev => ({ ...prev, ...newHeader }));
    }, []);

    const resetHeader = useCallback(() => {
        setHeaderState(defaultHeader);
    }, []);

    return (
        <PageHeaderContext.Provider value={{ header, setHeader, resetHeader }}>
            {children}
        </PageHeaderContext.Provider>
    );
};

export const usePageHeader = () => {
    const context = useContext(PageHeaderContext);
    if (!context) {
        throw new Error('usePageHeader must be used within a PageHeaderProvider');
    }
    return context;
};

// Hook to set page header on mount and clean up on unmount
export const useSetPageHeader = (
    title: string,
    subtitle: string,
    actions?: ReactNode,
    dependencies: any[] = []
) => {
    const { setHeader, resetHeader } = usePageHeader();

    React.useEffect(() => {
        setHeader({ title, subtitle, actions });
        return () => resetHeader();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, subtitle, ...dependencies]);

    // Return setHeader for dynamic updates
    return { setHeader };
};
