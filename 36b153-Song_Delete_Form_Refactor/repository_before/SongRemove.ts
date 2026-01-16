import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import '../App.css';
const { API_BASE_URL } = require('../config.js');

const RemoveForm = (): JSX.Element => {
	const [id, setId] = useState<string>('');
	const [isSuccess, setIsSuccess] = useState<boolean>(false);

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		
		axios.delete(`${API_BASE_URL}/songs/${id}`)
			.then(response => {
				console.log('Song deleted:', response.data);
				// Reset the form
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

		return (
			<div className="song-form-container">
				<h1 className="form-heading">Delete Song</h1>
				{isSuccess && <p className="success-message">Song deleted successfully!</p>}
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
						<button type="submit" className="form-button delete">Delete</button>
					</form>
			</div>
	);
};

export default RemoveForm;
