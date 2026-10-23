-- Heart ratings left on each day's page.
CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Answers from the "Share your experience" form.
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experience TEXT,
  frequency TEXT,
  satisfaction INTEGER CHECK (satisfaction BETWEEN 1 AND 5),
  improve_area TEXT,
  improve_text TEXT,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
