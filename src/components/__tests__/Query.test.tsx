import { gql } from "@apollo/client";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Query } from "../Query";
import "@testing-library/jest-dom";

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

interface UserData {
	user: {
		id: string;
		name: string;
		email: string;
	};
}

interface UserVariables {
	id: string;
}

describe("Query Component", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	const defaultMocks: MockedResponse[] = [
		{
			request: {
				query: GET_USER,
				variables: { id: "1" },
			},
			result: {
				data: {
					user: { id: "1", name: "John Doe", email: "john@example.com" },
				},
			},
		},
	];

	it("오류 없이 렌더링되어야 한다", () => {
		render(
			<MockedProvider mocks={defaultMocks} addTypename={false}>
				<Query<UserData, UserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
				>
					{({ data, loading }) => (
						<div>
							{loading && <div data-testid="loading">Loading...</div>}
							{data && <div data-testid="data">{data.user.name}</div>}
						</div>
					)}
				</Query>
			</MockedProvider>,
		);
		expect(screen.getByTestId("loading")).toBeInTheDocument();
	});

	it("로딩 상태를 보여줘야 한다", () => {
		render(
			<MockedProvider mocks={defaultMocks} addTypename={false}>
				<Query<UserData, UserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
				>
					{({ loading }) => (
						<div>{loading && <span data-testid="loading">Loading...</span>}</div>
					)}
				</Query>
			</MockedProvider>,
		);
		expect(screen.getByTestId("loading")).toBeInTheDocument();
	});

	it("데이터를 정상적으로 렌더링해야 한다", async () => {
		render(
			<MockedProvider mocks={defaultMocks} addTypename={false}>
				<Query<UserData, UserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
				>
					{({ data, loading }) => (
						<div>
							{loading && <div data-testid="loading">Loading...</div>}
							{data && <div data-testid="data">{data.user.name}</div>}
						</div>
					)}
				</Query>
			</MockedProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("data")).toHaveTextContent("John Doe");
		});
	});

	it("에러 상태를 보여줘야 한다", async () => {
		const errorMocks: MockedResponse[] = [
			{
				request: {
					query: GET_USER,
					variables: { id: "1" },
				},
				error: new Error("Network error"),
			},
		];

		render(
			<MockedProvider mocks={errorMocks} addTypename={false}>
				<Query<UserData, UserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
				>
					{({ error, loading }) => (
						<div>
							{loading && <div data-testid="loading">Loading...</div>}
							{error && (
								<div data-testid="error">Error: {error.message}</div>
							)}
						</div>
					)}
				</Query>
			</MockedProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("error")).toBeInTheDocument();
		});
	});

	it("variables를 올바르게 전달해야 한다", async () => {
		const mocks: MockedResponse[] = [
			{
				request: {
					query: GET_USER,
					variables: { id: "42" },
				},
				result: {
					data: {
						user: {
							id: "42",
							name: "Alice",
							email: "alice@example.com",
						},
					},
				},
			},
		];

		render(
			<MockedProvider mocks={mocks} addTypename={false}>
				<Query<UserData, UserVariables>
					query={GET_USER}
					variables={{ id: "42" }}
				>
					{({ data, loading }) => (
						<div>
							{loading && <div data-testid="loading">Loading...</div>}
							{data && <div data-testid="data">{data.user.name}</div>}
						</div>
					)}
				</Query>
			</MockedProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("data")).toHaveTextContent("Alice");
		});
	});

	it("options (fetchPolicy 등)를 지원해야 한다", async () => {
		render(
			<MockedProvider mocks={defaultMocks} addTypename={false}>
				<Query<UserData, UserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
					options={{ fetchPolicy: "network-only" }}
				>
					{({ data, loading }) => (
						<div>
							{loading && <div data-testid="loading">Loading...</div>}
							{data && <div data-testid="data">{data.user.name}</div>}
						</div>
					)}
				</Query>
			</MockedProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("data")).toHaveTextContent("John Doe");
		});
	});

	it("refetch를 제공해야 한다", async () => {
		let refetchFn: (() => void) | null = null;
		const mocks: MockedResponse[] = [
			{
				request: {
					query: GET_USER,
					variables: { id: "1" },
				},
				result: {
					data: {
						user: {
							id: "1",
							name: "John Doe",
							email: "john@example.com",
						},
					},
				},
			},
			{
				request: {
					query: GET_USER,
					variables: { id: "1" },
				},
				result: {
					data: {
						user: {
							id: "1",
							name: "John Updated",
							email: "john@example.com",
						},
					},
				},
			},
		];

		render(
			<MockedProvider mocks={mocks} addTypename={false}>
				<Query<UserData, UserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
				>
					{({ data, loading, refetch }) => {
						refetchFn = () => refetch();
						return (
							<div>
								{loading && <div data-testid="loading">Loading...</div>}
								{data && <div data-testid="data">{data.user.name}</div>}
								<button
									type="button"
									data-testid="refetch-button"
									onClick={() => refetch()}
								>
									Refetch
								</button>
							</div>
						);
					}}
				</Query>
			</MockedProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("data")).toHaveTextContent("John Doe");
		});

		expect(refetchFn).not.toBeNull();
	});

	it("로딩 완료 후 loading이 false가 되어야 한다", async () => {
		render(
			<MockedProvider mocks={defaultMocks} addTypename={false}>
				<Query<UserData, UserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
				>
					{({ loading }) => (
						<div data-testid="loading-state">
							{loading ? "true" : "false"}
						</div>
					)}
				</Query>
			</MockedProvider>,
		);

		expect(screen.getByTestId("loading-state")).toHaveTextContent("true");

		await waitFor(() => {
			expect(screen.getByTestId("loading-state")).toHaveTextContent("false");
		});
	});
});
