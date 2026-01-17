1. **Problem Statement**

The UpdateForm component needs refactoring to address major reliability and UX problems.
It lacks validation for empty or invalid IDs, does not verify MongoDB ObjectId format, and allows submissions with no actual changes.
Inputs are not trimmed and the update payload is not built selectively, leading to unnecessary API calls. 
Errors are only logged to the console instead of shown to users, and there is no loading state, submit disabling, or success reset. It also lacks request cancellation. Architecturally, it uses axios directly, relies on outdated imports, duplicates handlers, and has no proper TypeScript types.


2. **Prompt Used**

Refactor the following React TypeScript component (UpdateForm) to resolve all Functionality, UX, and Architecture issues while preserving its core purpose of updating an existing song by ID.

```js
import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import '../App.css';
const { API_BASE_URL } = require('../config.js');

interface Song {
	title: string;
	artist: string;
	album: string;
	genre: string;
	[key: string]: string;
}
const UpdateForm = (): JSX.Element => {
	const [title, setTitle] = useState<string>('');
	const [artist, setArtist] = useState<string>('');
	const [album, setAlbum] = useState<string>('');
	const [genre, setGenre] = useState<string>('');
	const [id, setId] = useState<string>('');
	const [isSuccess, setIsSuccess] = useState<boolean>(false);

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		const data: Song = { title, artist, album, genre };
		Object.keys(data).forEach((key) => {
			const value = data[key];
				if (value === '') {
					delete data[key];
				}
		});
		axios.put(`${API_BASE_URL}/songs/${id}`, data)
			.then(response => {
				console.log('Song updated:', response.data);
				// Reset the form
				setTitle('');
				setArtist('');
				setAlbum('');
				setGenre('');
				setId('');	
				setIsSuccess(true);
				})
			.catch (error => {
				if (error.response && error.response.status === 400) {
					console.error(error.response.data);
				} else {
					console.error('Error updating the song:', error);
				}
			});
		};

		const handleIdChange = (event: ChangeEvent<HTMLInputElement>): void => {
			setId(event.target.value);
		}
		const handleTitleChange = (event: ChangeEvent<HTMLInputElement>): void => {
			setTitle(event.target.value);
		}

		const handleArtistChange = (event: ChangeEvent<HTMLInputElement>): void => {
			setArtist(event.target.value);
		}
		
		const handleAlbumChange = (event: ChangeEvent<HTMLInputElement>): void => {
			setAlbum(event.target.value);
		}
		
		const handleGenreChange = (event: ChangeEvent<HTMLInputElement>): void => {
			setGenre(event.target.value);
		}

		return (
			<div className="song-form-container">
				<h1 className="form-heading">Update Song</h1>
				{isSuccess && <p className="success-message">Song updated successfully!</p>}
					<form className="song-form" onSubmit={handleSubmit}>
						<div className="form-group">
							<label htmlFor="id" className="form-label">Id:</label>
							<input
								type="text"
								id="id"
								value={id}
								onChange={handleIdChange}
								className="form-input"
								placeholder="Enter song ID"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="title" className="form-label">Title:</label>
							<input
								type="text"
								id="title"
								value={title}
								onChange={handleTitleChange}
								className="form-input"
								placeholder="Enter song title"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="artist" className="form-label">Artist:</label>
							<input
								type="text"
								id="artist"
								value={artist}
								onChange={handleArtistChange}
								className="form-input"
								placeholder="Enter artist name"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="album" className="form-label">Album:</label>
							<input
								type="text"
								id="album"
								value={album}
								onChange={handleAlbumChange}
								className="form-input"
								placeholder="Enter album name"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="genre" className="form-label">Genre:</label>
							<input
								type="text"
								id="genre"
								value={genre}
								onChange={handleGenreChange}
								className="form-input"
								placeholder="Enter genre"
							/>
						</div>
						<button type="submit" className="form-button">Update</button>
					</form>
			</div>
	);
};

export default UpdateForm;
```

Requirements

Functionality Improvements

Add proper client-side validation:

The ID field must be required.

Prevent submission if the ID field is empty or contains only whitespace.

Validate that the ID matches a valid MongoDB ObjectId format before making the API call.

Trim all input values before processing them.

Ensure update rules:

At least one field (title, artist, album, or genre) must be provided to perform an update.

If all update fields are empty after trimming, prevent submission and show an error message instead of making an API call.

Improve request payload logic:

Build the update object using only fields that contain non-empty values after trimming.

Handle API errors properly:

Display error messages in the UI instead of logging them to the console.

Handle 400 (invalid input) and 404 (song not found) responses with appropriate user feedback.

Reset the success message whenever the user edits any input field again.

Only clear the form fields after a successful update.

Add request cancellation support using AbortController or Axios cancellation tokens to prevent memory leaks if the component unmounts while a request is in progress.

UX Improvements
Add a visible loading indicator while the update request is in progress.


Disable the submit button while submitting.


Disable the submit button if:


The ID field is empty, or


No update fields are provided.


Display clear, user-friendly error messages in the UI.


Provide feedback when:


The ID format is invalid


No fields were provided to update


The song does not exist


Improve accessibility by using appropriate attributes (required, aria-invalid, etc.).


Architecture Improvements
Replace require('../config.js') with a proper ES module import.


Remove all console.log and console.error statements.


Move the axios.put call into a separate reusable API service module instead of using axios directly in the component.


Add proper TypeScript typing for:


API request payload


API success responses


API error responses


Remove code duplication:


Replace the multiple input change handlers with a single reusable change handler.


Remove the weak index signature from the Song interface and replace it with stricter, safer typing.


Ensure the component follows modern React best practices and clean state management.


Constraints
Do NOT introduce external libraries such as Formik, React Hook Form, or validation frameworks.


Use only React, TypeScript, and Axios.


Keep the component as a functional component.


Maintain compatibility with the existing backend endpoint (PUT /songs/:id).


Do NOT modify existing CSS class names or overall visual layout unless required for UX improvements.

3. **Requirements Specified**

- The ID field must be required.

- Submissions with an empty or whitespace-only ID must be prevented.

- The ID must be validated as a proper MongoDB ObjectId format.

- All input values must be trimmed before processing.

- At least one update field must be provided to perform an update.

- Submissions with no update fields must be blocked with an error message.

- The update request must include only non-empty fields after trimming.

- API errors must be displayed in the UI instead of the console.

- 400 responses must show clear invalid input messages.

- 404 responses must show a “song not found” message.

- Success messages must reset whenever any field is edited.

- Form fields must be cleared only after a successful update.

- Request cancellation must be supported to avoid memory leaks.

- A visible loading indicator must be shown while updating.

- The submit button must be disabled while a request is in progress.

- The submit button must be disabled if the ID is invalid or empty.

- The submit button must be disabled if no update fields are provided.

- Clear feedback must be shown for invalid ID formats.

- Accessibility attributes such as required and aria-invalid must be added.

- All console.log and console.error statements must be removed.

- Axios calls must be moved into a reusable API service module.

- Proper TypeScript types must be added for requests and responses.

- Multiple input handlers must be replaced with one reusable handler.

- The weak index signature in the Song interface must be removed.

- The component must follow modern React best practices.

- No external form or validation libraries may be introduced.

- The component must remain a functional React component.

- Compatibility with the existing PUT /songs/:id endpoint must be maintained.

- Existing CSS classes and layout must remain unchanged.

4. **Commands:**

```bash 
# Build and run BEFORE tests
docker build -t song-update-tests . && docker run --rm song-update-tests npm run test:before
```

```bash
# Build and run AFTER tests
docker build -t song-update-tests . && docker run --rm song-update-tests npm run test:after
```

```bash
Build and run EVALUATION
docker build -t song-update-tests . && docker run --rm -v $(pwd)/evaluation:/app/evaluation song-update-tests npm run evaluate
```