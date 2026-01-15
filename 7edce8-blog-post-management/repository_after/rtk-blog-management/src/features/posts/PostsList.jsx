import React from 'react'
import { useGetPostsQuery } from '../api/apiSlice'

const PostsList = () => {
  const { data, isLoading, isError } = useGetPostsQuery()

  if (isLoading) return <div className="posts-loading">Loading posts…</div>
  if (isError) return <div className="posts-error">Error loading posts.</div>

  return (
    <section aria-labelledby="posts-heading" className="posts-section">
      <h2 id="posts-heading" className="posts-title">Posts</h2>
      <ul className="posts-list">
        {data?.length === 0 && (
          <li className="posts-empty">No posts yet.</li>
        )}
        {data?.map((post) => (
          <li key={post.id} className="post-item">
            <div className="post-item-title">{post.title}</div>
            {post.body && <div className="post-item-body">{post.body}</div>}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default PostsList
