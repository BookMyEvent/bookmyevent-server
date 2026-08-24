const express = require('express');
const app = express();

require("dotenv").config();
const firebase = require('./firebase-server');
const { getAuth } = require('firebase-admin/auth')
const mongoose = require('mongoose');




const cors = require('cors');
let bodyParser = require("body-parser");
const auth = getAuth(firebase);
const cloudinary = require('./cloudinary-server');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const eventModel = require('./Models/EventDetails');
const eventLockModel = require('./Models/EventLock');
const userModel = require('./Models/UserModel');
const sendMail = require('./mail');

mongoose.connect(`mongodb+srv://bookmyevent:${process.env.MONGO_DB_PASSWORD}@cluster0.d4uetk9.mongodb.net/?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true });

const whitelist = ["https://svcebookmyevent.in", "http://localhost:5173", "http://localhost:5174", "http://localhost:8080"];
const corsOptions = {
    origin: function (origin, callback) {
        // Allow all origins for now to debug the issue
        callback(null, true);
    },
    credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '10mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }))
app.use(express.json());

// Upload Image to Cloudinary
app.post("/api/uploadImage", upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }
        
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const cldRes = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto",
            folder: "bookmyevent"
        });
        
        res.json({ url: cldRes.secure_url });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        res.status(500).json({ error: "Image upload failed" });
    }
});

// A venue is fully blocked for the entire day once any booking exists.
// One venue = one event per day. This matches the original site behaviour
// that the professor reported was broken.
//
// NOTE: We use a date-range query instead of exact date match because the
// client sends a full Date object (e.g. 2026-08-24T18:30:00Z for IST midnight),
// so a naive { date } equality check never matches stored documents.
async function serverCheck(date, venue, session, startTime, endTime, id) {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const candidates = await eventModel.find({
        date: { $gte: dayStart, $lte: dayEnd },
        venue
    });

    for (const existing of candidates) {
        if (id && String(existing._id) === id) continue;
        return false; // any existing booking blocks the whole day for this venue
    }

    return true;
}

// Atomically reserves the (date, venue) slot so only one request at a time can
// run the check-then-insert/update below, even across separate server instances.
// Backed by a unique index, so acquisition can't race like an in-memory flag would.
async function acquireSlotLock(date, venue) {
    try {
        await eventLockModel.create({ date, venue });
        return true;
    } catch (err) {
        if (err.code === 11000) return false;
        throw err;
    }
}

async function releaseSlotLock(date, venue) {
    await eventLockModel.deleteOne({ date, venue });
}



// Check Availability
// Returns every booked venue for the given date regardless of session.
// A venue is blocked for the whole day once any booking exists.
app.post("/api/checkDate", async (req, res) => {
    /*
    Format -> {
                    blocked : [
                                [event_id, event_venue],
                                ...
                            ]
            }
    */
    const { date } = req.body;
    // Use a 24-hour range so the query works regardless of how the client
    // serialised the date (full ISO timestamp vs plain date string).
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const result = await eventModel.find({
        date: { $gte: dayStart, $lte: dayEnd },
        venue: { $ne: "OTHERS**" }
    });
    const blocked = result.map(item => [item._id, item.venue]);
    res.json({ blocked });
})

//Add an Event

app.post("/api/addEvent", async (req, res) => {
    let { date,
        audience,
        venue,
        event,
        description,
        startTime,
        endTime,
        link,
        session,
        club,
        department,
        image,
        target_audience,
        venueName,
        email
    } = req.body;

    const eventDoc = {
        date,
        audience,
        venue,
        event,
        description,
        startTime,
        endTime,
        session,
        link,
        club,
        department,
        image,
        target: target_audience,
        venueName
    };

    let inserted = false;

    if (venue === "OTHERS**") {
        await eventModel.insertMany([eventDoc]);
        inserted = true;
    } else {
        const locked = await acquireSlotLock(date, venue);
        if (!locked) {
            return res.json({ status: "OOPS Slot has been allocated" });
        }
        try {
            if (await serverCheck(date, venue, session, startTime, endTime)) {
                await eventModel.insertMany([eventDoc]);
                inserted = true;
            }
        } finally {
            await releaseSlotLock(date, venue);
        }
    }

    if (!inserted) {
        return res.json({ status: "OOPS Slot has been allocated" });
    }

    try {
        console.log("Attempting to send email...");
        await sendMail(date, session, department != "false" ? department : club, event, venue === "OTHERS**" ? venueName : venue, email);
        console.log("Email sent successfully.");
    } catch (mailError) {
        console.error("Error sending email:", mailError);
        // Do not fail the request if email fails, but log it.
    }
    res.json({ status: "Success" });
});


//Retrieve User

app.post("/api/findUser", async (req, res) => {
    const { uid } = req.body;
    const data = await userModel.findOne({ uid });
    res.json(data);
})

//Create User

app.post("/api/createUser", async (req, res) => {
    try {
        let { password, email, name, type } = req.body;
        email = email.trim();
        name = name.trim();
        const acc = await auth.createUser({
            email,
            password
        });
        const uid = acc.uid;
        let user = undefined;
        if (type === 'General Club') {
            user = await userModel.insertMany({ uid, name: name, email, type });
        }
        else if (type === "HOD") {
            const { dept, deptType } = req.body;
            user = await userModel.insertMany({ uid, name: name, email, department: dept, deptType, type });
        }
        else {
            const { dept } = req.body;
            user = await userModel.insertMany({ uid, name: name, email, department: dept, type });
        }
        res.json({ type: "Success" });
    }
    catch (err) {
        console.log(err);
        res.json({ type: "error", msg: err.errorInfo.message });
    }
})

// Retrieve Upcoming Events

app.get("/api/getEvents", async (req, res) => {
    const events = await eventModel.find({
        endTime: {
            $gte: new Date()
        }
    });
    res.json(events);
})

// Retrieve All Events

app.get("/api/allEvents", async (req, res) => {
    const event = await eventModel.find({}, { image: 0, _id: 0 }).sort({ startTime: 1 });
    res.json({ event });
})

// Retrieve Events of a specific user

app.post("/api/userEvents", async (req, res) => {
    const { name, dept } = req.body;
    let events = undefined
    if (name) {
        events = await eventModel.find({ club: name });
    }
    else {
        events = await eventModel.find({ department: dept });
    }
    res.json(events);
})

// Delete an Event

app.post("/api/deleteEvent", async (req, res) => {
    const { _id } = req.body;
    await eventModel.deleteOne({ _id });
    res.json({ status: 'Success' });
})

// Retrieve Specific event

app.post("/api/retrieveEvent", async (req, res) => {
    const { _id } = req.body;
    const event = await eventModel.findOne({ _id });
    if (event) {
        res.json({ type: "Success", event });
    }
    else
        res.json({
            type: "error"
        })
})

// Update Event

app.post("/api/updateEvent", async (req, res) => {
    const { event } = req.body;
    let id = event._id;

    if (event.venue === "OTHERS**") {
        delete event._id;
        await eventModel.updateOne({ _id: id }, { $set: event }, [{ new: true }]);
        return res.json({ status: "Success" });
    }

    const locked = await acquireSlotLock(event.date, event.venue);
    if (!locked) {
        return res.json({ status: "OOPS Slot has been booked" });
    }

    let status;
    try {
        status = await serverCheck(event.date, event.venue, event.session, event.startTime, event.endTime, id);
        if (status) {
            delete event._id;
            await eventModel.updateOne({ _id: id }, { $set: event }, [{ new: true }]);
        }
    } finally {
        await releaseSlotLock(event.date, event.venue);
    }

    if (status) {
        res.json({ status: "Success" })
    }
    else {
        res.json({
            status: "OOPS Slot has been booked"
        })
    }
})

// Retrieve profile

app.post("/api/profile", async (req, res) => {
    const { uid } = req.body;
    const user = await userModel.find({ uid });
    res.json(user);
})

//Retrieve Core Department list

app.get("/api/dept", async (req, res) => {
    const result = await userModel.find({ type: "HOD", deptType: "Core" }, { department: 1, _id: 0 }).sort({ department: 'asc' });
    let dept = [];
    for (let item of result) {
        dept.push(item['department']);
    }
    res.json({ dept });
})

// Retrieve Department list

app.get("/api/allDept", async (req, res) => {
    const result = await userModel.find({ type: "HOD" }, { department: 1, _id: 0 });
    let dept = [];
    for (let item of result) {
        dept.push(item['department']);
    }
    res.json({ dept });
})


// Update password

app.post("/api/updatePassword", async (req, res) => {
    try {
        const { uid, password } = req.body;
        const user = await auth.updateUser(uid, {
            password
        })
        res.json({
            type: "success",
            content: "Password Updated Successfully"
        })
    }
    catch (err) {
        res.json({
            type: "danger",
            content: err.errorInfo.message
        })
    }
})

//Stats

app.get("/api/eventhistory", async (req, res) => {
    let events = await eventModel.find({}, { startTime: 1, endTime: 1, _id: 0 });
    let live = 0, upcoming = 0, past = 0;
    for (let item of events) {
        if ((item.startTime.getTime() <= new Date().getTime()) && (item.endTime.getTime() >= new Date().getTime()))
            live++;
        else if (item.startTime.getTime() > new Date().getTime())
            upcoming++;
        else
            past++;
    }
    res.json({ live, upcoming, past })
})

app.listen(8080, () => { })

module.exports = app;

