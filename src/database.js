const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

let db;

async function openDatabase() {
  if (db) return db;

  const dataDirectory = path.join(__dirname, '..', 'data');
  // Create the directory automatically because ZIP extractors may omit empty folders.
  fs.mkdirSync(dataDirectory, { recursive: true });

  db = await open({
    filename: path.join(dataDirectory, 'books.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL CHECK(price >= 0)
    )
  `);

  const row = await db.get('SELECT COUNT(*) AS count FROM book');
  if (row.count === 0) {
    const sampleBooks = [
      ['The Alchemist', 'Paulo Coelho', 299],
      ['Wings of Fire', 'A. P. J. Abdul Kalam', 250],
      ['Atomic Habits', 'James Clear', 450],
      ['Clean Code', 'Robert C. Martin', 650],
      ['The Pragmatic Programmer', 'Andrew Hunt', 599],
      ['Introduction to Algorithms', 'Thomas H. Cormen', 899],
      ['Rich Dad Poor Dad', 'Robert Kiyosaki', 350],
      ['Think Like a Programmer', 'V. Anton Spraul', 499],
      ['Deep Work', 'Cal Newport', 399],
      ['Zero to One', 'Peter Thiel', 320]
    ];
    const insert = await db.prepare(
      'INSERT INTO book (title, author, price) VALUES (?, ?, ?)'
    );
    try {
      for (const book of sampleBooks) {
        await insert.run(...book);
      }
    } finally {
      await insert.finalize();
    }
  }

  return db;
}

function getDatabase() {
  if (!db) throw new Error('Database has not been initialized');
  return db;
}

module.exports = { openDatabase, getDatabase };
