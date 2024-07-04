const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, req) => {
    try{
        const{username , password} = req.body;
        const user = new User({username, password});
        await user.save();
        res.status(201).send({message : 'user registered'});
    }catch(error){
        res.status(400).send(error);
    }
};

exports.login = as