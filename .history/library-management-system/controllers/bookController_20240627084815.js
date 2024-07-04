const Book = require('../models/Book');

exports.addBook = async (req, res) => {
  try {
    const { title, author } = req.body;
    const book = new Book({ title, author });
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, available } = req.body;
    const book = await Book.findByIdAndUpdate(id, { title, author, available }, { new: true });
    res.json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    await Book.findByIdAndDelete(id);
    res.json({ message: 'Book deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
