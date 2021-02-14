var email = require("./email.js").email
const port = process.env.PORT || 4000
require('dotenv').config()
console.log("env loaded")
const express = require('express')
console.log("express loaded")
const bodyParser = require('body-parser')
console.log("body-parser loaded")
const request = require('request')
console.log("request loaded")
const path = require('path')
console.log("path loaded")
const app = express()
console.log("app created")
//serverside read and write Admin:
const admin = require('firebase-admin')
console.log("firebase-admin loaded")
console.log("service account configuration loaded")
const nodemailer = require("nodemailer")
console.log("nodemailer loaded")
const favicon = require('serve-favicon')
console.log("favicon module loaded")
admin.initializeApp({
  credential: admin.credential.cert({
          "type": "service_account",
          "project_id": "easeattendance-c68ed",
          "private_key_id": process.env.firebase_admin_key_id,
          "private_key": process.env.firebase_admin_key,
          "client_email": "easeattendance-c68ed@appspot.gserviceaccount.com",
          "client_id": process.env.firebase_admin_client_id,
          "auth_uri": "https://accounts.google.com/o/oauth2/auth",
          "token_uri": "https://oauth2.googleapis.com/token",
          "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
          "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/easeattendance-c68ed%40appspot.gserviceaccount.com"
      }
  )
})
console.log("admin app created")
const db = admin.firestore();
console.log("db loaded")
class Meeting{
  constructor(hostId,meetingName,hostEmail, id) {
    this.meetingId = id
    this.hostId = hostId
    this.meetingName = meetingName
    this.hostEmail = hostEmail
    this.hostUID = null
    this.messageLog = []
    this.recordLog = []
    this.meetingStart = new Date()
  }
}

//TODO: only keep errors

// current meetings going on
Meetings = {}
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.admin_email,
    pass: process.env.admin_pass
  }
});


app.use(favicon(path.join(__dirname, 'favicon.ico')))
app.use(express.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
})
app.get('/features', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/features.html'));
})

app.get('/about-us', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/about-us.html'));
})

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/privacy.html'));
})

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/terms.html'));
})

app.get('/getting-started', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/getting-started.html'));
})
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/dashboard.html'));
})
app.get('/forgotpass', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/forgotpass.html'));
})
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/login.html'));
})
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/signup.html'));
})
app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/support.html'));
})
app.get('/verify', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/verify.html'));
})


app.get('/authorize', (req, res) => {

})

app.post('/support-message', (req,res) => {

  console.log(req.body)
  const message = "email from: " + req.body.email + " with name: " + req.body.Name + " with message: " + req.body.message
  var mailOptions = {
    from: process.env.admin_email,
    to: process.env.admin_email,
    subject: 'Support Email from Ease Attendance: ' + req.body.email,
    text: message
  };
  var mailOptionsUser = {
    from: process.env.admin_email,
    to: req.body.email,
    subject: "Ease Attendance Support",
    html: email
  };
  if(req.body.email){
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    transporter.sendMail(mailOptionsUser, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  res.status(200);
  res.send()

})
app.get('/zoomverify/verifyzoom.html', (req, res) => {
  res.send(process.env.zoom_verification_code)
})
function remove(array, element) {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
  }
}
function handleZoomPost(req){
    const body = req.body
    const host_id = body.payload.object.host_id
    console.log("<====================================================>")
    console.log(req.body)
    console.log(req.body.payload.object.participant)
    console.log("<====================================================>")


    if(body.event === "meeting.started"){
        // note: do not update firebase current meetings since we do not know who started the meeting yet
        // Create meeting in meeting dictionary
        Meetings[host_id] = new Meeting(host_id, body.payload.object.topic, null, body.payload.object.id)
        // Add meeting started to record log
        let currentDate = new Date()
        Meetings[host_id].recordLog.push("Meeting: " + body.payload.object.topic + " has started " + "with ID: " + body.payload.object.id + "  " + currentDate)
        // push messages that set meeting ID and meeting Name in front end
        Meetings[host_id].messageLog.push("meeting.id " + body.payload.object.id)
        Meetings[host_id].messageLog.push("meeting.started " + body.payload.object.topic)
    }
    else if(body.event === "meeting.participant_joined"){
        const participant = body.payload.object.participant
        const participantID = participant.id
        const participantName = participant.user_name
        const participantEmail = participant.email
        if(Meetings[host_id]){
            let currentDate = new Date()
            if(participantID === host_id){
                db.collection("Users").where("email","==",participantEmail).get().then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        Meetings[host_id].hostUID = doc.id
                        console.log("host uid is " + doc.id)
                        Meetings[host_id].hostEmail = participantEmail
                        Meetings[host_id].recordLog.push(participantName +  " has joined" + "  " + currentDate)
                        Meetings[host_id].messageLog.push("participant.joined " + participantName)
                        db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).set({
                            messages: Meetings[host_id].messageLog
                        }).then(()=>{
                        }).catch((error)=>{
                            console.error("error updating current meeting" + " email: " + participantEmail + " in meeting participant joined")
                        })
                    })
                }).catch((error) => {
                    console.error("error getting user uid from collection based on email" + " email: " + participantEmail)
                })
            }
            else{
                if(Meetings[host_id].hostEmail == null || Meetings[host_id].hostEmail === ""){
                    Meetings[host_id].recordLog.push(participantName +  " has joined" + "  " + currentDate)
                    Meetings[host_id].messageLog.push("participant.joined " + participantName)
                }
                else{
                    Meetings[host_id].recordLog.push(participantName +  " has joined" + "  " + currentDate)
                    Meetings[host_id].messageLog.push("participant.joined " + participantName)
                    db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).set({
                        messages: Meetings[host_id].messageLog
                    }).then(()=>{
                    }).catch((error)=>{
                        console.error("error updating current meeting" + " email: " + participantEmail + " in meeting participant joined")
                    })
                }
            }
        }
    }
    else if(body.event === "meeting.participant_left"){
        const participant = body.payload.object.participant
        const participantID = participant.id
        const participantName = participant.user_name
        const participantEmail = participant.email
        let currentDate = new Date()
        if(Meetings[host_id]){
            if(Meetings[host_id].hostEmail){
                Meetings[host_id].recordLog.push(participantName +  " has left" + "  " + currentDate)
                Meetings[host_id].messageLog.push("participant.left " + participantName)
                db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).set({
                    messages: Meetings[host_id].messageLog
                }).then(()=>{
                }).catch((error)=>{
                    console.error("error updating current meeting" + " email: " + participantEmail + " in meeting participant joined")
                })
            }
            else{
                Meetings[host_id].recordLog.push(participantName +  " has left" + "  " + currentDate)
                Meetings[host_id].messageLog.push("participant.left " + participantName)
            }
        }
    }
    else if(body.event === "meeting.ended"){
      // If meeting exists and participant is know
      if(Meetings[host_id] && Meetings[host_id].hostEmail){
          // Add meeting end to record log
        let currentDate = new Date()
        Meetings[host_id].recordLog.push("Meeting: " + body.payload.object.topic + " has ended " + "with ID: " + body.payload.object.id + "  " + currentDate);
        // find the host id based on host email
        db.collection("Users").where("email", "==", Meetings[host_id].hostEmail)
            .get()
            .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                  // save record to data base
                db.collection("Records").add({
                  'Events': Meetings[host_id].recordLog,
                  'MeetingID': Meetings[host_id].meetingId,
                  'useruid': String(doc.id),
                  'MeetingName': Meetings[host_id].meetingName,
                  'MeetingStart': Meetings[host_id].meetingStart,
                  'MeetingEnd' : new Date()
                })
                    .then((docRef) => {
                        console.log("Document written with ID: ", docRef.id);
                        // add meeting end to message log
                        Meetings[host_id].messageLog.push("meeting.ended");
                        // update firebase messages after meeting end to let client know that meeting has ended
                        db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).set({
                            messages: Meetings[host_id].messageLog
                        }).then(()=>{
                            //delete the current meeting when meeting has ended
                            db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).delete().then(() => {
                                // delete local dictionary values of meeting
                                delete Meetings[host_id]
                            }).catch((error) => {
                                console.error("error deleting Current Meeting document")
                            });
                        }).catch((error)=>{
                            console.error("error updating current meeting" + " email: " + participantEmail + " in meeting participant joined")
                        })
                    })
                    .catch((error) => {
                      console.error("Error adding document: ", error);
                    });
              });
            })
            .catch((error) => {
              console.log("Error getting documents: ", error);
            });
      }
      else if(Meetings[host_id]){
          delete Meetings[host_id]
      }
    }
}

app.post('/api/requests', (req, res) => {
  res.status(200)
  res.send()
  if(req.headers.authorization === process.env.zoom_verification_token){
    handleZoomPost(req)
  }
})

app.post('/deauthorize', (req, res) => {
  if (req.headers.authorization === process.env.zoom_verification_token) {
    res.status(200)
    res.send()
    request({
      url: 'https://api.zoom.us/oauth/data/compliance',
      method: 'POST',
      json: true,
      body: {
        'client_id': req.body.payload.client_id,
        'user_id': req.body.payload.user_id,
        'account_id': req.body.payload.account_id,
        'deauthorization_event_received': req.body.payload,
        'compliance_completed': true
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(process.env.zoom_client_id + ':' + process.env.zoom_client_secret).toString('base64'),
        'cache-control': 'no-cache'
      }
    }, (error, httpResponse, body) => {
      if (error) {
        console.log(error)
      } else {
        console.log(body)
      }
    })
  } else {
    res.status(401)
    res.send()
  }
})


const server = app.listen(port, () => console.log(`Server Up and Running on ${port}!`))
