const express = require('express');
const { getDatabase } = require('../database');

const router = express.Router();
const SORTABLE_COLUMNS = new Set(['id', 'title', 'author', 'price']);

function parseNonNegativeNumber(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
    const error = new Error(`${fieldName} must be a non-negative number`);
    error.status = 400;
    throw error;
  }
  return Number(value);
}

function validateBookBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }
  if (typeof body.title !== 'string' || body.title.trim() === '') {
    return 'title is required and must be a non-empty string';
  }
  if (typeof body.author !== 'string' || body.author.trim() === '') {
    return 'author is required and must be a non-empty string';
  }
  if (body.price === undefined || body.price === null || body.price === '' ||
      !Number.isFinite(Number(body.price))) {
    return 'price is required and must be a number';
  }
  if (Number(body.price) < 0) return 'price must be zero or greater';
  return null;
}

// GET /books - search, sort, filter and paginate.
router.get('/', async (req, res, next) => {
  try {
    const db = getDatabase();
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC'
    } = req.query;

    if (!SORTABLE_COLUMNS.has(order_by)) {
      return res.status(400).json({ message: 'order_by must be id, title, author or price' });
    }

    const sortOrder = String(order).toUpperCase();
    if (!['ASC', 'DESC'].includes(sortOrder)) {
      return res.status(400).json({ message: 'order must be ASC or DESC' });
    }

    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'limit must be an integer between 1 and 100' });
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return res.status(400).json({ message: 'offset must be a non-negative integer' });
    }

    const minPrice = parseNonNegativeNumber(req.query.min_price, 'min_price');
    const maxPrice = parseNonNegativeNumber(req.query.max_price, 'max_price');
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return res.status(400).json({ message: 'min_price cannot be greater than max_price' });
    }

    const conditions = [];
    const params = [];

    if (String(search_q).trim() !== '') {
      conditions.push('title LIKE ?');
      params.push(`%${String(search_q).trim()}%`);
    }
    if (minPrice !== undefined) {
      conditions.push('price >= ?');
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      conditions.push('price <= ?');
      params.push(maxPrice);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const books = await db.all(
      `SELECT id, title, author, price FROM book ${whereClause}
       ORDER BY ${order_by} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return res.status(200).json({
      message: 'Books retrieved successfully',
      count: books.length,
      limit,
      offset,
      data: books
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    next(error);
  }
});

// GET /books/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'id must be a positive integer' });
    }
    const book = await getDatabase().get(
      'SELECT id, title, author, price FROM book WHERE id = ?', id
    );
    if (!book) return res.status(404).json({ message: 'Book not found' });
    return res.status(200).json({ message: 'Book retrieved successfully', data: book });
  } catch (error) { next(error); }
});

// POST /books
router.post('/', async (req, res, next) => {
  try {
    const validationMessage = validateBookBody(req.body);
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    const { title, author, price } = req.body;
    const result = await getDatabase().run(
      'INSERT INTO book (title, author, price) VALUES (?, ?, ?)',
      [title.trim(), author.trim(), Number(price)]
    );
    const createdBook = await getDatabase().get(
      'SELECT id, title, author, price FROM book WHERE id = ?', result.lastID
    );
    return res.status(201).json({
      message: 'Book created successfully',
      data: createdBook
    });
  } catch (error) { next(error); }
});

// PUT /books/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'id must be a positive integer' });
    }
    const validationMessage = validateBookBody(req.body);
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    const db = getDatabase();
    const existing = await db.get('SELECT id FROM book WHERE id = ?', id);
    if (!existing) return res.status(404).json({ message: 'Book not found' });

    const { title, author, price } = req.body;
    await db.run(
      'UPDATE book SET title = ?, author = ?, price = ? WHERE id = ?',
      [title.trim(), author.trim(), Number(price), id]
    );
    const updatedBook = await db.get(
      'SELECT id, title, author, price FROM book WHERE id = ?', id
    );
    return res.status(200).json({
      message: 'Book updated successfully',
      data: updatedBook
    });
  } catch (error) { next(error); }
});

// DELETE /books/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'id must be a positive integer' });
    }
    const db = getDatabase();
    const existing = await db.get('SELECT id FROM book WHERE id = ?', id);
    if (!existing) return res.status(404).json({ message: 'Book not found' });

    await db.run('DELETE FROM book WHERE id = ?', id);
    return res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) { next(error); }
});

module.exports = router;
