import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
// The baseUrl should include the /api prefix (e.g., VITE_API_BASE_URL='http://localhost:5173/api'), endpoints use '/posts'.
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'


export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => '/posts',
      providesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    addPost: builder.mutation({
      query: (post) => ({
        url: '/posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
})

export const { useGetPostsQuery, useAddPostMutation } = apiSlice
