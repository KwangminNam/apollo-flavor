# WIP..

## apollo-flavor

해당 라이브러리는 [Toss/Suspensive](https://github.com/toss/suspensive)의 모티브를 받아 Apollo Client와 GraphQL을 사용하는 개발자들을 위해 만들어졌습니다.
Apollo Client를 위한 선언적 JSX 컴포넌트 라이브러리입니다. **Suspense와 비동기 데이터 페칭을 같은 컴포넌트 depth에서 선언적으로 처리**할 수 있게 해주어, 더 직관적이고 유지보수하기 쉬운 React 애플리케이션을 만들 수 있습니다.

## 주요 기능

- **🎯 선언적 API**: `<SuspenseQuery>`와 `<SuspenseFragment>` JSX 컴포넌트
- **📏 단일 Depth**: Suspense와 데이터 페칭을 같은 컴포넌트 레벨에서 처리
- **⚡ React Suspense 최적화**: React 18/19 Suspense와 완벽 통합
- **📦 TypeScript 완전 지원**: 완벽한 타입 추론과 안전성
- **🎨 컴포넌트 순수성**: 프레젠테이션 컴포넌트의 순수성 보장

## 📦 설치

```bash
npm install apollo-flavor
# or
pnpm add apollo-flavor
# or
yarn add apollo-flavor
```


### 문제: 기존 Apollo Client의 useSuspenseQuery와 Suspense의 복잡한 컴포넌트 구조

```tsx
// ❌ 기존 방식: Suspense와 데이터 페칭이 분리된 depth
function UserPage({ userId }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId={userId} /> {/* 별도 컴포넌트 필요 */}
      <UserPosts userId={userId} /> {/* 별도 컴포넌트 필요 */}
    </Suspense>
  );
}

// 데이터 페칭을 위한 추가 컴포넌트들
function UserProfile({ userId }) {
  const { data } = useSuspenseQuery(GET_USER, { variables: { userId } });
  return <div>{data.user.name}</div>;
}

function UserPosts({ userId }) {
  const { data } = useSuspenseQuery(GET_POSTS, { variables: { userId } });
  return data.posts.map((post) => <PostItem key={post.id} post={post} />);
}
```

### apollo-flavor 에선?: 같은 depth에서 선언적 처리

```tsx
// ✅ declare-apollo: Suspense와 데이터 페칭이 같은 depth에서 선언적으로 처리
function UserPage({ userId }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuspenseQuery query={GET_USER} variables={{ userId }}>
        {({ data }) => <div>{data.user.name}</div>}
      </SuspenseQuery>

      <SuspenseQuery query={GET_POSTS} variables={{ userId }}>
        {({ data }) =>
          data.posts.map((post) => <PostItem key={post.id} post={post} />)
        }
      </SuspenseQuery>
    </Suspense>
  );
}
```


## 🎨 사용법

### SuspenseQuery: 선언적 쿼리 컴포넌트

#### 기본 사용법

```tsx
import { SuspenseQuery } from "declare-apollo";
import { gql } from "@apollo/client";

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

function UserProfile({ userId }) {
  return (
    <Suspense fallback={<UserSkeleton />}>
      <SuspenseQuery query={GET_USER} variables={{ id: userId }}>
        {({ data, refetch, networkStatus }) => (
          <div className="user-profile">
            <img src={data.user.avatar} alt={data.user.name} />
            <h1>{data.user.name}</h1>
            <p>{data.user.email}</p>
            <button onClick={() => refetch()}>새로고침</button>
          </div>
        )}
      </SuspenseQuery>
    </Suspense>
  );
}
```

### SuspenseFragment: 선언적 프래그먼트 컴포넌트

[@apollo/client/useSuspenseFragment](https://www.apollographql.com/docs/react/data/fragments#usesuspensefragment)

#### GraphQL Fragment를 선언적으로 처리할 수 있습니다.

##### 기존의 useSuspenseFragment의 사용사례 입니다.

```tsx
import { SuspenseFragment } from "apollo-flavor";
import { gql } from "@apollo/client";

const USER_CARD_FRAGMENT = gql`
  fragment UserCard on User {
    id
    name
    avatar
    role
  }
`;

// 재사용 가능한 컴포넌트
function UserCard({ user }) {
  const { data } = useSuspenseFragment({
    fragment: USER_CARD_FRAGMENT,
    from: user,
  });

  return (
    <div className="user-card">
      <img src={data.avatar} alt={data.name} />
      <h3>{data.name}</h3>
      <span>{data.role}</span>
    </div>
  );
}

// 여러 쿼리에서 같은 컴포넌트 재사용
const GET_POST_WITH_AUTHOR = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      title
      content
      author {
        ...UserCard # 같은 Fragment 재사용
      }
    }
  }
  ${USER_CARD_FRAGMENT}
`;

const GET_COMMENTS = gql`
  query GetComments($postId: ID!) {
    comments(postId: $postId) {
      id
      content
      author {
        ...UserCard # 같은 Fragment 재사용
      }
    }
  }
  ${USER_CARD_FRAGMENT}
`;

// 두 곳에서 같은 UserCard 컴포넌트 사용
function PostPage() {
  const { data: post } = useSuspenseQuery(GET_POST_WITH_AUTHOR);
  const { data: comments } = useSuspenseQuery(GET_COMMENTS);

  return (
    <div>
      <UserCard user={post.author} /> {/* 재사용 */}
      {comments.map((comment) => (
        <div key={comment.id}>
          <p>{comment.content}</p>
          <UserCard user={comment.author} /> {/* 재사용 */}
        </div>
      ))}
    </div>
  );
}
```

### apollo-flavor 에선?

```tsx
function PostPage({ postId }) {
  return (
    <div className="post-page">
      <Suspense fallback={<PostSkeleton />}>
        <SuspenseQuery query={GET_POST_WITH_AUTHOR} variables={{ id: postId }}>
          {({ data: post }) => (
            <article>
              <h1>{post.title}</h1>
              <div className="post-content">{post.content}</div>

              <div className="author-section">
                <h3>작성자</h3>
                {/* SuspenseFragment를 SuspenseQuery와 같은 레벨에서 사용 */}
                <SuspenseFragment
                  fragment={USER_CARD_FRAGMENT}
                  fragmentName="UserCard"
                  from={post.author}
                >
                  {({ data }) => <UserCard user={data} />}
                </SuspenseFragment>
              </div>
            </article>
          )}
        </SuspenseQuery>
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <SuspenseQuery query={GET_COMMENTS} variables={{ postId }}>
          {({ data: comments }) => (
            <section className="comments">
              <h3>댓글 ({comments.length})</h3>
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <p>{comment.content}</p>

                  <div className="comment-author">
                    {/* 각 댓글의 작성자도 같은 패턴으로 */}
                    <SuspenseFragment
                      fragment={USER_CARD_FRAGMENT}
                      fragmentName="UserCard"
                      from={comment.author}
                    >
                      {({ data }) => <UserCard user={data} />}
                    </SuspenseFragment>
                  </div>
                </div>
              ))}
            </section>
          )}
        </SuspenseQuery>
      </Suspense>
    </div>
  );
}
```

## 📄 라이선스

MIT License
