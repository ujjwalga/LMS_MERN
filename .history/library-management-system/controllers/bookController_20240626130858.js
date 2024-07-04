const Book = require('../models/Book')

exports.addBook = async (req, res) =>{
    try{
    const book = new Book(req.body);
    await book.save;
    res.status(201).send(book);
    }catch(error){
        res.status(400)
    }
}