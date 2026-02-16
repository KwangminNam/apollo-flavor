export { Suspense } from "react";

export { SuspenseQuery } from "./components/SuspenseQuery";
export { SuspenseFragment } from "./components/SuspenseFragment";
export { Mutation } from "./components/Mutation";
export { Query } from "./components/Query";
export { Subscription } from "./components/Subscription";

// Export custom hooks
export {
	useQueries,
	areQueriesLoading,
	hasQueriesErrors,
	getQueriesErrors,
	areQueriesComplete,
	getCombinedLoadingState,
	getAllQueriesData,
	refetchAllQueries,
} from "./hooks/useQueries";

// Export types
export type { MutationProps, MutationRenderProps } from "./components/Mutation";
export type { QueryProps } from "./components/Query";
export type { SubscriptionProps } from "./components/Subscription";
export type { SuspenseFragmentProps } from "./components/SuspenseFragment";
export type { SuspenseQueryProps } from "./components/SuspenseQuery";

// Export hook types
export type { QueryConfig, QueriesResult } from "./hooks/useQueries";
