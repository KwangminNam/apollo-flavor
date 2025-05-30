 import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { Mutation } from '../Mutation';
import { gql, ApolloError } from '@apollo/client';
import '@testing-library/jest-dom';

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

describe('Mutation Component', () => {
  // 콘솔 에러 억제
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const renderMutation = (mocks: any[] = []) => {
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Mutation<UpdateUserData, UpdateUserVariables>
          mutation={UPDATE_USER}
        >
          {({ mutate, data, loading, error, called, reset }) => (
            <div>
              <button
                onClick={() => mutate({ variables: { id: '1', name: 'Updated Name' } })}
                data-testid="update-button"
              >
                Update User
              </button>
              <button onClick={reset} data-testid="reset-button">
                Reset
              </button>
              {loading && <div data-testid="loading">Loading...</div>}
              {error && <div data-testid="error">Error: {error.message}</div>}
              {data && <div data-testid="data">Updated: {data.updateUser.name}</div>}
              {called && <div data-testid="called">Mutation called</div>}
            </div>
          )}
        </Mutation>
      </MockedProvider>
    );
  };

  it('renders without crashing', () => {
    renderMutation();
    expect(screen.getByTestId('update-button')).toBeInTheDocument();
  });

  it('shows loading state when mutation is in progress', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_USER,
          variables: { id: '1', name: 'Updated Name' },
        },
        result: {
          data: {
            updateUser: { id: '1', name: 'Updated Name' },
          },
        },
        delay: 100,
      },
    ];

    renderMutation(mocks);
    fireEvent.click(screen.getByTestId('update-button'));
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  it('shows data after successful mutation', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_USER,
          variables: { id: '1', name: 'Updated Name' },
        },
        result: {
          data: {
            updateUser: { id: '1', name: 'Updated Name' },
          },
        },
        delay: 100,
      },
    ];

    renderMutation(mocks);
    fireEvent.click(screen.getByTestId('update-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('Updated: Updated Name');
    });
  });

  // it('shows error message when mutation fails', async () => {
  //   const errorMessage = 'Mutation failed';
  //   const mocks = [
  //     {
  //       request: {
  //         query: UPDATE_USER,
  //         variables: { id: '1', name: 'Updated Name' },
  //       },
  //       error: new ApolloError({
  //         graphQLErrors: [new Error(errorMessage)],
  //         networkError: null,
  //         errorMessage,
  //       }),
  //     },
  //   ];

  //   renderMutation(mocks);
  //   fireEvent.click(screen.getByTestId('update-button'));
    
  //   await waitFor(() => {
  //     expect(screen.getByTestId('error')).toHaveTextContent(`Error: ${errorMessage}`);
  //   });
  // });

  it('shows called state after mutation is triggered', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_USER,
          variables: { id: '1', name: 'Updated Name' },
        },
        result: {
          data: {
            updateUser: { id: '1', name: 'Updated Name' },
          },
        },
        delay: 100,
      },
    ];

    renderMutation(mocks);
    fireEvent.click(screen.getByTestId('update-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('called')).toBeInTheDocument();
    });
  });

  it('resets mutation state when reset is called', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_USER,
          variables: { id: '1', name: 'Updated Name' },
        },
        result: {
          data: {
            updateUser: { id: '1', name: 'Updated Name' },
          },
        },
        delay: 100,
      },
    ];

    renderMutation(mocks);
    fireEvent.click(screen.getByTestId('update-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('data')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('reset-button'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('data')).not.toBeInTheDocument();
    });
  });

  it('supports mutation options', async () => {
    const onCompletedMock = vi.fn();
    const onErrorMock = vi.fn();

    const mocks = [
      {
        request: {
          query: UPDATE_USER,
          variables: { id: '1', name: 'Updated Name' },
        },
        result: {
          data: {
            updateUser: { id: '1', name: 'Updated Name' },
          },
        },
        delay: 100,
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Mutation<UpdateUserData, UpdateUserVariables>
          mutation={UPDATE_USER}
          options={{
            onCompleted: onCompletedMock,
            onError: onErrorMock,
          }}
        >
          {({ mutate }) => (
            <button
              onClick={() => mutate({ variables: { id: '1', name: 'Updated Name' } })}
              data-testid="update-button"
            >
              Update User
            </button>
          )}
        </Mutation>
      </MockedProvider>
    );

    fireEvent.click(screen.getByTestId('update-button'));
    
    await waitFor(() => {
      expect(onCompletedMock).toHaveBeenCalled();
    });
    expect(onErrorMock).not.toHaveBeenCalled();
  });
}); 