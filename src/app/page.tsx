"use client";

import { useEffect, useMemo, useState } from "react";

type Note = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedNote = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return notes.find((n) => n.id === selectedId) ?? null;
  }, [notes, selectedId]);

  async function fetchNotes() {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data);
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  function startCreate() {
    setSelectedId("new");
    setTitle("");
    setContent("");
  }

  function selectExisting(id: number) {
    setSelectedId(id);
    const note = notes.find((n) => n.id === id);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }

  async function saveNote(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      if (selectedId === "new") {
        await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
      } else if (typeof selectedId === "number") {
        await fetch(`/api/notes/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
      }
      await fetchNotes();
      setSelectedId(null);
      setTitle("");
      setContent("");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id: number) {
    setLoading(true);
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      await fetchNotes();
      if (selectedId === id) {
        setSelectedId(null);
        setTitle("");
        setContent("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen grid grid-cols-[280px_1fr]">
      <aside className="border-r bg-gray-50 dark:bg-zinc-900 p-4 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">My Notes</h1>
          <button
            onClick={startCreate}
            className="bg-blue-600 text-white px-3 py-1.5 rounded"
          >
            New
          </button>
        </div>
        <ul className="space-y-1">
          {notes.map((n) => (
            <li key={n.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => selectExisting(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectExisting(n.id);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-zinc-800 ${selectedId === n.id ? "bg-gray-200 dark:bg-zinc-800" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium truncate">{n.title || "Untitled"}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(n.id);
                    }}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{n.content}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <main className="p-6 overflow-y-auto">
        {selectedId === null && (
          <div className="text-gray-600">Select a note on the left or create a new one.</div>
        )}
        {(selectedId === "new" || selectedNote) && (
          <form onSubmit={saveNote} className="max-w-2xl space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded p-3 text-lg"
              required
            />
            <textarea
              placeholder="Write your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border rounded p-3 min-h-[300px]"
              required
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              {typeof selectedId === "number" && (
                <button
                  type="button"
                  onClick={() => deleteNote(selectedId)}
                  disabled={loading}
                  className="text-red-600 px-4 py-2 border border-red-600 rounded disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
