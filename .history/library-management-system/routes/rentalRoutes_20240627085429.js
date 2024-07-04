const express = require('express');
const { borrowBook, returnBook, getRentalRecords } = require('../controllers/borrowController');
const router = express.Router();

router.post('/borrow', borrowBook);
router.post('/return/:rentalId', returnBook);
router.get('/', getRentalRecords);

module.exports = router;
