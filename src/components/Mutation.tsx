import React from 'react';
import {
  useMutation,
  MutationHookOptions,
  TypedDocumentNode,
  DocumentNode,
  OperationVariables,
  MutationResult,
  MutationFunction,
} from '@apollo/client';

export interface MutationRenderProps<TData = any, TVariables extends OperationVariables = OperationVariables> {
  mutate: MutationFunction<TData, TVariables>;
  data?: TData | null;
  loading: boolean;
  error?: Error;
  called: boolean;
  reset: () => void;
}

export interface MutationProps<TData = any, TVariables extends OperationVariables = OperationVariables> {
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>;
  children: (mutationResult: MutationRenderProps<TData, TVariables>) => React.ReactNode;
  options?: MutationHookOptions<TData, TVariables>;
}

/**
 * Mutation component compatible with React 18/19 and Next.js 12-15
 * Following TanStack Query pattern for React 18 compatibility
 */
export const Mutation = <TData = any, TVariables extends OperationVariables = OperationVariables>({
  mutation,
  children,
  options = {},
}: MutationProps<TData, TVariables>) => {
  const [mutate, { data, loading, error, called, reset }] = useMutation<TData, TVariables>(mutation, options);
  return <>{children({ mutate, data, loading, error, called, reset })}</>;
}; 