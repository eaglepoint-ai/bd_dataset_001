import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import '../App.css';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

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
