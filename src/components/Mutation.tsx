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
	variables?: TVariables;
	children: (
		mutationResult: MutationRenderProps<TData, TVariables>,
	) => React.ReactNode;
	options?: Omit<MutationHookOptions<TData, TVariables>, 'variables'>;
}

/**
 * Mutation component compatible with React 18/19 and Next.js 12-15
 * 
 * @example
 *     <Mutation<IPostMutation, IPostMutationVariables>
 *       mutation={CREATE_POST}
 *       variables={{ input: { title: 'Hello', body: 'World' } }}
 *       options={{
 *         onCompleted: (data) => console.log('완료:', data),
 *         onError: (error) => console.error('에러:', error)
 *       }}
 *     >
 *       {({ mutate, loading, error, reset }) => (
 *         <form onSubmit={async (e) => {
 *           e.preventDefault();
 *           try {
 *             await mutate();
 *           } catch (e) {
 *             console.error(e);
 *           }
 *         }}>
 *           <button type="submit" disabled={loading}>
 *             {loading ? '처리중...' : '저장'}
 *           </button>
 *         </form>
 *       )}
 *     </Mutation>
 */
export const Mutation = <
	TData = unknown,
	TVariables extends OperationVariables = OperationVariables,
>({
	mutation,
	variables,
	children,
	options = {},
}: MutationProps<TData, TVariables>) => {
	const [mutate, result] = useMutation<TData, TVariables>(mutation, {
		...options,
		variables,
	});
	return <>{children({ mutate, ...result })}</>;
};
