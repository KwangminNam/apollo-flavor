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

export function Query<TData = any, TVariables extends OperationVariables = OperationVariables>({
  query,
  variables,
  children,
  options = {},
}: QueryProps<TData, TVariables>) {
  const result = useQuery<TData, TVariables>(query, {
    variables,
    ...options,
  });

  return <>{children(result)}</>;
} 