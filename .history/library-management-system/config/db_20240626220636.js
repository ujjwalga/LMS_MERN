const mongoose = require('mongoose');
const dotenv = require('dotenv');

const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected...');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  };
  
  module.exports = connectDB;
  3. Create Models
  models/Book.js
  
  javascript
  Copy code
  const mongoose = require('mongoose');
  
  const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    available: { type: Boolean, default: true },
  });
  
  module.exports = mongoose.model('Book', bookSchema);
  models/User.js
  
  javascript
  Copy code
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  });
  
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
  
  module.exports = mongoose.model('User', userSchema);
  models/RentalRecord.js
  
  javascript
  Copy code
  const mongoose = require('mongoose');
  
  const rentalRecordSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
  });
  
  module.exports = mongoose.model('RentalRecord', rentalRecordSchema);
  4. Create Controllers
  controllers/bookController.js
  
  javascript
  Copy code
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
  controllers/userController.js
  
  javascript
  Copy code
  const User = require('../models/User');
  const jwt = require('jsonwebtoken');
  
  exports.register = async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = new User({ username, password });
      await user.save();
      res.status(201).send({ message: 'User registered' });
    } catch (error) {
      res.status(400).send(error);
    }
  };
  
  exports.login = async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) return res.status(400).send({ message: 'Invalid credentials' });
  
      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.status(400).send({ message: 'Invalid credentials' });
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.send({ token });
    } catch (error) {
      res.status(400).send(error);
    }
  };
  controllers/borrowController.js
  
  javascript
  Copy code
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
  5. Create Routes
  routes/bookRoutes.js
  
  javascript
  Copy code
  const express = require('express');
  const { addBook, getBooks, updateBook, deleteBook } = require('../controllers/bookController');
  const router = express.Router();
  
  router.post('/', addBook);
  router.get('/', getBooks);
  router.put('/:id', updateBook);
  router.delete('/:id', deleteBook);
  
  module.exports = router;
  routes/userRoutes.js
  
  javascript
  Copy code
  const express = require('express');
  const { register, login } = require('../controllers/userController');
  const router = express.Router();
  
  router.post('/register', register);
  router.post('/login', login);
  
  module.exports = router;
  routes/borrowRoutes.js
  
  javascript
  Copy code
  const express = require('express');
  const { borrowBook, returnBook, getRentalRecords } = require('../controllers/borrowController');
  const router = express.Router();
  
  router.post('/borrow', borrowBook);
  router.post('/return/:rentalId', returnBook);
  router.get('/', getRentalRecords);
  
  module.exports = router;
  6. Create the Server
  server.js
  
  javascript
  Copy code
  const express = require('express');
  const bodyParser = require('body-parser');
  const connectDB = require('./config/db');
  const bookRoutes = require('./routes/bookRoutes');
  const userRoutes = require('./routes/userRoutes');
  const borrowRoutes = require('./routes/borrowRoutes');
  const dotenv = require('dotenv');
  
  dotenv.config();
  connectDB();
  
  const app = express();
  
  app.use(bodyParser.json());
  
  app.use('/api/books', bookRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/borrow', borrowRoutes);
  
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
  
  
  
  
  
  
  const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected...');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  };
  
  module.exports = connectDB;
  3. Create Models
  models/Book.js
  
  javascript
  Copy code
  const mongoose = require('mongoose');
  
  const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    available: { type: Boolean, default: true },
  });
  
  module.exports = mongoose.model('Book', bookSchema);
  models/User.js
  
  javascript
  Copy code
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  });
  
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
  
  module.exports = mongoose.model('User', userSchema);
  models/RentalRecord.js
  
  javascript
  Copy code
  const mongoose = require('mongoose');
  
  const rentalRecordSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
  });
  
  module.exports = mongoose.model('RentalRecord', rentalRecordSchema);
  4. Create Controllers
  controllers/bookController.js
  
  javascript
  Copy code
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
  controllers/userController.js
  
  javascript
  Copy code
  const User = require('../models/User');
  const jwt = require('jsonwebtoken');
  
  exports.register = async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = new User({ username, password });
      await user.save();
      res.status(201).send({ message: 'User registered' });
    } catch (error) {
      res.status(400).send(error);
    }
  };
  
  exports.login = async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) return res.status(400).send({ message: 'Invalid credentials' });
  
      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.status(400).send({ message: 'Invalid credentials' });
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.send({ token });
    } catch (error) {
      res.status(400).send(error);
    }
  };
  controllers/borrowController.js
  
  javascript
  Copy code
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
  5. Create Routes
  routes/bookRoutes.js
  
  javascript
  Copy code
  const express = require('express');
  const { addBook, getBooks, updateBook, deleteBook } = require('../controllers/bookController');
  const router = express.Router();
  
  router.post('/', addBook);
  router.get('/', getBooks);
  router.put('/:id', updateBook);
  router.delete('/:id', deleteBook);
  
  module.exports = router;
  routes/userRoutes.js
  
  javascript
  Copy code
  const express = require('express');
  const { register, login } = require('../controllers/userController');
  const router = express.Router();
  
  router.post('/register', register);
  router.post('/login', login);
  
  module.exports = router;
  routes/borrowRoutes.js
  
  javascript
  Copy code
  const express = require('express');
  const { borrowBook, returnBook, getRentalRecords } = require('../controllers/borrowController');
  const router = express.Router();
  
  router.post('/borrow', borrowBook);
  router.post('/return/:rentalId', returnBook);
  router.get('/', getRentalRecords);
  
  module.exports = router;
  6. Create the Server
  server.js
  
  javascript
  Copy code
  const express = require('express');
  const bodyParser = require('body-parser');
  const connectDB = require('./config/db');
  const bookRoutes = require('./routes/bookRoutes');
  const userRoutes = require('./routes/userRoutes');
  const borrowRoutes = require('./routes/borrowRoutes');
  const dotenv = require('dotenv');
  
  dotenv.config();
  connectDB();
  
  const app = express();
  
  app.use(bodyParser.json());
  
  app.use('/api/books', bookRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/borrow', borrowRoutes);
  
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
  
  
  
  
  
  
    