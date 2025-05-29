import React from 'react';
import {
  useQuery,
  QueryHookOptions,
  TypedDocumentNode,
  DocumentNode,
  OperationVariables,
  QueryResult,
} from '@apollo/client';

export interface QueryProps<TData = any, TVariables extends OperationVariables = OperationVariables> {
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: TVariables;
  children: (result: QueryResult<TData, TVariables>) => React.ReactNode;
  options?: Omit<QueryHookOptions<TData, TVariables>, 'query' | 'variables'>;
}

/**
 * Query component compatible with React 18/19 and Next.js 12-15
 * Following TanStack Query pattern for React 18 compatibility
 */
export const Query = <TData = any, TVariables extends OperationVariables = OperationVariables>({
  query,
  variables,
  children,
  options = {},
}: QueryProps<TData, TVariables>) => 
  <>{children(useQuery<TData, TVariables>(query, { variables, ...options }))}</>; 