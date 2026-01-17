import React, { useState, useRef, useCallback } from "react";
import api from "../utils/api";
import UI from "./UI";

function UploadManager({ file }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const uploadIdRef = useRef(0);
  const timeoutRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleUpload = async () => {
    clearTimers();
    const currentUploadId = ++uploadIdRef.current;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await api.upload(file);
      if (currentUploadId === uploadIdRef.current) {
        setSuccess(true);
        setLoading(false);
        timeoutRef.current = setTimeout(() => {
          if (currentUploadId === uploadIdRef.current) setSuccess(false);
        }, 3000);
      }
    } catch (e) {
      if (currentUploadId === uploadIdRef.current) {
        setError(e.message);
        setLoading(false);
      }
    }
  };

  const cancel = () => {
    clearTimers();
    uploadIdRef.current++;
    setLoading(false);
    setSuccess(false);
    setError(null);
  };

  return <UI loading={loading} error={error} success={success} onUpload={handleUpload} onCancel={cancel} />;
}

export default UploadManager;