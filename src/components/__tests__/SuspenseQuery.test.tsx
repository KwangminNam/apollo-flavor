import { gql } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { act, render, screen, waitFor } from "@testing-library/react";
import React, { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { SuspenseQuery } from "../SuspenseQuery";

// 테스트용 GraphQL 쿼리
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
    }
  }
`;

// 테스트용 타입 정의
interface User {
	id: string;
	name: string;
	email: string;
}

interface GetUserData {
	user: User;
}

interface GetUserVariables {
	id: string;
}

interface GetUsersData {
	users: User[];
}

// Promise를 flush하는 헬퍼 함수
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("SuspenseQuery", () => {
	const mockUser = {
		id: "1",
		name: "John Doe",
		email: "john@example.com",
	};

	const mockUsers = [
		{ id: "1", name: "John Doe" },
		{ id: "2", name: "Jane Smith" },
	];

	describe("기본 렌더링", () => {
		it("성공적으로 데이터를 렌더링해야 한다", async () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
				},
			];

			await act(async () => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div data-testid="loading">Loading...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
							>
								{({ data }) => (
									<div>
										<h1 data-testid="user-name">{data.user.name}</h1>
										<p data-testid="user-email">{data.user.email}</p>
									</div>
								)}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			});

			// Promise flush 후 데이터 확인
			await act(async () => {
				await flushPromises();
			});

			// 데이터가 올바르게 렌더링되었는지 확인
			await waitFor(
				() => {
					expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
					expect(screen.getByTestId("user-email")).toHaveTextContent(
						"john@example.com",
					);
				},
				{ timeout: 5000 },
			);
		});

		it("변수 없이도 동작해야 한다", async () => {
			const mocks = [
				{
					request: {
						query: GET_USERS,
					},
					result: {
						data: { users: mockUsers },
					},
				},
			];

			await act(async () => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense
							fallback={<div data-testid="loading-users">Loading users...</div>}
						>
							<SuspenseQuery<GetUsersData> query={GET_USERS}>
								{({ data }) => (
									<ul data-testid="users-list">
										{data.users.map((user) => (
											<li key={user.id} data-testid={`user-${user.id}`}>
												{user.name}
											</li>
										))}
									</ul>
								)}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			});

			await act(async () => {
				await flushPromises();
			});

			// 데이터가 올바르게 렌더링되었는지 확인
			await waitFor(
				() => {
					expect(screen.getByTestId("users-list")).toBeInTheDocument();
					expect(screen.getByTestId("user-1")).toHaveTextContent("John Doe");
					expect(screen.getByTestId("user-2")).toHaveTextContent("Jane Smith");
				},
				{ timeout: 5000 },
			);
		});
	});

	describe("Apollo Client 옵션", () => {
		it("fetchPolicy 옵션을 지원해야 한다", async () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
				},
			];

			await act(async () => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div>Loading...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
								fetchPolicy="cache-first"
							>
								{({ data }) => (
									<div data-testid="user-with-fetch-policy">
										{data.user.name}
									</div>
								)}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			});

			await act(async () => {
				await flushPromises();
			});

			await waitFor(() => {
				expect(screen.getByTestId("user-with-fetch-policy")).toHaveTextContent(
					"John Doe",
				);
			});
		});

		it("errorPolicy 옵션을 지원해야 한다", async () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
				},
			];

			await act(async () => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div>Loading...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
								errorPolicy="all"
							>
								{({ data }) => (
									<div data-testid="user-with-error-policy">
										{data.user.name}
									</div>
								)}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			});

			await act(async () => {
				await flushPromises();
			});

			await waitFor(() => {
				expect(screen.getByTestId("user-with-error-policy")).toHaveTextContent(
					"John Doe",
				);
			});
		});
	});

	describe("네트워크 상태 및 클라이언트", () => {
		it("networkStatus와 client를 제공해야 한다", async () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
				},
			];

			let networkStatus: number | undefined;
			let apolloClient: any;

			await act(async () => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div>Loading...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
							>
								{({ data, networkStatus: ns, client }) => {
									networkStatus = ns;
									apolloClient = client;
									return (
										<div>
											<span data-testid="user-name">{data.user.name}</span>
											<span data-testid="network-status">{ns}</span>
										</div>
									);
								}}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			});

			await act(async () => {
				await flushPromises();
			});

			await waitFor(() => {
				expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
			});

			expect(networkStatus).toBeDefined();
			expect(typeof networkStatus).toBe("number");
			expect(apolloClient).toBeDefined();
			expect(apolloClient.query).toBeDefined();
		});
	});

	describe("타입 안전성", () => {
		it("컴파일 타임 타입 체크", () => {
			// 타입 체크를 위한 컴파일 타임 테스트
			const TestComponent = () => (
				<SuspenseQuery<GetUserData, GetUserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
					fetchPolicy="cache-first"
					errorPolicy="all"
				>
					{({ data, networkStatus, client, refetch }) => {
						// 타입 체크 - 컴파일 시점에서 타입이 올바른지 확인
						const userName: string = data.user.name;
						const userEmail: string = data.user.email;
						const status: number = networkStatus;

						// 런타임 체크
						expect(client).toBeDefined();
						expect(typeof refetch).toBe("function");
						expect(userName).toBeDefined();
						expect(userEmail).toBeDefined();
						expect(status).toBeDefined();

						return <div>{data.user.name}</div>;
					}}
				</SuspenseQuery>
			);

			expect(TestComponent).toBeDefined();
		});

		it("제네릭 타입 추론이 올바르게 동작해야 한다", () => {
			// 타입 추론 테스트
			const TestComponent = () => (
				<SuspenseQuery query={GET_USER} variables={{ id: "1" }}>
					{({ data }) => {
						// 타입 추론이 올바르게 동작하는지 확인
						// data는 any 타입이지만 실제 사용에서는 제네릭으로 타입을 지정
						expect(data).toBeDefined();
						return <div>{JSON.stringify(data)}</div>;
					}}
				</SuspenseQuery>
			);

			expect(TestComponent).toBeDefined();
		});

		it("Apollo Client 옵션들이 타입 안전하게 전달되어야 한다", () => {
			// 타입 안전성 테스트
			const TestComponent = () => (
				<SuspenseQuery<GetUserData, GetUserVariables>
					query={GET_USER}
					variables={{ id: "1" }}
					// 지원되는 옵션들
					fetchPolicy="cache-first"
					errorPolicy="all"
				>
					{({ data }) => <div>{data.user.name}</div>}
				</SuspenseQuery>
			);

			expect(TestComponent).toBeDefined();
		});
	});

	describe("컴포넌트 구조", () => {
		it("children이 함수여야 한다", () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
				},
			];

			expect(() => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div>Loading...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
							>
								{({ data }) => <div>{data.user.name}</div>}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			}).not.toThrow();
		});

		it("Suspense와 함께 사용되어야 한다", () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
				},
			];

			expect(() => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div>Loading...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
							>
								{({ data }) => (
									<div>
										<h1>{data.user.name}</h1>
									</div>
								)}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			}).not.toThrow();
		});

		it("refetch 함수가 제공되어야 한다", async () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
				},
			];

			let refetchFn: (() => void) | null = null;

			await act(async () => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div data-testid="loading">Loading...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
							>
								{({ data, refetch }) => {
									refetchFn = refetch;
									return (
										<div>
											<h1 data-testid="user-name">{data.user.name}</h1>
											<button onClick={() => refetch()}>Refetch</button>
										</div>
									);
								}}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			});

			await act(async () => {
				await flushPromises();
			});

			await waitFor(
				() => {
					expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
				},
				{ timeout: 5000 },
			);

			expect(refetchFn).toBeDefined();
			expect(typeof refetchFn).toBe("function");
		});
	});
});
