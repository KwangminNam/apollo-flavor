import {  gql } from "@apollo/client";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Mutation } from "../Mutation";
import "@testing-library/jest-dom";

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $name: String!) {
    updateUser(id: $id, name: $name) {
      id
      name
    }
  }
`;

interface User {
	id: string;
	name: string;
}

interface UpdateUserData {
	updateUser: User;
}

interface UpdateUserVariables {
	id: string;
	name: string;
}

describe("Mutation Component", () => {
	// 콘솔 에러 억제
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	const renderMutation = (mocks: MockedResponse[] = [], variables?: UpdateUserVariables) => {
		return render(
			<MockedProvider mocks={mocks} addTypename={false}>
				<Mutation<UpdateUserData, UpdateUserVariables> 
					mutation={UPDATE_USER}
					variables={variables}
				>
					{({ mutate, data, loading, error, called, reset }) => (
						<div>
							<button
								type="button"
								onClick={() => mutate()}
								data-testid="update-button"
							>
								Update User
							</button>
							<button type="button" onClick={reset} data-testid="reset-button">
								Reset
							</button>
							{loading && <div data-testid="loading">Loading...</div>}
							{error && <div data-testid="error">Error: {error.message}</div>}
							{data && (
								<div data-testid="data">Updated: {data.updateUser.name}</div>
							)}
							{called && <div data-testid="called">Mutation called</div>}
						</div>
					)}
				</Mutation>
			</MockedProvider>,
		);
	};

	it("오류 없이 렌더링되어야 한다", () => {
		renderMutation();
		expect(screen.getByTestId("update-button")).toBeInTheDocument();
	});

	it("mutation이 진행 중일 때 로딩 상태를 보여줘야 한다", async () => {
		const variables = { id: "1", name: "Updated Name" };
		const mocks = [
			{
				request: {
					query: UPDATE_USER,
					variables,
				},
				result: {
					data: {
						updateUser: { id: "1", name: "Updated Name" },
					},
				},
				delay: 100,
			},
		];

		renderMutation(mocks, variables);
		fireEvent.click(screen.getByTestId("update-button"));
		expect(screen.getByTestId("loading")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
		});
	});

	it("성공적인 mutation 후 데이터를 보여줘야 한다", async () => {
		const variables = { id: "1", name: "Updated Name" };
		const mocks = [
			{
				request: {
					query: UPDATE_USER,
					variables,
				},
				result: {
					data: {
						updateUser: { id: "1", name: "Updated Name" },
					},
				},
				delay: 100,
			},
		];

		renderMutation(mocks, variables);
		fireEvent.click(screen.getByTestId("update-button"));

		await waitFor(() => {
			expect(screen.getByTestId("data")).toHaveTextContent(
				"Updated: Updated Name",
			);
		});
	});

	it("mutation이 트리거된 후 called 상태를 보여줘야 한다", async () => {
		const variables = { id: "1", name: "Updated Name" };
		const mocks = [
			{
				request: {
					query: UPDATE_USER,
					variables,
				},
				result: {
					data: {
						updateUser: { id: "1", name: "Updated Name" },
					},
				},
				delay: 100,
			},
		];

		renderMutation(mocks, variables);
		fireEvent.click(screen.getByTestId("update-button"));

		await waitFor(() => {
			expect(screen.getByTestId("called")).toBeInTheDocument();
		});
	});

	it("reset이 호출되면 mutation 상태를 초기화해야 한다", async () => {
		const variables = { id: "1", name: "Updated Name" };
		const mocks = [
			{
				request: {
					query: UPDATE_USER,
					variables,
				},
				result: {
					data: {
						updateUser: { id: "1", name: "Updated Name" },
					},
				},
				delay: 100,
			},
		];

		renderMutation(mocks, variables);
		fireEvent.click(screen.getByTestId("update-button"));

		await waitFor(() => {
			expect(screen.getByTestId("data")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("reset-button"));

		await waitFor(() => {
			expect(screen.queryByTestId("data")).not.toBeInTheDocument();
		});
	});

	it("mutation 옵션들을 지원해야 한다", async () => {
		const onCompletedMock = vi.fn();
		const onErrorMock = vi.fn();
		const variables = { id: "1", name: "Updated Name" };

		const mocks = [
			{
				request: {
					query: UPDATE_USER,
					variables,
				},
				result: {
					data: {
						updateUser: { id: "1", name: "Updated Name" },
					},
				},
				delay: 100,
			},
		];

		render(
			<MockedProvider mocks={mocks} addTypename={false}>
				<Mutation<UpdateUserData, UpdateUserVariables>
					mutation={UPDATE_USER}
					variables={variables}
					options={{
						onCompleted: onCompletedMock,
						onError: onErrorMock,
					}}
				>
					{({ mutate }) => (
						<button
							type="button"
							onClick={() => mutate()}
							data-testid="update-button"
						>
							Update User
						</button>
					)}
				</Mutation>
			</MockedProvider>,
		);

		fireEvent.click(screen.getByTestId("update-button"));

		await waitFor(() => {
			expect(onCompletedMock).toHaveBeenCalled();
		});
		expect(onErrorMock).not.toHaveBeenCalled();
	});
});
