const Book = require('../models/Book')

exports.addBook = async (req, res) =>{
    const book = new Book(req.body);
    await book.save;
    
}