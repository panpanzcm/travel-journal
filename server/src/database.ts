import fs from 'fs';
import path from 'path';

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar: string;
  created_at: string;
}

interface Notebook {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  cover_image: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string;
  is_public: number;
  created_at: string;
  updated_at: string;
}

interface NotebookCollaborator {
  id: number;
  notebook_id: number;
  user_id: number;
  role: string;
  invited_at: string;
}

interface Entry {
  id: number;
  notebook_id: number;
  author_id: number;
  type: string;
  content: string;
  file_path: string;
  thumbnail_path: string;
  latitude: number | null;
  longitude: number | null;
  route_data: string;
  created_at: string;
}

interface Db {
  users: User[];
  notebooks: Notebook[];
  notebook_collaborators: NotebookCollaborator[];
  entries: Entry[];
  nextIds: {
    users: number;
    notebooks: number;
    notebook_collaborators: number;
    entries: number;
  };
}

const dbPath = path.join(__dirname, '..', 'data.json');

let db: Db = {
  users: [],
  notebooks: [],
  notebook_collaborators: [],
  entries: [],
  nextIds: { users: 1, notebooks: 1, notebook_collaborators: 1, entries: 1 }
};

function loadDb() {
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath, 'utf-8');
    db = JSON.parse(data);
  } else {
    saveDb();
  }
}

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function getUsers() { return db.users; }
function getNotebooks() { return db.notebooks; }
function getCollaborators() { return db.notebook_collaborators; }
function getEntries() { return db.entries; }

function addUser(user: Omit<User, 'id' | 'created_at'>) {
  const newUser = { ...user, id: db.nextIds.users++, created_at: new Date().toISOString() };
  db.users.push(newUser);
  saveDb();
  return newUser;
}

function addNotebook(notebook: Omit<Notebook, 'id' | 'created_at' | 'updated_at'>) {
  const now = new Date().toISOString();
  const newNotebook = { ...notebook, id: db.nextIds.notebooks++, created_at: now, updated_at: now };
  db.notebooks.push(newNotebook);
  saveDb();
  return newNotebook;
}

function addCollaborator(collab: Omit<NotebookCollaborator, 'id' | 'invited_at'>) {
  const newCollab = { ...collab, id: db.nextIds.notebook_collaborators++, invited_at: new Date().toISOString() };
  db.notebook_collaborators.push(newCollab);
  saveDb();
  return newCollab;
}

function addEntry(entry: Omit<Entry, 'id' | 'created_at'>) {
  const newEntry = { ...entry, id: db.nextIds.entries++, created_at: new Date().toISOString() };
  db.entries.push(newEntry);
  saveDb();
  return newEntry;
}

function updateNotebook(id: number, data: Partial<Notebook>) {
  const index = db.notebooks.findIndex(n => n.id === id);
  if (index >= 0) {
    db.notebooks[index] = { ...db.notebooks[index], ...data, updated_at: new Date().toISOString() };
    saveDb();
    return db.notebooks[index];
  }
  return null;
}

function updateEntry(id: number, data: Partial<Entry>) {
  const index = db.entries.findIndex(e => e.id === id);
  if (index >= 0) {
    db.entries[index] = { ...db.entries[index], ...data };
    saveDb();
    return db.entries[index];
  }
  return null;
}

function deleteNotebook(id: number) {
  db.notebooks = db.notebooks.filter(n => n.id !== id);
  db.entries = db.entries.filter(e => e.notebook_id !== id);
  db.notebook_collaborators = db.notebook_collaborators.filter(c => c.notebook_id !== id);
  saveDb();
}

function deleteEntry(id: number) {
  db.entries = db.entries.filter(e => e.id !== id);
  saveDb();
}

function removeCollaborator(notebookId: number, userId: number) {
  db.notebook_collaborators = db.notebook_collaborators.filter(c => !(c.notebook_id === notebookId && c.user_id === userId));
  saveDb();
}

loadDb();

export {
  getUsers, getNotebooks, getCollaborators, getEntries,
  addUser, addNotebook, addCollaborator, addEntry,
  updateNotebook, updateEntry,
  deleteNotebook, deleteEntry, removeCollaborator,
  saveDb
};