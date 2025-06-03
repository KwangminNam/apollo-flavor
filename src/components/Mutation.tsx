import {
	type DocumentNode,
	type MutationFunction,
	type MutationHookOptions,
	type OperationVariables,
	type TypedDocumentNode,
	useMutation,
} from "@apollo/client";
import type React from "react";

export interface MutationRenderProps<
	TData = unknown,
	TVariables extends OperationVariables = OperationVariables,
> {
	mutate: MutationFunction<TData, TVariables>;
	data?: TData | null;
	loading: boolean;
	error?: Error;
	called: boolean;
	reset: () => void;
}

export interface MutationProps<
	TData = unknown,
	TVariables extends OperationVariables = OperationVariables,
> {
	mutation: DocumentNode | TypedDocumentNode<TData, TVariables>;
	children: (
		mutationResult: MutationRenderProps<TData, TVariables>,
	) => React.ReactNode;
	options?: MutationHookOptions<TData, TVariables>;
}

/**
 * Mutation component compatible with React 18/19 and Next.js 12-15
 * Following TanStack Query pattern for React 18 compatibility
 */
export const Mutation = <
	TData = unknown,
	TVariables extends OperationVariables = OperationVariables,
>({
	mutation,
	children,
	options = {},
}: MutationProps<TData, TVariables>) => {
	const [mutate, result] = useMutation<TData, TVariables>(mutation, options);
	return <>{children({ mutate, ...result })}</>;
};
