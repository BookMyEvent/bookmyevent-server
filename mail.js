const nodemailer = require("nodemailer");
require("dotenv").config();

const sendMail = async (date, session, dept, event, venue, email) => {
  date = new Date(date);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_ID,
      pass: process.env.GMAIL_PASS,
    },
  });

  var mailOptions = {
    from: process.env.GMAIL_ID,
    to: email,
    subject: `Event registered in ${venue} on ${date.getDate()}/${date.getMonth() + 1
      }/${date.getFullYear()}`,
    html: `
  
    <h5 style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size: larger">Your event
          has been booked succesfully.</h5>
      <h5 style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size: larger;margin: 5px;">
          Event details:</h5>
      <table style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;width:100%">
          <tr>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-top:1px solid black;border-bottom:1px solid black;border-left: 1px solid black;border-right: 1px solid black;">
                  Event name</td>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-top:1px solid black;border-bottom:1px solid black;border-right: 1px solid black;">
                  ${event}
              </td>
          </tr>
          <tr>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-bottom:1px solid black;border-left: 1px solid black;border-right: 1px solid black;">
                  Venue</td>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-bottom:1px solid black;border-right: 1px solid black;">
                  ${venue}
              </td>
          </tr>
          <tr>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-bottom:1px solid black;border-left: 1px solid black;border-right: 1px solid black;">
                  Session</td>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-bottom:1px solid black;border-right: 1px solid black;">
                  ${session}
              </td>
          </tr>
          <tr>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-bottom:1px solid black;border-left: 1px solid black;border-right: 1px solid black;">
                  Date</td>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-bottom:1px solid black;border-right: 1px solid black;">
                  ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}
              </td>
          </tr>
          <tr>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-bottom:1px solid black;border-left: 1px solid black;border-right: 1px solid black;">
                  Department</td>
              <td
                  style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;font-size:larger;padding:10px;margin:0;border-bottom:1px solid black;border-right: 1px solid black;">
                  ${dept}
              </td>
          </tr>
      </table>
  
      <h3
          style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;padding-top: 1%;margin: 0%;margin-top: 2%;">
          Regards,</h3>
      <h3 style="font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif ;padding-top: 1%;margin: 0%;">SVCE
          BookMyEvent</h3>
    `
  };

  if (venue === "FUNCTION HALL" || venue === "VIDEO HALL") {
    mailOptions.cc = "hodec@svce.ac.in";
  } else if (venue === "LIBRARY SEMINAR HALL") {
    mailOptions.cc =
      "hodli@svce.ac.in,rk562225@gmail.com,Moonstaarchn@gmail.com";
  } else if (venue === "MULTI PURPOSE HALL") {
    mailOptions.cc = "principal@svce.ac.in,adminexecutive@svce.ac.in";
  } else if (venue === "BIO TECH SEMINAR HALL") {
    mailOptions.cc = "hodbt@svce.ac.in";
  } else if (venue === "LIBRARY CONFERENCE HALL") {
    mailOptions.cc =
      "principal@svce.ac.in,hodli@svce.ac.in,sgopi@svce.ac.in,rk562225@gmail.com,Moonstaarchn@gmail.com";
  }

  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
