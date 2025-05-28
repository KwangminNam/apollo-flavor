import React, { Component, ErrorInfo, ReactNode } from "react";

interface IProps {
  children: ReactNode;

  fallback?: ReactNode;
}

interface IState {
  hasError: boolean;
}

class ErrorBoundary extends Component<IProps, IState> {
  public state: IState = {
    hasError: false,
  };


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getDerivedStateFromError(_: Error): IState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
  }

  public resetErrorBoundary = () => {
    this.setState({ hasError: false });
  };

  public render() {
    const { hasError } = this.state;
    if (hasError) {
      return this.props.fallback || (
        <div>
          <div>Error</div>
          <button onClick={this.resetErrorBoundary}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
