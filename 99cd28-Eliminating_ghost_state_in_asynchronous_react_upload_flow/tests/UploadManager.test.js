import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Determine which repository to test based on environment variable
const repoPath = process.env.REPO_PATH || '../repository_before';

// Dynamic import based on repository path
let UploadManager;
let api;

beforeAll(async () => {
  // Mock the API module
  jest.doMock(`${repoPath}/src/utils/api.js`, () => ({
    default: {
      upload: jest.fn(),
    },
  }));

  // Import the component and API after mocking
  const { default: Component } = await import(`${repoPath}/src/components/UploadManager.jsx`);
  const { default: ApiModule } = await import(`${repoPath}/src/utils/api.js`);
  
  UploadManager = Component;
  api = ApiModule;
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('UploadManager Component', () => {
  test('renders upload interface correctly', () => {
    render(<UploadManager file="test.txt" />);
    
    expect(screen.getByText('Upload Manager')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('shows loading state during upload', async () => {
    api.upload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(uploadButton).toBeDisabled();
  });

  test('shows success message after successful upload', async () => {
    api.upload.mockResolvedValue({ success: true });
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
  });

  test('shows error message after failed upload', async () => {
    api.upload.mockRejectedValue(new Error('Upload failed'));
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Upload failed')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
  });

  test('clears success message after timeout', async () => {
    api.upload.mockResolvedValue({ success: true });
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
    });
    
    // Fast-forward time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Upload Successful!')).not.toBeInTheDocument();
    });
  });

  test('cancel button resets all states', async () => {
    api.upload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    const cancelButton = screen.getByText('Cancel');
    
    fireEvent.click(uploadButton);
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    expect(uploadButton).not.toBeDisabled();
  });

  // Ghost state tests - these should pass for repository_after and fail for repository_before
  test('prevents ghost state from stale success timeout', async () => {
    api.upload.mockResolvedValue({ success: true });
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    const cancelButton = screen.getByText('Cancel');
    
    // First upload
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
    });
    
    // Cancel before timeout
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Upload Successful!')).not.toBeInTheDocument();
    
    // Fast-forward time by 3 seconds (original timeout)
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Success message should NOT reappear (ghost state prevention)
    expect(screen.queryByText('Upload Successful!')).not.toBeInTheDocument();
  });

  test('prevents ghost state from overlapping uploads', async () => {
    let resolveFirst, resolveSecond;
    
    api.upload
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve; }));
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    
    // Start first upload
    fireEvent.click(uploadButton);
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    
    // Start second upload while first is still pending
    fireEvent.click(uploadButton);
    
    // Resolve first upload (should be ignored due to race condition)
    act(() => {
      resolveFirst({ success: true });
    });
    
    // Should still be loading (second upload)
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
    
    // Resolve second upload
    act(() => {
      resolveSecond({ success: true });
    });
    
    // Should show success for second upload only
    await waitFor(() => {
      expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
    });
  });

  test('prevents ghost state from stale error updates', async () => {
    let rejectFirst, resolveSecond;
    
    api.upload
      .mockImplementationOnce(() => new Promise((resolve, reject) => { rejectFirst = reject; }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve; }));
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    
    // Start first upload
    fireEvent.click(uploadButton);
    
    // Start second upload
    fireEvent.click(uploadButton);
    
    // First upload fails (should be ignored)
    act(() => {
      rejectFirst(new Error('First upload failed'));
    });
    
    // Should still be loading (second upload)
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.queryByText('Error: First upload failed')).not.toBeInTheDocument();
    
    // Second upload succeeds
    act(() => {
      resolveSecond({ success: true });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
    });
  });

  test('maintains state consistency during rapid interactions', async () => {
    api.upload.mockResolvedValue({ success: true });
    
    render(<UploadManager file="test.txt" />);
    
    const uploadButton = screen.getByText('Upload');
    const cancelButton = screen.getByText('Cancel');
    
    // Rapid sequence: upload -> cancel -> upload -> cancel
    fireEvent.click(uploadButton);
    fireEvent.click(cancelButton);
    fireEvent.click(uploadButton);
    fireEvent.click(cancelButton);
    
    // Should end in clean state
    expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload Successful!')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    expect(uploadButton).not.toBeDisabled();
  });

  test('component stays under 50 lines of code', async () => {
    // This test reads the component file and counts lines
    const fs = await import('fs');
    const path = await import('path');
    
    const componentPath = path.resolve(process.cwd(), `${repoPath}/src/components/UploadManager.jsx`);
    const componentCode = fs.readFileSync(componentPath, 'utf8');
    const lines = componentCode.split('\n').filter(line => line.trim() !== '').length;
    
    expect(lines).toBeLessThanOrEqual(50);
  });
});