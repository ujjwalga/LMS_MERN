const Book = require('../models/Book')

exports.addBook = async (req, res) =>{
    try{
    const book = new Book(req.body);
    await book.save;
    res.status(201).send(book);
    }catch(error){
        res.status(400).send(error);
    }
};

exports.getBook = async (req, res) =>{
    try{
        const books = Book.find();
        res.send(books);
    }catch(error){
        res.status(500).send(error);
    }
}