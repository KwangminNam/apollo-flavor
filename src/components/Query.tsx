import {
	type DocumentNode,
	type OperationVariables,
	type QueryHookOptions,
	type QueryResult,
	type TypedDocumentNode,
	useQuery,
} from "@apollo/client";
import type React from "react";

export interface QueryProps<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	TData = any,
	TVariables extends OperationVariables = OperationVariables,
> {
	query: DocumentNode | TypedDocumentNode<TData, TVariables>;
	variables?: TVariables;
	children: (result: QueryResult<TData, TVariables>) => React.ReactNode;
	options?: Omit<QueryHookOptions<TData, TVariables>, "query" | "variables">;
}

/**
 * Query component compatible with React 18/19 and Next.js 12-15
 * Following TanStack Query pattern for React 18 compatibility
 */
export const Query = <
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	TData = any,
	TVariables extends OperationVariables = OperationVariables,
>({
	query,
	variables,
	children,
	options = {},
}: QueryProps<TData, TVariables>) => (
	<>{children(useQuery<TData, TVariables>(query, { variables, ...options }))}</>
);
