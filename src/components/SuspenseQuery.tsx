import {
	type DocumentNode,
	type OperationVariables,
	type SuspenseQueryHookOptions,
	type TypedDocumentNode,
	type UseSuspenseQueryResult,
	useSuspenseQuery,
} from "@apollo/client";
import type { ReactNode } from "react";

/**
 * SuspenseQuery component compatible with React 18/19 and Next.js 12-15
 * Note: This component should be wrapped with <Suspense> by the user
 *
 * Following TanStack Query pattern for React 18 compatibility
 * @example
 * ```tsx
 * <SuspenseQuery
 *  <DogResponse,DogVariables>
 *  query={GET_USER}
 *  variables={{ id: '1' }}
 *  options={{
 *    fetchPolicy: 'network-only',
 *  }}
 * >
 *   {({ data }) => <div>{data.user.name}</div>}
 * </SuspenseQuery>
 * ```
 */
export const SuspenseQuery = <
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	TData = any,
	TVariables extends OperationVariables = OperationVariables,
>({
	children,
	query,
	variables,
	...options
}: SuspenseQueryHookOptions<TData, TVariables> & {
	children: (result: UseSuspenseQueryResult<TData, TVariables>) => ReactNode;
	query: DocumentNode | TypedDocumentNode<TData, TVariables>;
	variables?: TVariables;
}) => (
	<>
		{children(
			useSuspenseQuery<TData, TVariables>(query, { variables, ...options }),
		)}
	</>
);
