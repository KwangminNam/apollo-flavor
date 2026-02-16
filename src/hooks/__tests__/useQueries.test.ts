import { gql } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	useQueries,
	areQueriesLoading,
	hasQueriesErrors,
	getQueriesErrors,
	areQueriesComplete,
	getAllQueriesData,
	refetchAllQueries,
	type QueriesResult,
} from "../useQueries";
import "@testing-library/jest-dom";

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;

const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      title
    }
  }
`;

describe("useQueries Hook", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	const createWrapper = (mocks: Parameters<typeof MockedProvider>[0]["mocks"] = []) => {
		const Wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(MockedProvider, { mocks, addTypename: false }, children);
		return Wrapper;
	};

	it("여러 쿼리를 병렬로 실행해야 한다", async () => {
		const mocks = [
			{
				request: { query: GET_USER, variables: { id: "1" } },
				result: { data: { user: { id: "1", name: "John" } } },
			},
			{
				request: { query: GET_POSTS },
				result: { data: { posts: [{ id: "1", title: "Post 1" }] } },
			},
		];

		const { result } = renderHook(
			() =>
				useQueries([
					{ query: GET_USER, variables: { id: "1" } },
					{ query: GET_POSTS },
				] as const),
			{ wrapper: createWrapper(mocks) },
		);

		// Initially loading
		expect(result.current[0].loading).toBe(true);
		expect(result.current[1].loading).toBe(true);

		await waitFor(() => {
			expect(result.current[0].loading).toBe(false);
			expect(result.current[1].loading).toBe(false);
		});

		expect(result.current[0].data).toEqual({ user: { id: "1", name: "John" } });
		expect(result.current[1].data).toEqual({ posts: [{ id: "1", title: "Post 1" }] });
	});

	it("개별 쿼리의 에러를 처리해야 한다", async () => {
		const mocks = [
			{
				request: { query: GET_USER, variables: { id: "1" } },
				error: new Error("User fetch failed"),
			},
			{
				request: { query: GET_POSTS },
				result: { data: { posts: [{ id: "1", title: "Post 1" }] } },
			},
		];

		const { result } = renderHook(
			() =>
				useQueries([
					{ query: GET_USER, variables: { id: "1" } },
					{ query: GET_POSTS },
				] as const),
			{ wrapper: createWrapper(mocks) },
		);

		await waitFor(() => {
			expect(result.current[0].loading).toBe(false);
		});

		expect(result.current[0].error).toBeDefined();
		expect(result.current[1].data).toEqual({ posts: [{ id: "1", title: "Post 1" }] });
	});

	it("skip 옵션을 지원해야 한다", async () => {
		const mocks = [
			{
				request: { query: GET_POSTS },
				result: { data: { posts: [{ id: "1", title: "Post 1" }] } },
			},
		];

		const { result } = renderHook(
			() =>
				useQueries([
					{ query: GET_USER, variables: { id: "1" }, skip: true },
					{ query: GET_POSTS },
				] as const),
			{ wrapper: createWrapper(mocks) },
		);

		// Skipped query should not be loading
		expect(result.current[0].loading).toBe(false);

		await waitFor(() => {
			expect(result.current[1].loading).toBe(false);
		});

		expect(result.current[1].data).toEqual({ posts: [{ id: "1", title: "Post 1" }] });
	});
});

describe("useQueries Utility Functions", () => {
	const createLoadingResult = (): QueriesResult => ({
		data: undefined,
		loading: true,
		error: undefined,
		called: true,
		networkStatus: 1,
		refetch: vi.fn().mockResolvedValue({} as never),
		fetchMore: vi.fn().mockResolvedValue({} as never),
		updateQuery: vi.fn(),
		startPolling: vi.fn(),
		stopPolling: vi.fn(),
		subscribeToMore: vi.fn().mockReturnValue(() => {}),
	});

	const createSuccessResult = (data: unknown): QueriesResult => ({
		data,
		loading: false,
		error: undefined,
		called: true,
		networkStatus: 7,
		refetch: vi.fn().mockResolvedValue({ data } as never),
		fetchMore: vi.fn().mockResolvedValue({ data } as never),
		updateQuery: vi.fn(),
		startPolling: vi.fn(),
		stopPolling: vi.fn(),
		subscribeToMore: vi.fn().mockReturnValue(() => {}),
	});

	const createErrorResult = (message: string): QueriesResult => {
		const { ApolloError } = require("@apollo/client");
		return {
			data: undefined,
			loading: false,
			error: new ApolloError({ errorMessage: message }),
			called: true,
			networkStatus: 8,
			refetch: vi.fn().mockResolvedValue({} as never),
			fetchMore: vi.fn().mockResolvedValue({} as never),
			updateQuery: vi.fn(),
			startPolling: vi.fn(),
			stopPolling: vi.fn(),
			subscribeToMore: vi.fn().mockReturnValue(() => {}),
		};
	};

	describe("areQueriesLoading", () => {
		it("하나라도 로딩 중이면 true를 반환해야 한다", () => {
			const results = [createLoadingResult(), createSuccessResult({ id: 1 })];
			expect(areQueriesLoading(results)).toBe(true);
		});

		it("모두 로딩 완료되면 false를 반환해야 한다", () => {
			const results = [createSuccessResult({ id: 1 }), createSuccessResult({ id: 2 })];
			expect(areQueriesLoading(results)).toBe(false);
		});
	});

	describe("hasQueriesErrors", () => {
		it("에러가 있으면 true를 반환해야 한다", () => {
			const results = [createErrorResult("Failed"), createSuccessResult({ id: 1 })];
			expect(hasQueriesErrors(results)).toBe(true);
		});

		it("에러가 없으면 false를 반환해야 한다", () => {
			const results = [createSuccessResult({ id: 1 }), createSuccessResult({ id: 2 })];
			expect(hasQueriesErrors(results)).toBe(false);
		});
	});

	describe("getQueriesErrors", () => {
		it("모든 에러를 추출해야 한다", () => {
			const results = [
				createErrorResult("Error 1"),
				createSuccessResult({ id: 1 }),
				createErrorResult("Error 2"),
			];
			const errors = getQueriesErrors(results);
			expect(errors).toHaveLength(2);
			expect(errors[0].message).toBe("Error 1");
			expect(errors[1].message).toBe("Error 2");
		});

		it("에러가 없으면 빈 배열을 반환해야 한다", () => {
			const results = [createSuccessResult({ id: 1 })];
			expect(getQueriesErrors(results)).toEqual([]);
		});
	});

	describe("areQueriesComplete", () => {
		it("모든 쿼리가 완료되면 true를 반환해야 한다", () => {
			const results = [createSuccessResult({ id: 1 }), createSuccessResult({ id: 2 })];
			expect(areQueriesComplete(results)).toBe(true);
		});

		it("로딩 중인 쿼리가 있으면 false를 반환해야 한다", () => {
			const results = [createSuccessResult({ id: 1 }), createLoadingResult()];
			expect(areQueriesComplete(results)).toBe(false);
		});

		it("에러가 있으면 false를 반환해야 한다", () => {
			const results = [createSuccessResult({ id: 1 }), createErrorResult("Failed")];
			expect(areQueriesComplete(results)).toBe(false);
		});
	});

	describe("getAllQueriesData", () => {
		it("모든 쿼리 데이터를 추출해야 한다", () => {
			const results = [createSuccessResult({ id: 1 }), createSuccessResult({ id: 2 })];
			expect(getAllQueriesData(results)).toEqual([{ id: 1 }, { id: 2 }]);
		});

		it("데이터가 없는 쿼리는 undefined를 반환해야 한다", () => {
			const results = [createSuccessResult({ id: 1 }), createLoadingResult()];
			expect(getAllQueriesData(results)).toEqual([{ id: 1 }, undefined]);
		});
	});

	describe("refetchAllQueries", () => {
		it("모든 쿼리를 리패치해야 한다", async () => {
			const refetch1 = vi.fn().mockResolvedValue({ data: { id: 1 } });
			const refetch2 = vi.fn().mockResolvedValue({ data: { id: 2 } });

			const results: QueriesResult[] = [
				{ ...createSuccessResult({ id: 1 }), refetch: refetch1 },
				{ ...createSuccessResult({ id: 2 }), refetch: refetch2 },
			];

			await refetchAllQueries(results);

			expect(refetch1).toHaveBeenCalledTimes(1);
			expect(refetch2).toHaveBeenCalledTimes(1);
		});
	});
});
