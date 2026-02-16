import { gql } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Subscription } from "../Subscription";
import "@testing-library/jest-dom";

const ON_MESSAGE = gql`
  subscription OnMessage($channelId: ID!) {
    messageAdded(channelId: $channelId) {
      id
      text
      sender
    }
  }
`;

interface MessageData {
	messageAdded: {
		id: string;
		text: string;
		sender: string;
	};
}

interface MessageVariables {
	channelId: string;
}

// Mock useSubscription since MockedProvider doesn't support subscriptions well
vi.mock("@apollo/client", async () => {
	const actual = await vi.importActual("@apollo/client");
	return {
		...actual,
		useSubscription: vi.fn(),
	};
});

import { useSubscription } from "@apollo/client";
const mockUseSubscription = vi.mocked(useSubscription);

describe("Subscription Component", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockUseSubscription.mockReset();
	});

	it("로딩 상태를 보여줘야 한다", () => {
		mockUseSubscription.mockReturnValue({
			data: undefined,
			loading: true,
			error: undefined,
		} as ReturnType<typeof useSubscription>);

		render(
			<MockedProvider>
				<Subscription<MessageData, MessageVariables>
					subscription={ON_MESSAGE}
					variables={{ channelId: "1" }}
				>
					{({ data, loading }) => (
						<div>
							{loading && <div data-testid="loading">Loading...</div>}
							{data && <div data-testid="data">{data.messageAdded.text}</div>}
						</div>
					)}
				</Subscription>
			</MockedProvider>,
		);

		expect(screen.getByTestId("loading")).toBeInTheDocument();
	});

	it("데이터를 정상적으로 렌더링해야 한다", () => {
		mockUseSubscription.mockReturnValue({
			data: {
				messageAdded: {
					id: "1",
					text: "Hello!",
					sender: "Alice",
				},
			},
			loading: false,
			error: undefined,
		} as ReturnType<typeof useSubscription>);

		render(
			<MockedProvider>
				<Subscription<MessageData, MessageVariables>
					subscription={ON_MESSAGE}
					variables={{ channelId: "1" }}
				>
					{({ data, loading }) => (
						<div>
							{loading && <div data-testid="loading">Loading...</div>}
							{data && <div data-testid="data">{data.messageAdded.text}</div>}
						</div>
					)}
				</Subscription>
			</MockedProvider>,
		);

		expect(screen.getByTestId("data")).toHaveTextContent("Hello!");
	});

	it("에러 상태를 보여줘야 한다", () => {
		mockUseSubscription.mockReturnValue({
			data: undefined,
			loading: false,
			error: new Error("Subscription failed"),
		} as ReturnType<typeof useSubscription>);

		render(
			<MockedProvider>
				<Subscription<MessageData, MessageVariables>
					subscription={ON_MESSAGE}
					variables={{ channelId: "1" }}
				>
					{({ error, loading }) => (
						<div>
							{loading && <div data-testid="loading">Loading...</div>}
							{error && (
								<div data-testid="error">Error: {error.message}</div>
							)}
						</div>
					)}
				</Subscription>
			</MockedProvider>,
		);

		expect(screen.getByTestId("error")).toHaveTextContent(
			"Error: Subscription failed",
		);
	});

	it("variables를 올바르게 전달해야 한다", () => {
		mockUseSubscription.mockReturnValue({
			data: undefined,
			loading: true,
			error: undefined,
		} as ReturnType<typeof useSubscription>);

		render(
			<MockedProvider>
				<Subscription<MessageData, MessageVariables>
					subscription={ON_MESSAGE}
					variables={{ channelId: "42" }}
				>
					{({ loading }) => (
						<div>{loading && <span data-testid="loading">Loading...</span>}</div>
					)}
				</Subscription>
			</MockedProvider>,
		);

		expect(mockUseSubscription).toHaveBeenCalledWith(
			ON_MESSAGE,
			expect.objectContaining({ variables: { channelId: "42" } }),
		);
	});

	it("options를 올바르게 전달해야 한다", () => {
		mockUseSubscription.mockReturnValue({
			data: undefined,
			loading: true,
			error: undefined,
		} as ReturnType<typeof useSubscription>);

		render(
			<MockedProvider>
				<Subscription<MessageData, MessageVariables>
					subscription={ON_MESSAGE}
					variables={{ channelId: "1" }}
					options={{ fetchPolicy: "no-cache" }}
				>
					{({ loading }) => (
						<div>{loading && <span data-testid="loading">Loading...</span>}</div>
					)}
				</Subscription>
			</MockedProvider>,
		);

		expect(mockUseSubscription).toHaveBeenCalledWith(
			ON_MESSAGE,
			expect.objectContaining({
				variables: { channelId: "1" },
				fetchPolicy: "no-cache",
			}),
		);
	});

	it("children render prop에 전체 result를 전달해야 한다", () => {
		const mockResult = {
			data: {
				messageAdded: { id: "1", text: "Test", sender: "Bob" },
			},
			loading: false,
			error: undefined,
		} as ReturnType<typeof useSubscription>;

		mockUseSubscription.mockReturnValue(mockResult);

		const childrenFn = vi.fn().mockReturnValue(<div>rendered</div>);

		render(
			<MockedProvider>
				<Subscription<MessageData, MessageVariables>
					subscription={ON_MESSAGE}
					variables={{ channelId: "1" }}
				>
					{childrenFn}
				</Subscription>
			</MockedProvider>,
		);

		expect(childrenFn).toHaveBeenCalledWith(
			expect.objectContaining({
				data: mockResult.data,
				loading: false,
			}),
		);
	});
});
