import {
	type DocumentNode,
	type OperationVariables,
	type SubscriptionHookOptions,
	type SubscriptionResult,
	type TypedDocumentNode,
	useSubscription,
} from "@apollo/client";
import type React from "react";

export interface SubscriptionProps<
	TData = unknown,
	TVariables extends OperationVariables = OperationVariables,
> {
	subscription: DocumentNode | TypedDocumentNode<TData, TVariables>;
	variables?: TVariables;
	children: (result: SubscriptionResult<TData, TVariables>) => React.ReactNode;
	options?: Omit<
		SubscriptionHookOptions<TData, TVariables>,
		"subscription" | "variables"
	>;
}

export const Subscription = <
	TData = unknown,
	TVariables extends OperationVariables = OperationVariables,
>({
	subscription,
	variables,
	children,
	options = {},
}: SubscriptionProps<TData, TVariables>) => {
	const result = useSubscription<TData, TVariables>(subscription, {
		variables,
		...options,
	});

	return <>{children(result)}</>;
};
