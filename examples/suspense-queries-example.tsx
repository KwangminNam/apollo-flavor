import React, { Suspense } from 'react';
import { gql } from '@apollo/client';
import { useSuspenseQueries, getAllSuspenseQueriesData } from '../src';

// GraphQL queries
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      avatar
    }
  }
`;

const GET_POSTS = gql`
  query GetPosts($userId: ID!) {
    posts(userId: $userId) {
      id
      title
      content
      createdAt
    }
  }
`;

const GET_COMMENTS = gql`
  query GetComments($userId: ID!) {
    comments(userId: $userId) {
      id
      content
      postId
      createdAt
    }
  }
`;

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  createdAt: string;
}

// Component that uses useSuspenseQueries
function UserDashboard({ userId }: { userId: string }) {
  // Execute multiple queries in parallel with Suspense
  const [userResult, postsResult, commentsResult] = useSuspenseQueries([
    {
      query: GET_USER,
      variables: { id: userId },
      errorPolicy: 'all' as const,
    },
    {
      query: GET_POSTS,
      variables: { userId },
      errorPolicy: 'all' as const,
    },
    {
      query: GET_COMMENTS,
      variables: { userId },
      errorPolicy: 'all' as const,
      pollInterval: 30000, // Poll for new comments every 30 seconds
    },
  ]);

  // Extract data using utility function
  const [userData, postsData, commentsData] = getAllSuspenseQueriesData([
    userResult,
    postsResult,
    commentsResult,
  ]);

  const user = userData as User;
  const posts = postsData as Post[];
  const comments = commentsData as Comment[];

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        userResult.refetch(),
        postsResult.refetch(),
        commentsResult.refetch(),
      ]);
      console.log('All data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <div className="user-info">
          <img src={user.avatar} alt={user.name} className="avatar" />
          <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        </div>
        <button onClick={handleRefreshAll} className="refresh-btn">
          Refresh All Data
        </button>
      </header>

      <div className="dashboard-content">
        <section className="posts-section">
          <h2>Posts ({posts.length})</h2>
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              <time>{new Date(post.createdAt).toLocaleDateString()}</time>
            </article>
          ))}
        </section>

        <section className="comments-section">
          <h2>Recent Comments ({comments.length})</h2>
          {comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <p>{comment.content}</p>
              <small>
                Post: {comment.postId} • {new Date(comment.createdAt).toLocaleDateString()}
              </small>
            </div>
          ))}
        </section>
      </div>

      {/* Show network status for debugging */}
      <div className="debug-info">
        <p>User Query Status: {userResult.networkStatus}</p>
        <p>Posts Query Status: {postsResult.networkStatus}</p>
        <p>Comments Query Status: {commentsResult.networkStatus}</p>
      </div>
    </div>
  );
}

// Error boundary component
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
function DashboardLoading() {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Loading user dashboard...</p>
    </div>
  );
}

// Main app component
export function SuspenseQueriesExample() {
  const userId = "user-123";

  return (
    <div className="app">
      <ErrorBoundary>
        <Suspense fallback={<DashboardLoading />}>
          <UserDashboard userId={userId} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Example with conditional queries
function ConditionalQueriesExample({ showComments }: { showComments: boolean }) {
  const queries = [
    {
      query: GET_USER,
      variables: { id: "user-123" },
    },
    {
      query: GET_POSTS,
      variables: { userId: "user-123" },
    },
    // Conditionally include comments query
    ...(showComments ? [{
      query: GET_COMMENTS,
      variables: { userId: "user-123" },
      skip: false,
    }] : []),
  ];

  const results = useSuspenseQueries(queries);
  const allData = getAllSuspenseQueriesData(results);

  return (
    <div>
      <h2>Conditional Queries Example</h2>
      <p>Loaded {results.length} queries</p>
      <pre>{JSON.stringify(allData, null, 2)}</pre>
    </div>
  );
}

export { ConditionalQueriesExample }; 