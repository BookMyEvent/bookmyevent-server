const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    uid:String,
    name:String,
    department:String,
    email:String,
    type:String,
    deptType:String
})

const userModel = mongoose.model("userModel",userSchema);

module.exports = userModel;