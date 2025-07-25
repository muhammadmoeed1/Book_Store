const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const booksFilePath = path.join(__dirname, 'books.json');

async function readBooks() {
    try {
        const data = await fs.readFile(booksFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return [];
        }
        throw err;
    }
}

async function writeBooks(books) {
    await fs.writeFile(booksFilePath, JSON.stringify(books, null, 2), 'utf8');
}

app.get('/books', async (req, res) => {
    try {
        const books = await readBooks();
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read books data' });
    }
});

app.post('/books', async (req, res) => {
    try {
        const { title, author } = req.body;
        
        if (!title || !author) {
            return res.status(400).json({ error: 'Title and author are required' });
        }

        const books = await readBooks();
        const newId = books.length > 0 
            ? Math.max(...books.map(book => parseInt(book.id))) + 1 
            : 1;
        
        const newBook = {
            id: newId.toString(),
            title,
            author,
            createdAt: new Date().toISOString()
        };
        
        books.push(newBook);
        await writeBooks(books);
        
        res.status(201).json(newBook);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add book' });
    }
});

app.get('/books/:id', async (req, res) => {
    try {
        const books = await readBooks();
        const book = books.find(b => b.id === req.params.id);
        
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve book' });
    }
});

app.delete('/books/:id', async (req, res) => {
    try {
        const books = await readBooks();
        const index = books.findIndex(b => b.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        const deletedBook = books.splice(index, 1)[0];
        await writeBooks(books);
        
        res.json(deletedBook);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});