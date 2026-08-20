const mongoose = require('mongoose');

// Acts as a DB-level mutex for the (date, venue) slot-booking critical section.
// The unique index makes lock acquisition atomic across all server instances
// (important on serverless, where in-memory locks aren't shared).
// The TTL auto-releases a lock if a request crashes before releasing it.
const eventLockSchema = mongoose.Schema({
    date: Date,
    venue: String,
    createdAt: { type: Date, default: Date.now, expires: 60 }
});

eventLockSchema.index({ date: 1, venue: 1 }, { unique: true });

const eventLockModel = mongoose.model('eventLockModel', eventLockSchema);

module.exports = eventLockModel;
