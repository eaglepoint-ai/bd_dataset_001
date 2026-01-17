import React from "react";

function UI({ loading, error, success, onUpload, onCancel }) {
  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxWidth: "300px",
      }}
    >
      <h3>Upload Manager</h3>
      {loading && <p>Uploading...</p>}
      {success && <p style={{ color: "green" }}>Upload Successful!</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={onUpload}
          disabled={loading}
          style={{ marginRight: "10px" }}
        >
          Upload
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default UI;
