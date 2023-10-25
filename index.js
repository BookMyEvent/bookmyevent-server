const express = require('express');
require("dotenv").config();
const firebase = require('./firebase-server');
const { getAuth } = require('firebase-admin/auth')
const mongoose = require('mongoose');


const app = express();
const cors = require('cors');
let bodyParser = require("body-parser");
const auth = getAuth(firebase);
const eventModel = require('./Models/EventDetails');
const userModel = require('./Models/UserModel');
const sendMail = require('./mail');

mongoose.connect(`mongodb+srv://bookmyevent:${process.env.MONGO_DB_PASSWORD}@cluster0.d4uetk9.mongodb.net/?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(bodyParser.json({ limit: '10mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }))
app.use(express.json());


async function serverCheck(date, venue, session, id) {
    const res = await eventModel.find({ date, venue, session: { $in: ['Full Day', session] } }); 
    if (res.length === 0)
        return true;
    else if (String(res[0]._id) === id)
        return true;
    else
        return false;
}

// Check AVailability

app.post("/api/checkDate", async (req, res) => {
    const { date, session } = req.body;
    const result = await eventModel.find({ date, venue: { $ne: "OTHERS**" } });
    let blocked = [];
    if (session === "Full Day") {
        for (let item of result) {
            blocked.push([item._id, item.venue]);
        }
        res.json({
            blocked
        });
    }
    else {
        for (let item of result) {
            if (item.session === 'Full Day') {
                blocked.push([item._id, item.venue]);
            }
            else if (item.session === session)
                blocked.push([item._id, item.venue]);
        }
        res.json({
            blocked
        });
    }
})

//Add an Event

app.post("/api/addEvent", async (req, res) => {
    const { date,
        audience,
        venue,
        event,
        description,
        start,
        end,
        link,
        session,
        club,
        dept,
        image,
        allowed,
        venueName,
        email
    } = req.body;

    const status = venue === "OTHERS**" ? true : await serverCheck(date, venue, session);
    if (status === true) {
        await eventModel.insertMany([
            {
                date: new Date(date),
                audience,
                venue,
                event,
                description,
                startTime: start,
                endTime: end,
                session,
                link,
                club: club && club,
                department: dept && dept,
                image,
                target: allowed,
                venueName,
            }
        ])
        sendMail(date,session,dept!="false" ? dept : club,event,venue,email);
        res.json({ status: "Success" });
    }
    else
        res.json({ status: "OOPS Slot has been allocated" })
})

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
    const event = await eventModel.find({}, { image: 0, _id: 0 }).sort({startTime:1});
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
    const status = event.venue === "OTHERS**" ? true : await serverCheck(event.date, event.venue, event.session, id);
    delete event._id;
    if (status) {
        await eventModel.updateOne({ _id: id }, { $set: event }, [{ new: true }]);
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
    const result = await userModel.find({ type: "HOD", deptType: "Core" }, { department: 1, _id: 0 });
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

app.listen(8000, () => { })