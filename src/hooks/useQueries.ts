import { useQuery, QueryResult } from '@apollo/client';
import { DocumentNode } from 'graphql';
import { useMemo } from 'react';

export interface QueryConfig<TData = any, TVariables = any> {
  query: DocumentNode;
  variables?: TVariables;
  skip?: boolean;
  errorPolicy?: 'none' | 'ignore' | 'all';
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only' | 'no-cache' | 'standby';
  notifyOnNetworkStatusChange?: boolean;
  pollInterval?: number;
  context?: any;
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
}

export interface QueriesResult<TData = any> {
  data?: TData;
  loading: boolean;
  error?: any;
  called: boolean;
  networkStatus: number;
  refetch: () => Promise<any>;
  fetchMore: (options: any) => Promise<any>;
  updateQuery: (updater: any) => void;
  startPolling: (pollInterval: number) => void;
  stopPolling: () => void;
  subscribeToMore: (options: any) => () => void;
}

/**
 * Custom hook that executes multiple queries in parallel
 * Similar to Apollo Client's useQueries but implemented using multiple useQuery calls
 */
export function useQueries<T extends readonly QueryConfig[]>(
  queries: T
): {
    [K in keyof T]: T[K] extends QueryConfig<infer TData, any>
    ? QueriesResult<TData>
    : QueriesResult;
  } {
  // Execute all queries using useQuery hook
  const results = queries.map((queryConfig) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery(queryConfig.query, {
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
    const result = results.map((result: QueryResult) => ({
      data: result.data,
      loading: result.loading,
      error: result.error,
      called: result.called,
      networkStatus: result.networkStatus,
      refetch: result.refetch,
      fetchMore: result.fetchMore,
      updateQuery: result.updateQuery,
      startPolling: result.startPolling,
      stopPolling: result.stopPolling,
      subscribeToMore: result.subscribeToMore,
    }));
    return [result, {
      hasErrors: hasQueriesErrors(result),
      errors: getQueriesErrors(result),
      areComplete: areQueriesComplete(result),
      areLoading: areQueriesLoading(result),
      data: getAllQueriesData(result),
      refetchAll: refetchAllQueries(result),
    }];
  }, [results]) as any;
}

/**
 * Utility function to check if all queries are loading
 */
export function areQueriesLoading(results: QueriesResult[]): boolean {
  return results.some(result => result.loading);
}

/**
 * Utility function to check if any queries have errors
 */
export function hasQueriesErrors(results: QueriesResult[]): boolean {
  return results.some(result => result.error);
}

/**
 * Utility function to get all errors from queries
 */
export function getQueriesErrors(results: QueriesResult[]): any[] {
  return results.filter(result => result.error).map(result => result.error);
}

/**
 * Utility function to check if all queries have completed successfully
 */
export function areQueriesComplete(results: QueriesResult[]): boolean {
  return results.every(result => !result.loading && !result.error && result.data);
}

/**
 * Utility function to get combined loading state
 */
export function getCombinedLoadingState(results: QueriesResult[]): boolean {
  return areQueriesLoading(results);
}

/**
 * Utility function to get all data from queries
 */
export function getAllQueriesData<T = any>(results: QueriesResult<T>[]): (T | undefined)[] {
  return results.map(result => result.data);
}

export function refetchAllQueries(results: QueriesResult[]): Promise<any[]> {
  return Promise.all(results.map(result => result.refetch()));
}