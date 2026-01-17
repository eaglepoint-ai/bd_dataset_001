import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import '../App.css';
const { API_BASE_URL } = require('../config.js');

console.error('API_BASE_URL', API_BASE_URL);
const CreateForm = (): JSX.Element => {
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [album, setAlbum] = useState<string>('');
  const [genre, setGenre] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    // Send a POST request to create a new song
    axios
      .post(`${API_BASE_URL}/songs`, { title, artist, album, genre })
      .then(response => {
        console.log('Song created:', response.data);
        // Reset the form after successful creation
        setTitle('');
        setArtist('');
        setAlbum('');
        setGenre('');
        setIsSuccess(true);
      })
      .catch(error => {
        if (error.response && error.response.status === 400) {
          console.error(error.response.data);
        } else {
          console.error('Error creating song:', error);
        }
      });
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setTitle(event.target.value);
  };

  const handleArtistChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setArtist(event.target.value);
  };

  const handleAlbumChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setAlbum(event.target.value);
  };

  const handleGenreChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setGenre(event.target.value);
  };

  return (
    <div className="song-form-container">
      <h1 className="form-heading">Create Song</h1>
      {isSuccess && <p className="success-message">Song recorded successfully!</p>}
      <form className="song-form" onSubmit={handleSubmit}>
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
        <button type="submit" className="form-button">Create</button>
      </form>
    </div>
  );
};

export default CreateForm;
