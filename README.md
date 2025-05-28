# declare-apollo

A declarative wrapper around Apollo Client that provides JSX components for more declarative data fetching with React Suspense and mutations.

## Features

- 🚀 **Declarative**: Use `<SuspenseQuery>` and `<Mutation>` JSX components instead of hooks
- 🔄 **Full Apollo Client compatibility**: Re-exports all Apollo Client functionality
- ⚡ **React 18 Suspense**: Built-in support for React Suspense
- 📦 **TypeScript**: Full TypeScript support with proper type inference
- 🎯 **Better DX**: Clearer component boundaries and reduced prop drilling
- 🔀 **Multiple Queries**: `useSuspenseQueries` and `useQueries` hooks for parallel data fetching

## Installation

```bash
npm install declare-apollo
# or
pnpm add declare-apollo
# or
yarn add declare-apollo
```

**Note**: This package includes Apollo Client as a peer dependency, so you don't need to install `@apollo/client` separately.

## Usage

### SuspenseQuery Component

Replace `useSuspenseQuery` hook with declarative `<SuspenseQuery>` component:

#### Before (with useSuspenseQuery)
```tsx
import { useSuspenseQuery } from '@apollo/client';
import { GET_POSTS, GET_USER } from './queries';

const PostsPage = ({ userId }) => {
  return (
    <Suspense fallback="Loading...">
      <UserInfo userId={userId} />
      <PostList userId={userId} />
    </Suspense>
  );
};

// Separate components needed for data fetching
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

#### After (with SuspenseQuery)
```tsx
import { SuspenseQuery } from 'declare-apollo';
import { GET_POSTS, GET_USER } from './queries';

const PostsPage = ({ userId }) => {
  return (
    <Suspense fallback="Loading...">
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

### useSuspenseQueries Hook

Execute multiple queries in parallel with Suspense support:

```tsx
import { useSuspenseQueries, getAllSuspenseQueriesData } from 'declare-apollo';

const UserDashboard = ({ userId }) => {
  // Execute multiple queries in parallel - will suspend until all are resolved
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
      pollInterval: 30000, // Poll for new comments
    },
  ]);

  // Extract data using utility function
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
      <button onClick={handleRefreshAll}>Refresh All</button>
    </div>
  );
};

// Wrap with Suspense
const App = () => (
  <Suspense fallback={<div>Loading dashboard...</div>}>
    <UserDashboard userId="123" />
  </Suspense>
);
```

### useQueries Hook

Execute multiple queries in parallel without Suspense (traditional loading states):

```tsx
import { useQueries, areQueriesLoading, hasQueriesErrors } from 'declare-apollo';

const UserDashboard = ({ userId }) => {
  const [userResult, postsResult] = useQueries([
    {
      query: GET_USER,
      variables: { id: userId },
    },
    {
      query: GET_POSTS,
      variables: { userId },
      skip: !userId, // Conditional query
    },
  ]);

  if (areQueriesLoading([userResult, postsResult])) {
    return <div>Loading...</div>;
  }

  if (hasQueriesErrors([userResult, postsResult])) {
    return <div>Error loading data</div>;
  }

  return (
    <div>
      <UserProfile user={userResult.data} />
      <PostsList posts={postsResult.data} />
    </div>
  );
};
```

### Mutation Component

Replace `useMutation` hook with declarative `<Mutation>` component:

#### Before (with useMutation)
```tsx
import { useMutation } from '@apollo/client';

const PostsPage = () => {
  const posts = usePosts();
  return posts.map(post => <PostToUseMutation key={post.id} post={post} />);
};

// Unnecessary wrapper component
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

#### After (with Mutation)
```tsx
import { Mutation } from 'declare-apollo';

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

## API Reference

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

// Utility functions
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

// Utility functions
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

## Benefits

1. **Clearer Component Boundaries**: It's immediately clear which components trigger Suspense
2. **Reduced Prop Drilling**: Data fetching happens at the same level as rendering
3. **Easier Refactoring**: No need for wrapper components just to use hooks
4. **Better Parallel Queries**: Multiple queries at the same level are automatically parallel
5. **Presentational Components**: Child components become purely presentational
6. **Flexible Query Patterns**: Choose between Suspense (`useSuspenseQueries`) or traditional loading states (`useQueries`)

## Apollo Client Compatibility

This package re-exports everything from `@apollo/client`, so you can use all Apollo Client features:

```tsx
import { 
  ApolloProvider, 
  ApolloClient, 
  InMemoryCache,
  gql,
  useQuery, // Still available if needed
  useMutation, // Still available if needed
  SuspenseQuery, // New declarative component
  Mutation, // New declarative component
  useSuspenseQueries, // New parallel suspense queries
  useQueries // New parallel queries
} from 'declare-apollo';
```

## TypeScript Support

Full TypeScript support with proper type inference:

```tsx
import { gql } from 'declare-apollo';

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

// TypeScript will infer the correct types
<SuspenseQuery query={GET_USER} variables={{ id: "1" }}>
  {({ data }) => (
    // data.user is properly typed
    <div>{data.user.name}</div>
  )}
</SuspenseQuery>
```

## License

MIT 