import React from 'react';
import {
  useSubscription,
  SubscriptionHookOptions,
  TypedDocumentNode,
  DocumentNode,
  OperationVariables,
  SubscriptionResult,
} from '@apollo/client';

export interface SubscriptionProps<TData = any, TVariables extends OperationVariables = OperationVariables> {
  subscription: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: TVariables;
  children: (result: SubscriptionResult<TData, TVariables>) => React.ReactNode;
  options?: Omit<SubscriptionHookOptions<TData, TVariables>, 'subscription' | 'variables'>;
}

export function Subscription<TData = any, TVariables extends OperationVariables = OperationVariables>({
  subscription,
  variables,
  children,
  options = {},
}: SubscriptionProps<TData, TVariables>) {
  const result = useSubscription<TData, TVariables>(subscription, {
    variables,
    ...options,
  });

  return <>{children(result)}</>;
} 