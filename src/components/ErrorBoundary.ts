import { Component, ReactNode, createElement } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error): void {
        console.error('Error caught by boundary:', error);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return createElement('div',
                { className: "error-container" },
                createElement('h2', null, 'Something went wrong'),
                createElement('button',
                    { onClick: () => window.location.reload() },
                    'Reload Page'
                )
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
