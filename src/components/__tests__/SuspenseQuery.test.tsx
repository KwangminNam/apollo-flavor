import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import { SuspenseQuery } from '../SuspenseQuery';

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

const mocks = [
  {
    request: {
      query: GET_USER,
      variables: { id: '1' },
    },
    result: {
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    },
  },
];

describe('SuspenseQuery', () => {
  it('renders loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Suspense fallback={<div>Loading...</div>}>
          <SuspenseQuery query={GET_USER} variables={{ id: '1' }}>
            {({ data }) => (
              <div>
                <h1>{data.user.name}</h1>
                <p>{data.user.email}</p>
              </div>
            )}
          </SuspenseQuery>
        </Suspense>
      </MockedProvider>
    );

    expect(screen.getByText('Loading...')).toBeDefined();
  });
}); 