import React, { useState } from "react";
import UploadManager from "./components/UploadManager";

function App() {
  const [file, setFile] = useState("test-file.txt");

  return (
    <div className="App">
      <h1>React Upload Manager Demo</h1>
      <div style={{ marginBottom: "20px" }}>
        <label>
          Test Mode:
          <select value={file} onChange={(e) => setFile(e.target.value)}>
            <option value="test-file.txt">Success Case</option>
            <option value="fail">Failure Case</option>
          </select>
        </label>
      </div>
      <UploadManager file={file} />
    </div>
  );
}

export default App;
