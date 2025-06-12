import { gql, type ApolloClient } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { act, render, screen, waitFor } from "@testing-library/react";
import  React, { Suspense } from "react";
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
			let apolloClient: ApolloClient<unknown> | undefined;

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
			expect(apolloClient?.query).toBeDefined();
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
											<button type="button" onClick={() => refetch()}>Refetch</button>
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

	describe("Suspense 로딩 상태 및 데이터 전환", () => {
		it("로딩 상태가 표시되고 데이터로 전환되어야 한다", async () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
					delay: 200, // 로딩 상태를 확인하기 위한 지연
				},
			];

			await act(async () => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div data-testid="suspense-loading">Loading user data...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
							>
								{({ data }) => (
									<div data-testid="user-content">
										<h1 data-testid="user-name">{data.user.name}</h1>
										<p data-testid="user-email">{data.user.email}</p>
									</div>
								)}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			});

			// 초기에는 로딩 상태가 표시되어야 함
			expect(screen.getByTestId("suspense-loading")).toBeInTheDocument();
			expect(screen.getByTestId("suspense-loading")).toHaveTextContent("Loading user data...");

			// 데이터가 없는 상태에서는 user-content가 없어야 함
			expect(screen.queryByTestId("user-content")).not.toBeInTheDocument();

			// 데이터 로딩 완료 후 실제 데이터가 표시되어야 함
			await act(async () => {
				await flushPromises();
			});

			await waitFor(
				() => {
					expect(screen.getByTestId("user-content")).toBeInTheDocument();
					expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
					expect(screen.getByTestId("user-email")).toHaveTextContent("john@example.com");
				},
				{ timeout: 3000 }
			);

			// 로딩 상태는 사라져야 함
			expect(screen.queryByTestId("suspense-loading")).not.toBeInTheDocument();
		});

		it("여러 쿼리의 로딩 상태를 독립적으로 관리해야 한다", async () => {
			const userMocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
					delay: 100,
				},
			];

			const usersMocks = [
				{
					request: {
						query: GET_USERS,
					},
					result: {
						data: { users: mockUsers },
					},
					delay: 300, // 더 긴 지연
				},
			];

			await act(async () => {
				render(
					<MockedProvider mocks={[...userMocks, ...usersMocks]} addTypename={false}>
						<div>
							{/* 첫 번째 쿼리 */}
							<Suspense fallback={<div data-testid="user-loading">Loading single user...</div>}>
								<SuspenseQuery<GetUserData, GetUserVariables>
									query={GET_USER}
									variables={{ id: "1" }}
								>
									{({ data }) => (
										<div data-testid="single-user">
											<span data-testid="single-user-name">{data.user.name}</span>
										</div>
									)}
								</SuspenseQuery>
							</Suspense>

							{/* 두 번째 쿼리 */}
							<Suspense fallback={<div data-testid="users-loading">Loading users list...</div>}>
								<SuspenseQuery<GetUsersData>
									query={GET_USERS}
								>
									{({ data }) => (
										<div data-testid="users-list">
											{data.users.map((user) => (
												<span key={user.id} data-testid={`user-${user.id}`}>
													{user.name}
												</span>
											))}
										</div>
									)}
								</SuspenseQuery>
							</Suspense>
						</div>
					</MockedProvider>,
				);
			});

			// 초기에는 둘 다 로딩 상태
			expect(screen.getByTestId("user-loading")).toBeInTheDocument();
			expect(screen.getByTestId("users-loading")).toBeInTheDocument();

			// 첫 번째 쿼리가 먼저 완료됨 (100ms 후)
			await act(async () => {
				await flushPromises();
			});

			await waitFor(
				() => {
					expect(screen.getByTestId("single-user")).toBeInTheDocument();
					expect(screen.getByTestId("single-user-name")).toHaveTextContent("John Doe");
				},
				{ timeout: 2000 }
			);

			// 첫 번째는 완료되었지만 두 번째는 아직 로딩 중일 수 있음
			expect(screen.queryByTestId("user-loading")).not.toBeInTheDocument();
			
			// 두 번째 쿼리 완료 대기
			await act(async () => {
				await flushPromises();
			});

			await waitFor(
				() => {
					expect(screen.getByTestId("users-list")).toBeInTheDocument();
					expect(screen.getByTestId("user-1")).toHaveTextContent("John Doe");
					expect(screen.getByTestId("user-2")).toHaveTextContent("Jane Smith");
				},
				{ timeout: 2000 }
			);

			// 모든 로딩 상태가 사라짐
			expect(screen.queryByTestId("user-loading")).not.toBeInTheDocument();
			expect(screen.queryByTestId("users-loading")).not.toBeInTheDocument();
		});

		it("네트워크 지연 시 적절한 시간 동안 로딩 상태를 유지해야 한다", async () => {
			const mocks = [
				{
					request: {
						query: GET_USER,
						variables: { id: "1" },
					},
					result: {
						data: { user: mockUser },
					},
					delay: 500, // 500ms 지연
				},
			];

			const startTime = Date.now();

			await act(async () => {
				render(
					<MockedProvider mocks={mocks} addTypename={false}>
						<Suspense fallback={<div data-testid="network-loading">Loading with network delay...</div>}>
							<SuspenseQuery<GetUserData, GetUserVariables>
								query={GET_USER}
								variables={{ id: "1" }}
							>
								{({ data }) => (
									<div data-testid="delayed-content">
										<span data-testid="delayed-user-name">{data.user.name}</span>
									</div>
								)}
							</SuspenseQuery>
						</Suspense>
					</MockedProvider>,
				);
			});

			// 로딩 상태 확인
			expect(screen.getByTestId("network-loading")).toBeInTheDocument();

			// 최소 300ms 동안은 로딩 상태가 유지되어야 함
			await new Promise(resolve => setTimeout(resolve, 300));
			expect(screen.getByTestId("network-loading")).toBeInTheDocument();
			expect(screen.queryByTestId("delayed-content")).not.toBeInTheDocument();

			// 데이터 로딩 완료 대기
			await act(async () => {
				await flushPromises();
			});

			await waitFor(
				() => {
					expect(screen.getByTestId("delayed-content")).toBeInTheDocument();
					expect(screen.getByTestId("delayed-user-name")).toHaveTextContent("John Doe");
				},
				{ timeout: 3000 }
			);

			const endTime = Date.now();
			const loadingDuration = endTime - startTime;

			// 로딩이 최소 400ms 이상 지속되었는지 확인 (500ms 지연 - 여유분)
			expect(loadingDuration).toBeGreaterThan(400);

			// 로딩 상태가 사라졌는지 확인
			expect(screen.queryByTestId("network-loading")).not.toBeInTheDocument();
		});
	});
});
