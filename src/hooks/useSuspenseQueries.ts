import { useSuspenseQuery, UseSuspenseQueryResult, SuspenseQueryHookOptions } from '@apollo/client';
import { DocumentNode } from 'graphql';
import { useMemo } from 'react';

export interface SuspenseQueryConfig<TData = any, TVariables = any> {
  query: DocumentNode;
  variables?: TVariables;
  skip?: boolean;
  errorPolicy?: 'none' | 'ignore' | 'all';
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache';
  notifyOnNetworkStatusChange?: boolean;
  pollInterval?: number;
  context?: any;
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
}

export interface SuspenseQueriesResult<TData = any> {
  data: TData;
  error?: any;
  networkStatus: number;
  refetch: () => Promise<any>;
  fetchMore: (options: any) => Promise<any>;
  subscribeToMore: (options: any) => () => void;
}

/**
 * Custom hook that executes multiple suspense queries in parallel
 * Similar to Apollo Client's useQueries but implemented using multiple useSuspenseQuery calls
 * This hook will suspend until all queries are resolved
 */
export function useSuspenseQueries<T extends readonly SuspenseQueryConfig[]>(
  queries: T
): {
    [K in keyof T]: T[K] extends SuspenseQueryConfig<infer TData, any>
    ? SuspenseQueriesResult<TData>
    : SuspenseQueriesResult;
  } {
  // Execute all queries using useSuspenseQuery hook
  const results = queries.map((queryConfig) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSuspenseQuery(queryConfig.query, {
      variables: queryConfig.variables,
      skip: queryConfig.skip,
      errorPolicy: queryConfig.errorPolicy,
      fetchPolicy: queryConfig.fetchPolicy,
      notifyOnNetworkStatusChange: queryConfig.notifyOnNetworkStatusChange,
      pollInterval: queryConfig.pollInterval,
      context: queryConfig.context,
      onCompleted: queryConfig.onCompleted,
      onError: queryConfig.onError,
    });
  });

  // Transform results to match our interface
  return useMemo(() => {
    const result = results.map((result: UseSuspenseQueryResult) => ({
      data: result.data,
      error: result.error,
      networkStatus: result.networkStatus,
      refetch: result.refetch,
      fetchMore: result.fetchMore,
      subscribeToMore: result.subscribeToMore,
    }));
    return [result, {
      hasErrors: hasSuspenseQueriesErrors(result),
      errors: getSuspenseQueriesErrors(result),
      refetchAll: refetchAllSuspenseQueries(result),

    }];
  }, [results]) as any;
}

/**
 * Utility function to check if any queries have errors
 */
export function hasSuspenseQueriesErrors(results: SuspenseQueriesResult[]): boolean {
  return results.some(result => result.error);
}

/**
 * Utility function to get all errors from queries
 */
export function getSuspenseQueriesErrors(results: SuspenseQueriesResult[]): any[] {
  return results.filter(result => result.error).map(result => result.error);
}

/**
 * Utility function to get all data from queries
 */
export function getAllSuspenseQueriesData<T = any>(results: SuspenseQueriesResult<T>[]): T[] {
  return results.map(result => result.data);
}

/**
 * Utility function to refetch all queries
 */
export function refetchAllSuspenseQueries(results: SuspenseQueriesResult[]): Promise<any[]> {
  return Promise.all(results.map(result => result.refetch()));
} 