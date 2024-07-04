const RentalRecord = require('../models/RentalRecord');
const Book = require('../models/Book');

exports.borrowBook = async (req, res) => {
  try {
    const { userId, bookId, dueDate } = req.body;
    const book = await Book.findById(bookId);
    if (!book || !book.available) return res.status(400).json({ message: 'Book not available' });

    const rentalRecord = new RentalRecord({ user: userId, book: bookId, dueDate });
    await rentalRecord.save();

    book.available = false;
    await book.save();

    res.status(201).json(rentalRecord);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const rentalRecord = await RentalRecord.findById(rentalId).populate('book');
    if (!rentalRecord) return res.status(400).json({ message: 'Rental record not found' });

    rentalRecord.returnDate = Date.now();
    await rentalRecord.save();

    rentalRecord.book.available = true;
    await rentalRecord.book.save();

    res.json(rentalRecord);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRentalRecords = async (req, res) => {
  try {
    const rentalRecords = await RentalRecord.find().populate('user book');
    res.json(rentalRecords);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
