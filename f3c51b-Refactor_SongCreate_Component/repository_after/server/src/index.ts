import { Hono } from "hono";
import { cors } from "hono/cors";
import { CreateSongRequest, Song } from "./types";

const songs: Song[] = [];

// Helper to generate mock MongoDB ObjectId (24 chars hex)
const generateId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = "xxxxxxxxxxxxxxxx".replace(/[x]/g, () =>
    ((Math.random() * 16) | 0).toString(16),
  );
  return (timestamp + random).toLowerCase();
};

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Validation helper
const validateSongData = (
  data: Partial<CreateSongRequest>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    errors.push("Title is required");
  }
  if (!data.artist || typeof data.artist !== "string" || !data.artist.trim()) {
    errors.push("Artist is required");
  }
  if (!data.album || typeof data.album !== "string" || !data.album.trim()) {
    errors.push("Album is required");
  }
  if (!data.genre || typeof data.genre !== "string" || !data.genre.trim()) {
    errors.push("Genre is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const app = new Hono();

// Enable CORS for all routes
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// Create a new song
app.post("/songs", async (c) => {
  try {
    const body = await c.req.json<CreateSongRequest>();

    // Validate request body
    const validation = validateSongData(body);
    if (!validation.isValid) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid song data",
          details: validation.errors,
        },
        400,
      );
    }

    const existingSong = songs.find(
      (s) => s.title.toLowerCase() === body.title.trim().toLowerCase(),
    );
    if (existingSong) {
      return c.json(
        {
          error: "Conflict",
          message: "A song with this title already exists",
        },
        409,
      );
    }

    // Create new song
    const newSong: Song = {
      id: generateId(),
      title: body.title.trim(),
      artist: body.artist.trim(),
      album: body.album.trim(),
      genre: body.genre.trim(),
      createdAt: new Date().toISOString(),
    };

    songs.push(newSong);

    return c.json(
      {
        message: "Song created successfully",
        song: newSong,
      },
      201,
    );
  } catch (error) {
    return c.json(
      {
        error: "Bad Request",
        message: "Invalid JSON body",
      },
      400,
    );
  }
});

// Delete a song
app.delete("/songs/:id", (c) => {
  const id = c.req.param("id");

  // Validate ID format
  if (!isValidObjectId(id)) {
    return c.json(
      {
        error: "Bad Request",
        message: "Invalid ID format: Must be a 24-character hex string",
      },
      400,
    );
  }

  const songIndex = songs.findIndex((s) => s.id === id);

  if (songIndex === -1) {
    return c.json(
      {
        error: "Not Found",
        message: "Song not found",
      },
      404,
    );
  }

  const deletedSong = songs.splice(songIndex, 1)[0];

  return c.json({
    message: "Song deleted successfully",
    song: deletedSong,
  });
});

export default {
  fetch: app.fetch,
  port: 5000,
};
