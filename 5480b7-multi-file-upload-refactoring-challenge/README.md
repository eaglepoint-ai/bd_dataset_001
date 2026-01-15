PROMPT

You're a Senior Backend Engineer at a document management startup. The sales team just closed a $2M enterprise contract with a legal firm that processes hundreds of case files daily. Their workflow requires uploading 5-50 documents simultaneously per case. The current single-file uploader is causing massive productivity bottlenecks. Your tech lead has assigned you to refactor the existing UploadHandler system to support concurrent multi-file uploads while maintaining all existing security guarantees and adding transactional integrity.

Critical Context

The existing codebase has several architectural landmines:
The FileProcessor.mutex protects disk I/O - but it's too coarse-grained for concurrent uploads
MIME detection requires reading then seeking - this pattern must work for N files concurrently
The random filename generator uses time.Now() - calling it rapidly creates collisions
Validation happens before saving - but you need atomic "all-or-nothing" semantics

PROBLEM STATEMENT

The current upload implementation only supports single-file uploads and does not scale to real-world workflows that require batch document processing. Attempts to extend concurrency have introduced correctness issues, including inconsistent validation behavior and nondeterministic failures under load.

Several architectural issues contribute to instability. Coarse-grained locking prevents safe concurrency, timestamp-based filename generation leads to collisions, and the validation pipeline lacks atomic guarantees. Form parsing logic is brittle and does not correctly support both legacy single-file clients and newer batch workflows.

The objective is to refactor the upload system to provide correct concurrent behavior, atomic multi-file transactions, deterministic filename generation, and reliable error reporting. The system must process files efficiently using streaming I/O, avoid excessive memory usage, and provide strong correctness guarantees even under concurrent request load.

REQUIREMENTS

Upload Behavior
Single Upload Compatibility

Field: file

Must continue to work for existing clients
Response must use single-file JSON format
Batch Upload Support

Field: files

Accept between 1 and 10 files per request
Must process files concurrently using goroutines

Validation Rules

All files must be validated before any file is saved
If any file fails validation, no files are saved
Validation errors must be reported per file
Transactional Guarantees
Saving must be atomic
If a failure occurs during save, all previously saved files must be deleted
Rollback must be fast and deterministic
Error Handling
Distinguish between validation errors and I/O errors
Return structured JSON error responses

Each file must include:

Filename
Status (ok or failed)
Error message if failed
Concurrency Constraints

Must use proper synchronization:

sync.WaitGroup
Channels
Fine-grained mutex usage
Concurrent uploads must not interfere with one another
Remove global shared state where possible
Fix race conditions in filename generation
Memory and Performance Constraints
Files must be processed as streams
Must not load entire files into memory
Must not use io.ReadAll or equivalent
Memory usage must remain under 50MB

Performance targets:

10 concurrent files processed in under 500ms
Rollback must complete in under 100ms

Architectural Issues to Resolve

MIME Detection Deadlock
Reading and seeking must work safely across concurrent files
Mutex Granularity
Avoid coarse locks around disk I/O
Atomic Rollback
Implement safe cleanup when failures occur
Filename Collision
Replace timestamp-based randomness with collision-safe generation
Form Parsing Limits
Correctly handle both file and files fields

SUCCESS CRITERIA

Single-file uploads remain fully functional
Three valid files result in all files saved
Any invalid file results in zero files saved
Partial I/O failure triggers full rollback
Duplicate original filenames never collide
Concurrent uploads behave deterministically
Memory usage remains bounded under load
No race conditions under go test -race

TECH STACK

Language: Go (Golang)
HTTP Server: net/http (standard library only)
Concurrency: goroutines, sync.WaitGroup, channels
File I/O: os, io, multipart
JSON: encoding/json
Testing: Go standard testing framework
Dependencies: No third-party packages allowed