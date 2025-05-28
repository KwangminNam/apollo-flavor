// Re-export everything from Apollo Client
export * from '@apollo/client';

export { Suspense } from 'react';

// Export our custom components
export { SuspenseQuery } from './components/SuspenseQuery';
export { Mutation } from './components/Mutation';
export { Query } from './components/Query';
export { Subscription } from './components/Subscription';
export { default as ErrorBoundary } from './components/ErrorBoundary';

// Export custom hooks
export { 
  useQueries,
  areQueriesLoading,
  hasQueriesErrors,
  getQueriesErrors,
  areQueriesComplete,
  getCombinedLoadingState,
  getAllQueriesData
} from './hooks/useQueries';

// Export types
export type { SuspenseQueryProps } from './components/SuspenseQuery';
export type { MutationProps, MutationRenderProps } from './components/Mutation';
export type { QueryProps } from './components/Query';
export type { SubscriptionProps } from './components/Subscription';
