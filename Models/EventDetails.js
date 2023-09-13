const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    image:String,
    date:Date,
    audience:Number,
    venue:String,
    event:String,
    description:String,
    startTime:Date,
    endTime:Date,
    session:String,
    club:String,
    department:String,
    target:Array,
    link:String,
    venueName:String
});

const eventModel = mongoose.model('eventModel',eventSchema);

module.exports = eventModel;