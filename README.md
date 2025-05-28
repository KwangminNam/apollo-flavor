# declare-apollo

A declarative wrapper around Apollo Client that provides JSX components for more declarative data fetching with React Suspense and mutations.

## Features

- 🚀 **Declarative**: Use `<SuspenseQuery>` and `<Mutation>` JSX components instead of hooks
- 🔄 **Full Apollo Client compatibility**: Re-exports all Apollo Client functionality
- ⚡ **React 18 Suspense**: Built-in support for React Suspense
- 📦 **TypeScript**: Full TypeScript support with proper type inference
- 🎯 **Better DX**: Clearer component boundaries and reduced prop drilling

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
  Mutation // New declarative component
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