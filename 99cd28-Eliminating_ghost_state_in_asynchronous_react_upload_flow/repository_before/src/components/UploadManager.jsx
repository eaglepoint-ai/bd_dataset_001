import React, { useState } from "react";
import api from "../utils/api";
import UI from "./UI";

function UploadManager({ file }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    try {
      await api.upload(file);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const cancel = () => {
    setLoading(false);
    setSuccess(false); // If called during the timeout, the timeout still fires!
  };

  return (
    <UI
      loading={loading}
      error={error}
      success={success}
      onUpload={handleUpload}
      onCancel={cancel}
    />
  );
}

export default UploadManager;
