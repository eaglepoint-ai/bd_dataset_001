import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAddPostMutation } from '../api/apiSlice'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be at most 100 characters'),
  body: z.string().max(1000, 'Body must be at most 1000 characters').optional().or(z.literal('')),
})

const AddPostForm = () => {
  const [addPost, { isLoading, error }] = useAddPostMutation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '' },
  })

  const onSubmit = async (data) => {
    try {
      await addPost(data).unwrap()
      reset()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <section aria-labelledby="add-post-heading" className="add-post-section">
      <h2 id="add-post-heading" className="add-post-title">Add a New Post</h2>
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" noValidate className="add-post-form">
        <div className="form-group">
          <label htmlFor="title" className="form-label">Title<span className="form-required">*</span></label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className={`form-input${errors.title ? ' form-input-error' : ''}`}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
            disabled={isLoading}
          />
          {errors.title && (
            <span id="title-error" className="form-error">{errors.title.message}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="body" className="form-label">Body</label>
          <textarea
            id="body"
            rows={3}
            {...register('body')}
            className={`form-input${errors.body ? ' form-input-error' : ''}`}
            aria-invalid={!!errors.body}
            aria-describedby={errors.body ? 'body-error' : undefined}
            disabled={isLoading}
          />
          {errors.body && (
            <span id="body-error" className="form-error">{errors.body.message}</span>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="form-submit"
        >
          {isLoading ? 'Adding…' : 'Add Post'}
        </button>
        {error && (
          <div className="form-error form-error-server">Error adding post.</div>
        )}
      </form>
    </section>
  )
}

export default AddPostForm
