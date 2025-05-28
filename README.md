# WIP...

# apollo-flavor

Apollo Client를 위한 선언적 래퍼로, React Suspense와 뮤테이션을 위한 JSX 컴포넌트를 제공합니다. 이 라이브러리는 [Toss/Suspensive](https://github.com/toss/suspensive)의 모티브를 받아 Apollo Client와 GraphQL을 사용하는 개발자들을 위해 만들어졌습니다.

## 주요 기능

- 🚀 **선언적 API**: 훅 대신 `<SuspenseQuery>`와 `<Mutation>` JSX 컴포넌트 사용
- 🔄 **완벽한 Apollo Client 호환성**: 모든 Apollo Client 기능 재사용 가능
- ⚡ **React 18/19 Suspense**: React Suspense 내장 지원
- 📦 **TypeScript**: 완벽한 타입 추론 지원
- 🎯 **향상된 개발 경험**: 명확한 컴포넌트 경계와 prop drilling 감소
- 🔀 **다중 쿼리**: `useSuspenseQueries`와 `useQueries` 훅으로 병렬 데이터 페칭 지원
- 🆕 **추가 기능**: Apollo Client에서 제공하지 않는 `useQueries`와 `useSuspenseQueries` 훅 구현

## 설치

```bash
npm install apollo-flavor
# or
pnpm add apollo-flavor
# or
yarn add apollo-flavor
```

**참고**: 이 패키지는 Apollo Client를 peer dependency로 포함하고 있어서 별도로 `@apollo/client`를 설치할 필요가 없습니다.

## 사용법

### SuspenseQuery 컴포넌트

`useSuspenseQuery` 훅을 선언적인 `<SuspenseQuery>` 컴포넌트로 대체:

#### 이전 (useSuspenseQuery 사용)
```tsx
import { useSuspenseQuery } from '@apollo/client';
import { GET_POSTS, GET_USER } from './queries';

const PostsPage = ({ userId }) => {
  return (
    <Suspense fallback="로딩 중...">
      <UserInfo userId={userId} />
      <PostList userId={userId} />
    </Suspense>
  );
};

// 데이터 페칭을 위한 별도 컴포넌트 필요
const UserInfo = ({ userId }) => {
  const { data: user } = useSuspenseQuery(GET_USER, { variables: { userId } });
  return <UserProfile {...user} />;
};

const PostList = ({ userId }) => {
  const { data: posts } = useSuspenseQuery(GET_POSTS, { 
    variables: { userId },
    select: (posts) => posts.filter(({ isPublic }) => isPublic)
  });
  return posts.map(post => <PostItem key={post.id} {...post} />);
};
```

#### 이후 (SuspenseQuery 사용)
```tsx
import { SuspenseQuery } from 'apollo-flavor';
import { GET_POSTS, GET_USER } from './queries';

const PostsPage = ({ userId }) => {
  return (
    <Suspense fallback="로딩 중...">
      <SuspenseQuery query={GET_USER} variables={{ userId }}>
        {({ data: user }) => <UserProfile key={user.id} {...user} />}
      </SuspenseQuery>
      
      <SuspenseQuery 
        query={GET_POSTS} 
        variables={{ userId }}
        options={{
          select: (posts) => posts.filter(({ isPublic }) => isPublic)
        }}
      >
        {({ data: posts }) =>
          posts.map(post => <PostItem key={post.id} {...post} />)
        }
      </SuspenseQuery>
    </Suspense>
  );
};
```

### useSuspenseQueries 훅

Suspense를 지원하는 병렬 쿼리 실행:

```tsx
import { useSuspenseQueries, getAllSuspenseQueriesData } from 'apollo-flavor';

const UserDashboard = ({ userId }) => {
  // 여러 쿼리를 병렬로 실행 - 모든 쿼리가 완료될 때까지 Suspense
  const [userResult, postsResult, commentsResult] = useSuspenseQueries([
    {
      query: GET_USER,
      variables: { id: userId },
      errorPolicy: 'all',
    },
    {
      query: GET_POSTS,
      variables: { userId },
      errorPolicy: 'all',
    },
    {
      query: GET_COMMENTS,
      variables: { userId },
      pollInterval: 30000, // 새 댓글 폴링
    },
  ]);

  // 유틸리티 함수로 데이터 추출
  const [userData, postsData, commentsData] = getAllSuspenseQueriesData([
    userResult,
    postsResult,
    commentsResult,
  ]);

  const handleRefreshAll = async () => {
    await Promise.all([
      userResult.refetch(),
      postsResult.refetch(),
      commentsResult.refetch(),
    ]);
  };

  return (
    <div>
      <UserProfile user={userData} />
      <PostsList posts={postsData} />
      <CommentsList comments={commentsData} />
      <button onClick={handleRefreshAll}>모두 새로고침</button>
    </div>
  );
};

// Suspense로 감싸기
const App = () => (
  <Suspense fallback={<div>대시보드 로딩 중...</div>}>
    <UserDashboard userId="123" />
  </Suspense>
);
```

### useQueries 훅

Suspense 없이 병렬 쿼리 실행 (전통적인 로딩 상태):

```tsx
import { useQueries, areQueriesLoading, hasQueriesErrors } from 'apollo-flavor';

const UserDashboard = ({ userId }) => {
  const [userResult, postsResult] = useQueries([
    {
      query: GET_USER,
      variables: { id: userId },
    },
    {
      query: GET_POSTS,
      variables: { userId },
      skip: !userId, // 조건부 쿼리
    },
  ]);

  if (areQueriesLoading([userResult, postsResult])) {
    return <div>로딩 중...</div>;
  }

  if (hasQueriesErrors([userResult, postsResult])) {
    return <div>데이터 로딩 중 오류 발생</div>;
  }

  return (
    <div>
      <UserProfile user={userResult.data} />
      <PostsList posts={postsResult.data} />
    </div>
  );
};
```

### Mutation 컴포넌트

`useMutation` 훅을 선언적인 `<Mutation>` 컴포넌트로 대체:

#### 이전 (useMutation 사용)
```tsx
import { useMutation } from '@apollo/client';

const PostsPage = () => {
  const posts = usePosts();
  return posts.map(post => <PostToUseMutation key={post.id} post={post} />);
};

// 불필요한 래퍼 컴포넌트
const PostToUseMutation = ({ post }) => {
  const [editPost, { loading }] = useMutation(EDIT_POST);
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      <div>{post.content}</div>
      <textarea onChange={e => editPost({ 
        variables: { postId: post.id, content: e.target.value }
      })} />
    </div>
  );
};
```

#### 이후 (Mutation 사용)
```tsx
import { Mutation } from 'apollo-flavor';

const PostsPage = () => {
  const { data: posts } = useSuspenseQuery(GET_POSTS);
  
  return posts.map(post => (
    <Mutation key={post.id} mutation={EDIT_POST}>
      {({ mutate, loading }) => (
        <div>
          {loading && <Spinner />}
          <div>{post.content}</div>
          <textarea onChange={e => mutate({ 
            variables: { postId: post.id, content: e.target.value }
          })} />
        </div>
      )}
    </Mutation>
  ));
};
```

## API 레퍼런스

### SuspenseQuery

```tsx
interface SuspenseQueryProps<TData, TVariables> {
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: TVariables;
  children: (result: { data: TData }) => React.ReactNode;
  options?: Omit<SuspenseQueryHookOptions<TData, TVariables>, 'query' | 'variables'>;
}
```

### useSuspenseQueries

```tsx
function useSuspenseQueries<T extends readonly SuspenseQueryConfig[]>(
  queries: T
): SuspenseQueriesResult[];

interface SuspenseQueryConfig<TData, TVariables> {
  query: DocumentNode;
  variables?: TVariables;
  skip?: boolean;
  errorPolicy?: 'none' | 'ignore' | 'all';
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache';
  notifyOnNetworkStatusChange?: boolean;
  pollInterval?: number;
  context?: any;
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
}

// 유틸리티 함수
function getAllSuspenseQueriesData<T>(results: SuspenseQueriesResult<T>[]): T[];
function hasSuspenseQueriesErrors(results: SuspenseQueriesResult[]): boolean;
function getSuspenseQueriesErrors(results: SuspenseQueriesResult[]): any[];
function refetchAllSuspenseQueries(results: SuspenseQueriesResult[]): Promise<any[]>;
```

### useQueries

```tsx
function useQueries<T extends readonly QueryConfig[]>(
  queries: T
): QueriesResult[];

// 유틸리티 함수
function areQueriesLoading(results: QueriesResult[]): boolean;
function hasQueriesErrors(results: QueriesResult[]): boolean;
function getQueriesErrors(results: QueriesResult[]): any[];
function areQueriesComplete(results: QueriesResult[]): boolean;
function getAllQueriesData<T>(results: QueriesResult<T>[]): (T | undefined)[];
```

### Mutation

```tsx
interface MutationProps<TData, TVariables> {
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>;
  children: (mutationResult: MutationResult<TData> & { mutate: MutationFunction<TData, TVariables> }) => React.ReactNode;
  options?: MutationHookOptions<TData, TVariables>;
}
```

## 장점

1. **명확한 컴포넌트 경계**: 어떤 컴포넌트가 Suspense를 트리거하는지 즉시 알 수 있음
2. **Prop Drilling 감소**: 데이터 페칭이 렌더링과 같은 레벨에서 이루어짐
3. **리팩토링 용이성**: 훅을 사용하기 위한 래퍼 컴포넌트가 필요 없음
4. **병렬 쿼리 개선**: 같은 레벨의 여러 쿼리가 자동으로 병렬 처리됨
5. **프레젠테이션 컴포넌트**: 자식 컴포넌트들이 순수하게 프레젠테이션 역할만 수행
6. **유연한 쿼리 패턴**: Suspense(`useSuspenseQueries`) 또는 전통적인 로딩 상태(`useQueries`) 선택 가능

## Apollo Client 호환성

이 패키지는 `@apollo/client`의 모든 기능을 재사용할 수 있게 해줍니다:

```tsx
import { 
  ApolloProvider, 
  ApolloClient, 
  InMemoryCache,
  gql,
  useQuery, // 필요시 사용 가능
  useMutation, // 필요시 사용 가능
  SuspenseQuery, // 새로운 선언적 컴포넌트
  Mutation, // 새로운 선언적 컴포넌트
  useSuspenseQueries, // 새로운 병렬 suspense 쿼리
  useQueries // 새로운 병렬 쿼리
} from 'apollo-flavor';
```

## TypeScript 지원

완벽한 타입 추론 지원:

```tsx
import { gql } from 'apollo-flavor';

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

// TypeScript가 올바른 타입을 추론
<SuspenseQuery query={GET_USER} variables={{ id: "1" }}>
  {({ data }) => (
    // data.user가 올바르게 타입 지정됨
    <div>{data.user.name}</div>
  )}
</SuspenseQuery>
```

## 라이선스

MIT 
