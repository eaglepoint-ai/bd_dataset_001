// tests/tests_after.test.jsx
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { store } from '../repository_after/rtkq-react-hook-form-zod-demo/src/app/store.js'
import * as api from '../repository_after/rtkq-react-hook-form-zod-demo/src/features/api/apiSlice.js'

import AddPostForm from '../repository_after/rtkq-react-hook-form-zod-demo/src/features/posts/AddPostForm.jsx'
import PostsList from '../repository_after/rtkq-react-hook-form-zod-demo/src/features/posts/PostsList.jsx'

const renderWithProvider = (ui) => render(<Provider store={store}>{ui}</Provider>)

// Skip all tests if TEST_TARGET=before
if (process.env.TEST_TARGET === 'before') {
  test.skip('No tests to run for repository_before', () => {})
} else {
  describe('AddPostForm', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      vi.spyOn(api, 'useAddPostMutation').mockImplementation(() => [vi.fn(), { isLoading: false, error: undefined }])
    })

    it('renders heading, title input, body textarea and submit button', () => {
      renderWithProvider(<AddPostForm />)

      expect(screen.getByRole('heading', { name: /add a new post/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^body/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add post/i })).toBeInTheDocument()
    })

    it('shows min length error when title is too short', async () => {
      const user = userEvent.setup()
      renderWithProvider(<AddPostForm />)

      fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: 'ab' } })
      await user.click(screen.getByRole('button', { name: /add post/i }))

      expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
    })

    it('shows max length error when title is too long', async () => {
      const user = userEvent.setup()
      renderWithProvider(<AddPostForm />)

      fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: 'a'.repeat(101) } })
      await user.click(screen.getByRole('button', { name: /add post/i }))

      expect(await screen.findByText(/at most 100 characters/i)).toBeInTheDocument()
    })

    it('shows max length error when body is too long', async () => {
      const user = userEvent.setup()
      renderWithProvider(<AddPostForm />)

      fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: 'Valid Title' } })
      fireEvent.change(screen.getByLabelText(/^body/i), { target: { value: 'a'.repeat(1001) } })
      await user.click(screen.getByRole('button', { name: /add post/i }))

      expect(await screen.findByText(/at most 1000 characters/i)).toBeInTheDocument()
    })

    it('calls addPost mutation with correct data and resets form on success', async () => {
      const mockAddPost = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve({ data: {} }) })
      api.useAddPostMutation.mockReturnValue([mockAddPost, { isLoading: false }])

      // const user = userEvent.setup()
      renderWithProvider(<AddPostForm />)

      fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: 'My Great Post' } })
      fireEvent.change(screen.getByLabelText(/^body/i), { target: { value: 'This is some content' } })
      await userEvent.click(screen.getByRole('button', { name: /add post/i }))

      await waitFor(() => {
        expect(mockAddPost).toHaveBeenCalledTimes(1)
        expect(mockAddPost).toHaveBeenCalledWith({
          title: 'My Great Post',
          body: 'This is some content',
        })
      })

      expect(screen.getByLabelText(/^title/i)).toHaveValue('')
      expect(screen.getByLabelText(/^body/i)).toHaveValue('')
      expect(screen.queryByText(/adding…/i)).not.toBeInTheDocument()
    })

    it('shows loading state on button during mutation', () => {
      api.useAddPostMutation.mockReturnValue([vi.fn(), { isLoading: true }])

      renderWithProvider(<AddPostForm />)

      const button = screen.getByRole('button', { name: /adding/i })
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent(/adding…/i)
    })

    it('shows server error message when mutation rejects', async () => {
      const mockAddPost = vi.fn().mockReturnValue({ unwrap: () => Promise.reject(new Error('Server error')) })
      api.useAddPostMutation.mockReturnValue([mockAddPost, { isLoading: false, error: true }])

      const user = userEvent.setup()
      renderWithProvider(<AddPostForm />)

      fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: 'Valid' } })
      fireEvent.change(screen.getByLabelText(/^body/i), { target: { value: 'Valid' } })
      await user.click(screen.getByRole('button', { name: /add post/i }))

      await waitFor(() => {
        expect(screen.getByText(/error adding post/i)).toBeInTheDocument()
      })
    })
  })

  describe('PostsList', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      vi.spyOn(api, 'useGetPostsQuery').mockImplementation(() => ({
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: false,
      }))
    })

    it('shows loading message while fetching', () => {
      vi.spyOn(api, 'useGetPostsQuery').mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isSuccess: false,
      })

      renderWithProvider(<PostsList />)

      expect(screen.getByText(/loading posts…/i)).toBeInTheDocument()
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('shows error message when query fails', () => {
      vi.spyOn(api, 'useGetPostsQuery').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isSuccess: false,
      })

      renderWithProvider(<PostsList />)

      expect(screen.getByText(/error loading posts/i)).toBeInTheDocument()
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('shows empty state message when no posts', () => {
      vi.spyOn(api, 'useGetPostsQuery').mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isSuccess: true,
      })

      renderWithProvider(<PostsList />)

      expect(screen.getByText(/no posts yet/i)).toBeInTheDocument()
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('renders all posts when data is available', () => {
      const fakePosts = [
        { id: 1, title: 'First Article', body: 'Content of first post' },
        { id: 2, title: 'Second Note', body: '' },
        { id: 3, title: 'Quick Update', body: 'Short body here' },
      ]

      vi.spyOn(api, 'useGetPostsQuery').mockReturnValue({
        data: fakePosts,
        isLoading: false,
        isError: false,
        isSuccess: true,
      })

      renderWithProvider(<PostsList />)

      expect(screen.getByRole('heading', { name: /posts/i })).toBeInTheDocument()
      expect(screen.getByRole('list')).toBeInTheDocument()

      expect(screen.getByText('First Article')).toBeInTheDocument()
      expect(screen.getByText('Content of first post')).toBeInTheDocument()

      expect(screen.getByText('Second Note')).toBeInTheDocument()
      expect(screen.queryByText('Second Note')).toBeVisible() // no body → no extra div

      expect(screen.getByText('Quick Update')).toBeInTheDocument()
      expect(screen.getByText('Short body here')).toBeInTheDocument()
    })
  })
}