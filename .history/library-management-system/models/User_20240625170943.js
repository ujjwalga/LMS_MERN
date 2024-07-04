const mongoose = require('mongoose')
const bcrypt  = require('bcryptjs')

const userSchema = new mongoose.Schema({
    username: { type : String, required : true, unique : true},
    password: {type : String, required: true}
})

//Hashing the password before saving 
userSchema.pre('save', async function (next){
    
})