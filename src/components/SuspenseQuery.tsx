import React, { Suspense } from 'react';
import {
  useSuspenseQuery,
  SuspenseQueryHookOptions,
  TypedDocumentNode,
  DocumentNode,
  OperationVariables,
  UseSuspenseQueryResult,
} from '@apollo/client';

export interface SuspenseQueryProps<TData = any, TVariables extends OperationVariables = OperationVariables> {
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: TVariables;
  children: (result: UseSuspenseQueryResult<TData, TVariables>) => React.ReactNode;
  options?: Omit<SuspenseQueryHookOptions<TData, TVariables>, 'query' | 'variables'>;
  selector?: (data: TData) => TData;
  fallback?: React.ReactNode;
}

function SuspenseQueryInner<TData = any, TVariables extends OperationVariables = OperationVariables>({
  query,
  variables,
  children,
  options = {},
  selector,
}: Omit<SuspenseQueryProps<TData, TVariables>, 'fallback'>) {
  const result = useSuspenseQuery<TData, TVariables>(query, {
    variables,
    ...options,
  });

  const transformedResult = selector 
    ? { ...result, data: selector(result.data) }
    : result;

  return <>{children(transformedResult)}</>;
}

export function SuspenseQuery<TData = any, TVariables extends OperationVariables = OperationVariables>({
  fallback = <div>Loading...</div>,
  ...props
}: SuspenseQueryProps<TData, TVariables>) {
  return (
    <Suspense fallback={fallback}>
      <SuspenseQueryInner {...props} />
    </Suspense>
  );
} 