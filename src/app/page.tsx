"use client";

import { useEffect, useMemo, useState } from "react";

type Folder = {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
};

type Note = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  tags: string;
  folderId: number | null;
  folder: Folder | null;
  createdAt: string;
  updatedAt: string;
};

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<number | "uncategorized" | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const selectedNote = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return notes.find((n) => n.id === selectedId) ?? null;
  }, [notes, selectedId]);

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by folder if selected
    if (selectedFolder === "uncategorized") {
      filtered = notes.filter(note => !note.folderId);
    } else if (selectedFolder && typeof selectedFolder === "number") {
      filtered = notes.filter(note => note.folderId === selectedFolder);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notes, searchQuery, selectedFolder]);

  const groupedNotes = useMemo(() => {
    const groups: { [key: string]: Note[] } = {};

    filteredNotes.forEach(note => {
      const date = new Date(note.createdAt);
      const monthYear = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(note);
    });

    // Sort groups by date (newest first)
    return Object.entries(groups).sort(([a], [b]) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredNotes]);

  async function fetchNotes() {
    try {
      const res = await fetch("/api/notes");
      
      if (!res.ok) {
        throw new Error("Failed to fetch notes");
      }
      
      const data = await res.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
    }
  }

  async function fetchFolders() {
    try {
      const res = await fetch("/api/folders");
      
      if (!res.ok) {
        throw new Error("Failed to fetch folders");
      }
      
      const data = await res.json();
      setFolders(data);
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFolders([]);
    }
  }

  useEffect(() => {
    fetchNotes();
    fetchFolders();
  }, []);

  function startCreate() {
    setSelectedId("new");
    setTitle("");
    setContent("");
    setPinned(false);
    setTags("");
    setFolderId(selectedFolder === "uncategorized" ? null : selectedFolder as number | null);
  }

  function selectExisting(id: number) {
    setSelectedId(id);
    const note = notes.find((n) => n.id === id);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setPinned(note.pinned);
      setTags(note.tags);
      setFolderId(note.folderId);
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
          body: JSON.stringify({ title, content, pinned, tags, folderId }),
        });
      } else if (typeof selectedId === "number") {
        await fetch(`/api/notes/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, pinned, tags, folderId }),
        });
      }
      await fetchNotes();
      setSelectedId(null);
      setTitle("");
      setContent("");
      setPinned(false);
      setTags("");
      setFolderId(null);
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(id: number) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          pinned: !note.pinned,
          tags: note.tags,
          folderId: note.folderId
        }),
      });
      await fetchNotes();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;

    try {
      await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      await fetchFolders();
      setNewFolderName("");
      setShowCreateFolder(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  }

  async function deleteFolder(id: number) {
    try {
      await fetch(`/api/folders/${id}`, { method: "DELETE" });
      await fetchFolders();
      await fetchNotes();
      if (selectedFolder === id) {
        setSelectedFolder(null);
      }
    } catch (error) {
      console.error("Failed to delete folder:", error);
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

        <div className="relative">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Folder List */}
        <div className="space-y-1">
          <div
            className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${selectedFolder === null ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            onClick={() => setSelectedFolder(null)}
          >
            <span className="text-sm font-medium">All Notes</span>
            <span className="text-xs text-gray-500">{notes.length}</span>
          </div>

          <div
            className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${selectedFolder === "uncategorized" ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            onClick={() => setSelectedFolder("uncategorized")}
          >
            <span className="text-sm font-medium">Uncategorized</span>
            <span className="text-xs text-gray-500">{notes.filter(n => !n.folderId).length}</span>
          </div>

          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${selectedFolder === folder.id ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: folder.color }}
                ></div>
                <span className="text-sm font-medium">{folder.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{folder.notes.length}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs"
                  title="Delete folder"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {showCreateFolder ? (
            <div className="px-2 py-1">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createFolder();
                  } else if (e.key === "Escape") {
                    setShowCreateFolder(false);
                    setNewFolderName("");
                  }
                }}
                className="w-full px-2 py-1 text-sm border rounded"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setShowCreateFolder(true)}
              className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            >
              + New Folder
            </button>
          )}
        </div>
        <div className="space-y-3">
          {groupedNotes.map(([monthYear, monthNotes]) => (
            <div key={monthYear} className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded">
                {monthYear}
              </h3>
              <ul className="space-y-1">
                {monthNotes.map((n) => (
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
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {n.pinned && (
                            <span className="text-yellow-500 text-sm" title="Pinned">📌</span>
                          )}
                          <span className="font-medium truncate">{n.title || "Untitled"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(n.id);
                            }}
                            className="text-gray-500 hover:text-yellow-500 text-sm"
                            title={n.pinned ? "Unpin" : "Pin"}
                          >
                            {n.pinned ? "📌" : "📍"}
                          </button>
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
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{n.content}</p>
                      {n.tags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {n.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        <div>Created: {new Date(n.createdAt).toLocaleDateString()}</div>
                        {n.createdAt !== n.updatedAt && (
                          <div>Updated: {new Date(n.updatedAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>
      <main className="p-6 overflow-y-auto">
        {selectedId === null && (
          <div className="text-gray-600">Select a note on the left or create a new one.</div>
        )}
        {(selectedId === "new" || selectedNote) && (
          <form onSubmit={saveNote} className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 border rounded p-3 text-lg"
                required
              />
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`p-3 rounded border-2 ${pinned
                  ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                  : 'border-gray-300 hover:border-yellow-500'
                  }`}
                title={pinned ? "Unpin note" : "Pin note"}
              >
                {pinned ? "📌" : "📍"}
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border rounded p-3"
              />
            </div>

            <div>
              <select
                value={folderId || ""}
                onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border rounded p-3"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedNote && (
              <div className="text-sm text-gray-600 dark:text-gray-400 border-b pb-2">
                <div>Created: {new Date(selectedNote.createdAt).toLocaleString()}</div>
                {selectedNote.createdAt !== selectedNote.updatedAt && (
                  <div>Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}</div>
                )}
              </div>
            )}
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
