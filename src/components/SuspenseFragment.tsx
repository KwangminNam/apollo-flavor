import {
	type DocumentNode,
	type TypedDocumentNode,
	type UseSuspenseFragmentResult,
	type StoreObject,
	useSuspenseFragment,
} from "@apollo/client";
import type { ReactNode } from "react";

export interface SuspenseFragmentProps<TData, TFrom extends StoreObject = StoreObject> {
	children: (result: UseSuspenseFragmentResult<TData>) => ReactNode;
	fragment: DocumentNode | TypedDocumentNode<TData>;
	fragmentName?: string;
	from: TFrom; // The object containing the fragment data
}

/**
 * SuspenseFragment component - A wrapper around useSuspenseFragment
 * that provides declarative fragment usage with Suspense support
 * 
 * This component suspends while fragment data is incomplete and renders
 * children without any additional DOM elements (using React Fragment)
 * Note: This component should be wrapped with <Suspense> by the user
 *
 * @example
 * ```tsx
 * // Define your fragment data types
 * interface UserFragment {
 *   user: {
 *     name: string;
 *     email: string;
 *   };
 * }
 * 
 * interface QueryData {
 *   user: {
 *     id: string;
 *     name: string;
 *     email: string;
 *   };
 * }
 * 
 * <SuspenseQuery<QueryData, QueryVariables>
 *  query={GET_USER}
 *  variables={{ id: '1' }}
 *  options={{
 *    fetchPolicy: 'network-only',
 *  }}
 * >
 *   {({ data }) => 
 * <SuspenseFragment<UserFragment, QueryData>
 *    fragment={GET_USER_FRAGMENT}
 *    fragmentName="UserFragment"
 *    from={data}
 *   >
 *     {({ data }) => (
 *       <>
 *         <h1>{data.user.name}</h1>
 *         <p>{data.user.email}</p>
 *       </>
 *     )}
 *   </SuspenseFragment>}
 * </SuspenseQuery>
 * ```
 */
export const SuspenseFragment = <TData = unknown, TFrom extends StoreObject = StoreObject>({
	children,
	fragment,
	fragmentName,
	from,
}: SuspenseFragmentProps<TData, TFrom>) => (
	<>
		{children(
			useSuspenseFragment<TData>({
				fragment,
				fragmentName,
				from,
			}),
		)}
	</>
);
