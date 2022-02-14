'use strict';

// [START import]
const functions = require('firebase-functions');
const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
// [END import]

// [START middleware]
const cors = require('cors')({origin: true});
app.use(cors);
// [END middleware]

/**
contact form relay
 */
app.post('/send', (req, response, next) => {
  if(Boolean(req.body.email) && Boolean(req.body.realname)){
    //to make it work you need gmail account
    const gmailEmail = "josh@freshed.com";
    const gmailPassword = "htovqmlixkqpcpyi"; //app password for nodemailerr
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',//smtp.gmail.com  //in place of service use host...
      auth: {
        user: gmailEmail,
        pass: gmailPassword
      }
    })

    const mailOptions = {
      from: {name: req.body.realname, address: req.body.email},
      to: req.body.lead_recipients,
      subject: req.body.primary_url + " " + req.body.lead_sheet_title,
      text: req.body.msg,
      replyTo: req.body.email
    }
    
    transporter.sendMail(mailOptions, (err, res) => {
      if (err) {
        console.log(err);
        response.status('400').send("<b>Sorry, failed to send email.</b>");
      } else {
        response.send("<b>Thanks for the note!</b>");
      }
    })
  } else {
    response.status('400').send("Fill out the required stuff before you hit submit, please.");
  }
})
/* [END `/say/hello` ] - must be added before `exports.api = ...` */


// Define the Firebase function that will act as Express application
// Note: This `api` must match with `/firebase.json` rewrites rule.
exports.api = functions.https.onRequest(app);