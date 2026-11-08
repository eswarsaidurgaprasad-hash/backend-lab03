const express = require('express');
const { openDatabase } = require('./src/database');
const bookRoutes = require('./src/routes/books');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Books REST API is running',
    endpoints: {
      list: 'GET /books',
      getOne: 'GET /books/:id',
      create: 'POST /books',
      update: 'PUT /books/:id',
      delete: 'DELETE /books/:id'
    }
  });
});

app.use('/books', bookRoutes);

// Handle invalid JSON and other request errors consistently.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON request body' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  try {
    await openDatabase();
    app.listen(PORT, () => {
      console.log(`Books REST API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
}

startServer();
