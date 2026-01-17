import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateSongsForm from "./CreateSongs";
import {
  createSong,
  createCancelToken,
  getErrorMessage,
} from "../services/songService";
import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";

// Mock the service
vi.mock("../services/songService", () => ({
  createSong: vi.fn(),
  createCancelToken: vi.fn(),
  isRequestCancelled: vi.fn(),
  getErrorMessage: vi.fn((error) => (error as Error).message),
}));

describe("CreateSongsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createCancelToken as Mock).mockReturnValue({
      token: "mock-token",
      cancel: vi.fn(),
    });
  });

  it("renders correctly with initial state", () => {
    render(<CreateSongsForm />);

    expect(
      screen.getByRole("heading", { name: /create song/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/artist/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/album/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });

  it("handles input changes", async () => {
    const user = userEvent.setup();
    render(<CreateSongsForm />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, "Test Song");

    expect(titleInput).toHaveValue("Test Song");
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<CreateSongsForm />);

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/artist is required/i)).toBeInTheDocument();
    expect(screen.getByText(/album is required/i)).toBeInTheDocument();
    expect(screen.getByText(/genre is required/i)).toBeInTheDocument();
    expect(createSong).not.toHaveBeenCalled();
  });

  it("validates fields on blur", async () => {
    const user = userEvent.setup();
    render(<CreateSongsForm />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.click(titleInput);
    await user.tab(); // Blur
    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();

    await user.type(titleInput, "Valid Title");
    // Errors for title should disappear
    expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
  });

  it("submits the form successfully with trimmed data", async () => {
    const user = userEvent.setup();
    (createSong as Mock).mockResolvedValue({});

    render(<CreateSongsForm />);

    await user.type(screen.getByLabelText(/title/i), "  My Song  ");
    await user.type(screen.getByLabelText(/artist/i), "Artist Name");
    await user.type(screen.getByLabelText(/album/i), "Album Name");
    await user.type(screen.getByLabelText(/genre/i), "Rock");

    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(createSong).toHaveBeenCalledWith(
      {
        title: "My Song",
        artist: "Artist Name",
        album: "Album Name",
        genre: "Rock",
      },
      "mock-token",
    );

    await waitFor(() => {
      expect(
        screen.getByText(/song recorded successfully/i),
      ).toBeInTheDocument();
    });

    // Form fields should be cleared
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
  });

  it("handles API errors gracefully", async () => {
    const user = userEvent.setup();
    const errorMessage = "Network Error";
    (createSong as Mock).mockRejectedValue(new Error(errorMessage));
    (getErrorMessage as Mock).mockReturnValue(errorMessage);

    render(<CreateSongsForm />);

    await user.type(screen.getByLabelText(/title/i), "Test");
    await user.type(screen.getByLabelText(/artist/i), "Test");
    await user.type(screen.getByLabelText(/album/i), "Test");
    await user.type(screen.getByLabelText(/genre/i), "Test");

    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("disables button while loading", async () => {
    const user = userEvent.setup();
    (createSong as Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<CreateSongsForm />);

    await user.type(screen.getByLabelText(/title/i), "Test");
    await user.type(screen.getByLabelText(/artist/i), "Test");
    await user.type(screen.getByLabelText(/album/i), "Test");
    await user.type(screen.getByLabelText(/genre/i), "Test");

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
