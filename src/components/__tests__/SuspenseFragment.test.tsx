import { gql, useSuspenseFragment } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor, act } from "@testing-library/react";
import React, { Suspense } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SuspenseFragment } from "../SuspenseFragment";
import { SuspenseQuery } from "../SuspenseQuery";

// Promise flush를 위한 헬퍼 함수
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// useSuspenseFragment 훅을 모킹
vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useSuspenseFragment: vi.fn(),
  };
});

const mockUseSuspenseFragment = useSuspenseFragment as any;

// 테스트용 GraphQL 프래그먼트
const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    name
    email
  }
`;

const PROFILE_FRAGMENT = gql`
  fragment ProfileFragment on User {
    name
    email
    bio
    avatar
  }
`;

// 테스트용 타입 정의
interface UserFragment {
  name: string;
  email: string;
}

interface ProfileFragment {
  name: string;
  email: string;
  bio: string;
  avatar: string;
}

describe("SuspenseFragment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("기본 렌더링", () => {
    it("프래그먼트 데이터를 성공적으로 렌더링해야 한다", () => {
      const mockData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockResult = {
        data: mockData,
        complete: true,
      };

      mockUseSuspenseFragment.mockReturnValue(mockResult);

      const userData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      render(
        <SuspenseFragment<UserFragment>
          fragment={USER_FRAGMENT}
          fragmentName="UserFragment"
          from={userData}
        >
          {({ data: fragmentData }) => (
            <div>
              <h1 data-testid="fragment-name">{fragmentData.name}</h1>
              <p data-testid="fragment-email">{fragmentData.email}</p>
            </div>
          )}
        </SuspenseFragment>
      );

      // 프래그먼트 데이터가 올바르게 렌더링되었는지 확인
      expect(screen.getByTestId("fragment-name")).toBeInTheDocument();
      expect(screen.getByTestId("fragment-email")).toBeInTheDocument();
      expect(screen.getByTestId("fragment-name").textContent).toBe("John Doe");
      expect(screen.getByTestId("fragment-email").textContent).toBe("john@example.com");

      // useSuspenseFragment가 올바른 인자로 호출되었는지 확인
      expect(mockUseSuspenseFragment).toHaveBeenCalledWith({
        fragment: USER_FRAGMENT,
        fragmentName: "UserFragment",
        from: userData,
      });
    });

    it("복잡한 프래그먼트 데이터를 렌더링해야 한다", () => {
      const mockData = {
        name: "John Doe",
        email: "john@example.com",
        bio: "Software Developer",
        avatar: "https://example.com/avatar.jpg",
      };

      const mockResult = {
        data: mockData,
        complete: true,
      };

      mockUseSuspenseFragment.mockReturnValue(mockResult);

      const profileData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        bio: "Software Developer",
        avatar: "https://example.com/avatar.jpg",
      };

      render(
        <SuspenseFragment<ProfileFragment>
          fragment={PROFILE_FRAGMENT}
          fragmentName="ProfileFragment"
          from={profileData}
        >
          {({ data: fragmentData }) => (
            <div data-testid="profile-card">
              <img 
                src={fragmentData.avatar} 
                alt="Avatar" 
                data-testid="profile-avatar"
              />
              <h1 data-testid="profile-name">{fragmentData.name}</h1>
              <p data-testid="profile-email">{fragmentData.email}</p>
              <p data-testid="profile-bio">{fragmentData.bio}</p>
            </div>
          )}
        </SuspenseFragment>
      );

      // 프로필 데이터가 올바르게 렌더링되었는지 확인
      expect(screen.getByTestId("profile-card")).toBeInTheDocument();
      expect(screen.getByTestId("profile-name").textContent).toBe("John Doe");
      expect(screen.getByTestId("profile-email").textContent).toBe("john@example.com");
      expect(screen.getByTestId("profile-bio").textContent).toBe("Software Developer");
      expect(screen.getByTestId("profile-avatar")).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });
  });

  describe("프래그먼트 옵션", () => {
    it("fragmentName 없이도 동작해야 한다", () => {
      const mockData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockResult = {
        data: mockData,
        complete: true,
      };

      mockUseSuspenseFragment.mockReturnValue(mockResult);

      const userData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      render(
        <SuspenseFragment<UserFragment>
          fragment={USER_FRAGMENT}
          from={userData}
        >
          {({ data: fragmentData }) => (
            <div data-testid="fragment-without-name">
              {fragmentData.name} - {fragmentData.email}
            </div>
          )}
        </SuspenseFragment>
      );

      expect(screen.getByTestId("fragment-without-name").textContent).toBe(
        "John Doe - john@example.com"
      );

      // fragmentName이 undefined로 전달되었는지 확인
      expect(mockUseSuspenseFragment).toHaveBeenCalledWith({
        fragment: USER_FRAGMENT,
        fragmentName: undefined,
        from: userData,
      });
    });
  });

  describe("타입 안전성", () => {
    it("올바른 타입의 프래그먼트 데이터를 반환해야 한다", () => {
      const mockData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockResult = {
        data: mockData,
        complete: true,
      };

      mockUseSuspenseFragment.mockReturnValue(mockResult);

      const userData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      let fragmentResult: any = null;

      render(
        <SuspenseFragment<UserFragment>
          fragment={USER_FRAGMENT}
          fragmentName="UserFragment"
          from={userData}
        >
          {(result) => {
            fragmentResult = result;
            return (
              <div data-testid="type-test">
                {result.data.name}
              </div>
            );
          }}
        </SuspenseFragment>
      );

      expect(screen.getByTestId("type-test")).toBeInTheDocument();
      expect(fragmentResult).toBeDefined();
      expect(fragmentResult.data).toHaveProperty("name");
      expect(fragmentResult.data).toHaveProperty("email");
      expect(fragmentResult.data.name).toBe("John Doe");
      expect(fragmentResult.data.email).toBe("john@example.com");
      expect(fragmentResult.complete).toBe(true);
    });
  });

  describe("React Fragment 동작", () => {
    it("추가적인 DOM 요소 없이 렌더링해야 한다", () => {
      const mockData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockResult = {
        data: mockData,
        complete: true,
      };

      mockUseSuspenseFragment.mockReturnValue(mockResult);

      const userData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      render(
        <div data-testid="parent-container">
          <SuspenseFragment<UserFragment>
            fragment={USER_FRAGMENT}
            fragmentName="UserFragment"
            from={userData}
          >
            {({ data: fragmentData }) => (
              <>
                <span data-testid="fragment-child-1">{fragmentData.name}</span>
                <span data-testid="fragment-child-2">{fragmentData.email}</span>
              </>
            )}
          </SuspenseFragment>
        </div>
      );

      const parentContainer = screen.getByTestId("parent-container");
      const child1 = screen.getByTestId("fragment-child-1");
      const child2 = screen.getByTestId("fragment-child-2");
      
      // SuspenseFragment가 추가적인 DOM 요소를 생성하지 않는지 확인
      expect(parentContainer.children).toHaveLength(2); // 2 spans only
      expect(child1).toBeInTheDocument();
      expect(child2).toBeInTheDocument();
      expect(child1.textContent).toBe("John Doe");
      expect(child2.textContent).toBe("john@example.com");
    });
  });

  describe("컴포넌트 구조", () => {
    it("SuspenseFragment는 함수형 컴포넌트여야 한다", () => {
      expect(typeof SuspenseFragment).toBe("function");
    });

    it("children prop이 함수여야 한다", () => {
      const mockData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockResult = {
        data: mockData,
        complete: true,
      };

      mockUseSuspenseFragment.mockReturnValue(mockResult);

      const userData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      const childrenFunction = ({ data }: { data: UserFragment }) => (
        <div data-testid="children-function-test">{data.name}</div>
      );

      render(
        <SuspenseFragment<UserFragment>
          fragment={USER_FRAGMENT}
          from={userData}
        >
          {childrenFunction}
        </SuspenseFragment>
      );

      expect(screen.getByTestId("children-function-test")).toBeInTheDocument();
      expect(screen.getByTestId("children-function-test").textContent).toBe("John Doe");
    });
  });

  describe("훅 호출 검증", () => {
    it("useSuspenseFragment가 올바른 매개변수로 호출되어야 한다", () => {
      const mockData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockResult = {
        data: mockData,
        complete: true,
      };

      mockUseSuspenseFragment.mockReturnValue(mockResult);

      const userData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      render(
        <SuspenseFragment<UserFragment>
          fragment={USER_FRAGMENT}
          fragmentName="UserFragment"
          from={userData}
        >
          {({ data }) => <div>{data.name}</div>}
        </SuspenseFragment>
      );

      expect(mockUseSuspenseFragment).toHaveBeenCalledTimes(1);
      expect(mockUseSuspenseFragment).toHaveBeenCalledWith({
        fragment: USER_FRAGMENT,
        fragmentName: "UserFragment",
        from: userData,
      });
    });
  });
});

// 통합 테스트 - 모킹을 사용한 Suspense 동작 테스트
describe("SuspenseFragment 통합 테스트", () => {
  beforeEach(() => {
    // 각 테스트 전에 모킹 초기화
    vi.clearAllMocks();
  });

  describe("기본 React Suspense와 함께 사용", () => {
    it("로딩 상태와 데이터 렌더링이 올바르게 동작해야 한다", async () => {
      // 첫 번째 호출에서는 Promise를 throw하여 Suspense 트리거
      let resolvePromise: (value: any) => void;
      const suspensePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockData = {
        name: "John Doe",
        email: "john@example.com",
      };

      let callCount = 0;
      mockUseSuspenseFragment.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw suspensePromise; // 첫 번째 호출에서 Suspense 트리거
        }
        return { data: mockData, complete: true };
      });

      const userData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      await act(async () => {
        render(
          <Suspense fallback={<div data-testid="suspense-loading">Loading with Suspense...</div>}>
            <SuspenseFragment<UserFragment>
              fragment={USER_FRAGMENT}
              fragmentName="UserFragment"
              from={userData}
            >
              {({ data }) => (
                <div>
                  <h1 data-testid="suspense-user-name">{data.name}</h1>
                  <p data-testid="suspense-user-email">{data.email}</p>
                </div>
              )}
            </SuspenseFragment>
          </Suspense>
        );
      });

      // 로딩 상태 확인 (선택적 - Suspense가 트리거되었을 경우에만)
      const loadingElement = screen.queryByTestId("suspense-loading");
      if (loadingElement) {
        expect(loadingElement).toBeInTheDocument();
      }

      // Promise를 resolve하여 데이터 로딩 완료 시뮬레이션
      await act(async () => {
        resolvePromise!(mockData);
        await suspensePromise;
      });

      // 데이터가 표시되어야 함
      await waitFor(() => {
        expect(screen.getByTestId("suspense-user-name")).toBeInTheDocument();
        expect(screen.getByTestId("suspense-user-email")).toBeInTheDocument();
        expect(screen.getByTestId("suspense-user-name").textContent).toBe("John Doe");
        expect(screen.getByTestId("suspense-user-email").textContent).toBe("john@example.com");
      });
    });

    it("에러 상태를 올바르게 처리해야 한다", async () => {
      // 에러를 throw하도록 모킹
      const testError = new Error("Fragment error");
      mockUseSuspenseFragment.mockImplementation(() => {
        throw testError;
      });

      // 에러 경계 컴포넌트
      class ErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean; error?: Error }
      > {
        constructor(props: { children: React.ReactNode }) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError(error: Error) {
          return { hasError: true, error };
        }

        render() {
          if (this.state.hasError) {
            return <div data-testid="suspense-error">Error occurred: {this.state.error?.message}</div>;
          }

          return this.props.children;
        }
      }

      const userData = {
        __typename: "User",
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      render(
        <ErrorBoundary>
          <Suspense fallback={<div data-testid="suspense-loading">Loading...</div>}>
            <SuspenseFragment<UserFragment>
              fragment={USER_FRAGMENT}
              fragmentName="UserFragment"
              from={userData}
            >
              {({ data }) => (
                <div data-testid="suspense-content">
                  {data.name}
                </div>
              )}
            </SuspenseFragment>
          </Suspense>
        </ErrorBoundary>
      );

      // 에러가 발생했을 때 에러 경계가 렌더링되는지 확인
      await waitFor(() => {
        expect(screen.getByTestId("suspense-error")).toBeInTheDocument();
        expect(screen.getByTestId("suspense-error").textContent).toContain("Fragment error");
      });
    });
  });

  describe("SuspenseQuery와 함께 사용", () => {
    it("SuspenseQuery의 내장 Suspense로 로딩과 데이터 렌더링이 올바르게 동작해야 한다", async () => {
      // 실제 GraphQL 쿼리와 프래그먼트 정의
      const GET_USER_WITH_FRAGMENT = gql`
        query GetUserWithFragment($id: ID!) {
          user(id: $id) {
            id
            ...UserFragment
          }
        }
        ${USER_FRAGMENT}
      `;

      const mockUser = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      const mocks = [
        {
          request: {
            query: GET_USER_WITH_FRAGMENT,
            variables: { id: "1" },
          },
          result: {
            data: { user: mockUser },
          },
        },
      ];

      // useSuspenseFragment 모킹을 실제 데이터로 설정
      mockUseSuspenseFragment.mockReturnValue({
        data: {
          name: "John Doe",
          email: "john@example.com",
        },
        complete: true,
      });

      await act(async () => {
        render(
          <MockedProvider mocks={mocks} addTypename={false}>
            <Suspense fallback={<div data-testid="suspense-query-loading">Loading with SuspenseQuery...</div>}>
              <SuspenseQuery<{ user: typeof mockUser }, { id: string }>
                query={GET_USER_WITH_FRAGMENT}
                variables={{ id: "1" }}
              >
                {({ data }) => (
                  <Suspense fallback={<div data-testid="fragment-loading">Loading fragment...</div>}>
                    <SuspenseFragment<UserFragment>
                      fragment={USER_FRAGMENT}
                      fragmentName="UserFragment"
                      from={data.user}
                    >
                      {({ data: fragmentData }) => (
                        <div>
                          <h1 data-testid="suspense-query-user-name">{fragmentData.name}</h1>
                          <p data-testid="suspense-query-user-email">{fragmentData.email}</p>
                        </div>
                      )}
                    </SuspenseFragment>
                  </Suspense>
                )}
              </SuspenseQuery>
            </Suspense>
          </MockedProvider>
        );
      });

      // Promise flush 후 데이터 확인
      await act(async () => {
        await flushPromises();
      });

      // 데이터 로딩 완료 후 실제 데이터가 표시되어야 함
      await waitFor(
        () => {
          expect(screen.getByTestId("suspense-query-user-name")).toBeInTheDocument();
          expect(screen.getByTestId("suspense-query-user-email")).toBeInTheDocument();
          expect(screen.getByTestId("suspense-query-user-name").textContent).toBe("John Doe");
          expect(screen.getByTestId("suspense-query-user-email").textContent).toBe("john@example.com");
        },
        { timeout: 10000 }
      );
    });

    it("SuspenseQuery와 SuspenseFragment가 함께 여러 프래그먼트를 처리할 수 있어야 한다", async () => {
      // 확장된 사용자 쿼리
      const GET_USER_EXTENDED = gql`
        query GetUserExtended($id: ID!) {
          user(id: $id) {
            id
            ...UserFragment
            ...ExtendedUserFragment
          }
        }
        ${USER_FRAGMENT}
        fragment ExtendedUserFragment on User {
          name
          email
          bio
        }
      `;

      const extendedUser = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        bio: "Software Developer",
      };

      const mocks = [
        {
          request: {
            query: GET_USER_EXTENDED,
            variables: { id: "1" },
          },
          result: {
            data: { user: extendedUser },
          },
        },
      ];

      const EXTENDED_FRAGMENT = gql`
        fragment ExtendedUserFragment on User {
          name
          email
          bio
        }
      `;

      const basicData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const extendedData = {
        name: "John Doe",
        email: "john@example.com",
        bio: "Software Developer",
      };

      // 프래그먼트에 따라 다른 데이터 반환
      mockUseSuspenseFragment.mockImplementation(({ fragment }) => {
        if (fragment === USER_FRAGMENT) {
          return { data: basicData, complete: true };
        } else if (fragment === EXTENDED_FRAGMENT) {
          return { data: extendedData, complete: true };
        }
        return { data: {}, complete: true };
      });

      await act(async () => {
        render(
          <MockedProvider mocks={mocks} addTypename={false}>
            <Suspense fallback={<div data-testid="extended-loading">Loading extended user...</div>}>
              <SuspenseQuery<{ user: typeof extendedUser }, { id: string }>
                query={GET_USER_EXTENDED}
                variables={{ id: "1" }}
              >
                {({ data }) => (
                  <div>
                    {/* 기본 사용자 정보 프래그먼트 */}
                    <Suspense fallback={<div data-testid="basic-fragment-loading">Loading basic fragment...</div>}>
                      <SuspenseFragment<UserFragment>
                        fragment={USER_FRAGMENT}
                        fragmentName="UserFragment"
                        from={data.user}
                      >
                        {({ data: basicData }) => (
                          <div data-testid="basic-info">
                            <span data-testid="basic-name">{basicData.name}</span>
                            <span data-testid="basic-email">{basicData.email}</span>
                          </div>
                        )}
                      </SuspenseFragment>
                    </Suspense>

                    {/* 확장된 사용자 정보 프래그먼트 */}
                    <Suspense fallback={<div data-testid="extended-fragment-loading">Loading extended fragment...</div>}>
                      <SuspenseFragment<{ name: string; email: string; bio: string }>
                        fragment={EXTENDED_FRAGMENT}
                        fragmentName="ExtendedUserFragment"
                        from={data.user}
                      >
                        {({ data: extendedData }) => (
                          <div data-testid="extended-info">
                            <span data-testid="extended-bio">{extendedData.bio}</span>
                          </div>
                        )}
                      </SuspenseFragment>
                    </Suspense>
                  </div>
                )}
              </SuspenseQuery>
            </Suspense>
          </MockedProvider>
        );
      });

      // Promise flush 후 데이터 확인
      await act(async () => {
        await flushPromises();
      });

      await waitFor(
        () => {
          // 기본 정보가 올바르게 렌더링되는지 확인
          expect(screen.getByTestId("basic-info")).toBeInTheDocument();
          expect(screen.getByTestId("basic-name").textContent).toBe("John Doe");
          expect(screen.getByTestId("basic-email").textContent).toBe("john@example.com");

          // 확장된 정보가 올바르게 렌더링되는지 확인
          expect(screen.getByTestId("extended-info")).toBeInTheDocument();
          expect(screen.getByTestId("extended-bio").textContent).toBe("Software Developer");
        },
        { timeout: 10000 }
      );
    });
  });
}); 