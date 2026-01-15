package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const (
	MaxFileSize      = 10 << 20 // 10 MB
	UploadDir        = "./uploads"
	AllowedMimeTypes = "image/jpeg,image/png,application/pdf"
	ServerPort       = ":8080"
)

// UploadMetadata tracks file upload information
type UploadMetadata struct {
	OriginalName string
	SavedName    string
	Size         int64
	MimeType     string
	Checksum     string
	UploadedAt   time.Time
}

type FileValidator struct {
	allowedTypes map[string]bool
	maxSize      int64
}

func NewFileValidator(mimeTypes string, maxSize int64) *FileValidator {
	allowed := make(map[string]bool)
	for _, mt := range strings.Split(mimeTypes, ",") {
		allowed[strings.TrimSpace(mt)] = true
	}
	return &FileValidator{
		allowedTypes: allowed,
		maxSize:      maxSize,
	}
}

func (fv *FileValidator) ValidateFile(size int64, mimeType string) error {
	if size > fv.maxSize {
		return fmt.Errorf("file size %d exceeds maximum %d bytes", size, fv.maxSize)
	}
	if !fv.allowedTypes[mimeType] {
		return fmt.Errorf("MIME type %s not allowed", mimeType)
	}
	return nil
}

type FileProcessor struct {
	uploadDir string
	mutex     sync.Mutex
}

func NewFileProcessor(dir string) (*FileProcessor, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}
	return &FileProcessor{uploadDir: dir}, nil
}

func (fp *FileProcessor) SaveFile(file io.Reader, originalName string) (*UploadMetadata, error) {
	fp.mutex.Lock()
	defer fp.mutex.Unlock()

	timestamp := time.Now().Unix()
	ext := filepath.Ext(originalName)
	savedName := fmt.Sprintf("%d_%s%s", timestamp, generateRandomString(8), ext)
	destPath := filepath.Join(fp.uploadDir, savedName)

	destFile, err := os.Create(destPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer destFile.Close()

	hash := sha256.New()
	multiWriter := io.MultiWriter(destFile, hash)

	written, err := io.Copy(multiWriter, file)
	if err != nil {
		os.Remove(destPath) 
		return nil, fmt.Errorf("failed to write file: %w", err)
	}

	checksum := hex.EncodeToString(hash.Sum(nil))

	return &UploadMetadata{
		OriginalName: originalName,
		SavedName:    savedName,
		Size:         written,
		Checksum:     checksum,
		UploadedAt:   time.Now(),
	}, nil
}

type UploadHandler struct {
	validator *FileValidator
	processor *FileProcessor
}

func NewUploadHandler(validator *FileValidator, processor *FileProcessor) *UploadHandler {
	return &UploadHandler{
		validator: validator,
		processor: processor,
	}
}

func (uh *UploadHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		fmt.Fprintf(w, `{"success": false, "error": "Method not allowed"}`)
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"success": false, "error": "Failed to parse form: %s"}`, err.Error())
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"success": false, "error": "No file uploaded: %s"}`, err.Error())
		return
	}
	defer file.Close()

	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, `{"success": false, "error": "Failed to read file"}`)
		return
	}
	mimeType := http.DetectContentType(buffer[:n])

	if seeker, ok := file.(io.Seeker); ok {
		seeker.Seek(0, 0)
	}

	if err := uh.validator.ValidateFile(header.Size, mimeType); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"success": false, "error": "%s"}`, err.Error())
		return
	}

	metadata, err := uh.processor.SaveFile(file, header.Filename)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, `{"success": false, "error": "Failed to save file: %s"}`, err.Error())
		return
	}

	metadata.MimeType = mimeType

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"success": true, "filename": "%s", "original_name": "%s", "size": %d, "mime_type": "%s", "checksum": "%s", "uploaded_at": "%s"}`, 
		metadata.SavedName, metadata.OriginalName, metadata.Size, 
		metadata.MimeType, metadata.Checksum, metadata.UploadedAt.Format(time.RFC3339))
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[time.Now().UnixNano()%int64(len(charset))]
		time.Sleep(1 * time.Nanosecond)
	}
	return string(result)
}

func main() {
	validator := NewFileValidator(AllowedMimeTypes, MaxFileSize)
	processor, err := NewFileProcessor(UploadDir)
	if err != nil {
		fmt.Printf("Error initializing processor: %v\n", err)
		os.Exit(1)
	}

	handler := NewUploadHandler(validator, processor)
	http.Handle("/upload", handler)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `
<!DOCTYPE html>
<html>
<head>
    <title>File Upload</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .upload-form { border: 2px dashed #ccc; padding: 30px; border-radius: 8px; }
        input[type="file"] { display: block; margin: 20px 0; padding: 10px; }
        button { background: #4CAF50; color: white; padding: 12px 30px; border: none; 
                 border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #45a049; }
        #result { margin-top: 20px; padding: 15px; border-radius: 4px; display: none; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    </style>
</head>
<body>
    <h2>Single File Upload</h2>
    <div class="upload-form">
        <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" name="file" id="fileInput" required accept="image/jpeg,image/png,application/pdf">
            <button type="submit">Upload File</button>
        </form>
        <div id="result"></div>
    </div>
    
    <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            const fileInput = document.getElementById('fileInput');
            const resultDiv = document.getElementById('result');
            
            if (!fileInput.files[0]) {
                resultDiv.className = 'error';
                resultDiv.textContent = 'Please select a file';
                resultDiv.style.display = 'block';
                return;
            }
            
            formData.append('file', fileInput.files[0]);
            
            resultDiv.textContent = 'Uploading...';
            resultDiv.className = '';
            resultDiv.style.display = 'block';
            
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const text = await response.text();
                console.log('Response:', text);
                
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    throw new Error('Invalid JSON response: ' + text);
                }
                
                if (response.ok && data.success) {
                    resultDiv.className = 'success';
                    resultDiv.innerHTML = '<strong>Upload Successful!</strong><br>' +
                        'File: ' + data.filename + '<br>' +
                        'Size: ' + (data.size / 1024).toFixed(2) + ' KB<br>' +
                        'Type: ' + data.mime_type + '<br>' +
                        'Checksum: ' + data.checksum;
                    fileInput.value = '';
                } else {
                    resultDiv.className = 'error';
                    resultDiv.textContent = 'Upload failed: ' + (data.error || 'Unknown error');
                }
                resultDiv.style.display = 'block';
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.textContent = 'Upload error: ' + error.message;
                resultDiv.style.display = 'block';
                console.error('Error:', error);
            }
        });
    </script>
</body>
</html>`)
	})

	fmt.Printf("Server starting on %s\n", ServerPort)
	if err := http.ListenAndServe(ServerPort, nil); err != nil {
		fmt.Printf("Server error: %v\n", err)
	}
}