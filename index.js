var email = require("./email.js").email
console.log("email html loaded")
const port = process.env.PORT || 4000
console.log("port selected = " + port)
require('dotenv').config()
console.log("env vars loaded")
const express = require('express')
console.log("express loaded")
const bodyParser = require('body-parser')
console.log("body-parser loaded")
const request = require('request')
console.log("request loaded")
const path = require('path')
console.log("path loaded")
const app = express()
console.log("app created from express")
const admin = require('firebase-admin')
console.log("firebase admin loaded")
const nodemailer = require("nodemailer")
console.log("email client loaded for support")
const favicon = require('serve-favicon')
console.log("favicon loaded")
// Initialize admin credentials for db
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
console.log("admin app initialized")
// Create connection to cloud firestore
const db = admin.firestore();
console.log("cloud firestore initialized")
// initialize firestore auth
const auth = admin.auth()
console.log("firestore auth initialized")
// Holds information about current Meeting
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

// Dictionary of current meetings
Meetings = {}
console.log("dictionary of current meetings created")
// Initialize nodemailer to send messages for support
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.admin_email,
    pass: process.env.admin_pass
  }
});
console.log("nodemailer transport initialized")
// Initialize app config

app.use(favicon(path.join(__dirname, 'favicon.ico')))
console.log("favicon initialized")
app.use(express.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/public')));
console.log("express app preferences loaded")
// Initialize URL paths

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
    const authorizationCode = req.query.code
    request({
        url: 'https://zoom.us/oauth/token?grant_type=authorization_code&' + 'code=' + authorizationCode + '&redirect_uri=https://www.easeattendance.com/authorize',
        method: 'POST',
        json: true,
        headers: {
            'Authorization': 'Basic ' + Buffer.from(process.env.zoom_client_id + ':' + process.env.zoom_client_secret).toString('base64')
        }
    }, (error, httpResponse, body) => {
        if (error) {
            console.error(error)
        } else {
            const accessToken = body.access_token
            const refreshToken = body.refresh_token

            request({
                url: 'https://api.zoom.us/v2/users/me',
                method: 'GET',
                json: true,
                headers: {
                    'Authorization': "Bearer " + accessToken
                }
            }, (error, httpResponse, body) => {
                if (error) {
                    console.error(error)
                } else {
                    const userID = body.id
                    const userFirstName = body.first_name
                    const userLastName = body.last_name
                    const userEmail = body.email
                    const userAccountID = body.account_id
                    db.collection("ZoomOAuth").doc(userID).set({
                        userID: userID,
                        firstName: userFirstName,
                        lastName: userLastName,
                        email: userEmail,
                        userAccountID: userAccountID,
                        refreshToken: refreshToken
                    }).then(() => {
                        console.info("User " + userFirstName + " " + userLastName + " with email " + userEmail + " has downloaded the Ease Attendance app")
                    }).catch((error) => {
                        console.error(error.message)
                    })
                }
            })

        }
    })

    res.sendFile(path.join(__dirname + '/public/signup.html'));
})
app.get('/zoomverify/verifyzoom.html', (req, res) => {
    res.send(process.env.zoom_verification_code)
})

// function to send messages for https://www.easeattendance.com/support
app.post('/support-message', (req,res) => {
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
        console.error(error);
      } else {
        console.info('Email sent: ' + info.response);
      }
    });
    transporter.sendMail(mailOptionsUser, function(error, info){
      if (error) {
        console.error(error);
      } else {
        console.info('Email sent: ' + info.response);
      }
    });
  }
  res.status(200);
  res.send()
})

// Function to handle zoom webhooks

function handleZoomPost(req){
    const body = req.body
    const host_id = body.payload.object.host_id
    if(body.event === "meeting.started"){
        db.collection("ZoomOAuth").doc(host_id).get().then((doc)=>{
            // Create meeting in meeting dictionary
            Meetings[host_id] = new Meeting(host_id, body.payload.object.topic, doc.data().email, body.payload.object.id)
            Meetings[host_id].hostUID = doc.data().firebaseID
            // Add meeting started to record log
            let currentDate = new Date()
            Meetings[host_id].recordLog.push("Meeting: " + body.payload.object.topic + " has started " + "with ID: " + body.payload.object.id + "  " + currentDate)
            // push messages that set meeting ID and meeting Name in front end
            Meetings[host_id].messageLog.push("meeting.id " + body.payload.object.id)
            Meetings[host_id].messageLog.push("meeting.started " + body.payload.object.topic)
            console.log("Meeting started: " + body.payload.object.topic)
            // update CurrentMeetings on firebase (this automatically updates the list on the front end because client is listening to updates on CurrentMeetings)
            db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).set({
                messages: Meetings[host_id].messageLog
            }).then(()=>{
            }).catch((error)=>{
                console.error(error.message)
            })
        }).catch((error)=>{
            console.error(error.message)
        })



    }
    else if(body.event === "meeting.participant_joined"){
        const participant = body.payload.object.participant
        const participantID = participant.id
        const participantName = participant.user_name
        const participantEmail = participant.email
        console.log("Participant " + participantName + " has joined")
        // If the meeting is in the dictionary (meeting exists on our server)
        if(Meetings[host_id]){
            let currentDate = new Date()
            Meetings[host_id].recordLog.push(participantName +  " has joined" + "  " + currentDate)
            Meetings[host_id].messageLog.push("participant.joined " + participantName)
            // update CurrentMeetings on firebase (this automatically updates the list on the front end because client is listening to updates on CurrentMeetings)
            db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).set({
                messages: Meetings[host_id].messageLog
            }).then(()=>{
            }).catch((error)=>{
                console.error(error.message)
            })
        }
    }
    else if(body.event === "meeting.participant_left"){
        const participant = body.payload.object.participant
        const participantID = participant.id
        const participantName = participant.user_name
        const participantEmail = participant.email
        let currentDate = new Date()
        console.log("Participant " + participantName + " has left")
        // If meeting exists on server
        if(Meetings[host_id]){
            Meetings[host_id].recordLog.push(participantName +  " has left" + "  " + currentDate)
            Meetings[host_id].messageLog.push("participant.left " + participantName)

            // update current meetings on firebase
            db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).set({
                messages: Meetings[host_id].messageLog
            }).then(()=>{
            }).catch((error)=>{
                console.error(error.message)
            })
        }
    }
    else if(body.event === "meeting.ended"){
      // If meeting exists and participant is known
        console.log("Meeting ended: " + body.payload.object.topic)
      if(Meetings[host_id] && Meetings[host_id].hostEmail){
        let currentDate = new Date()
        // Add meeting end to record log
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
                                console.error(error.message)
                            });
                        }).catch((error)=>{
                            console.error(error.message)
                        })
                    })
                    .catch((error) => {
                      console.error(error.message);
                    });
              });
            })
            .catch((error) => {
              console.error(error.message);
            });
      }
      // If host information is now known and meeting exists on server
      else if(Meetings[host_id]){
          delete Meetings[host_id]
      }
    }
}

app.post('/api/requests', (req, res) => {
  res.status(200)
  res.send()
    console.log("post request to /api/requests sent ")
    console.log(req.body)
  if(req.headers.authorization === process.env.zoom_verification_token){
      handleZoomPost(req)
  }
})

app.post('/deauthorize', (req, res) => {
  if (req.headers.authorization === process.env.zoom_verification_token) {
    console.log("post request to /deauthorize received " + req.body)
    console.log(req.body)
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
        console.error(error)
      } else {
          const userID = req.body.payload.user_id
          db.collection("ZoomOAuth").doc(userID).get().then((Authdoc) => {
              if(Authdoc.exists){
                  const email = Authdoc.data().email
                  db.collection("Users").where("email", "==",email).get().then((querySnapshot) => {
                      querySnapshot.forEach((Userdoc) => {
                          const firebaseUserID = Userdoc.id
                          auth.deleteUser(firebaseUserID).then(() => {
                              db.collection("Users").doc(firebaseUserID).delete().then(() => {
                                  db.collection("Periods").where("useruid", "==", firebaseUserID).get().then((querySnapshot) => {
                                      querySnapshot.forEach((Perioddoc) => {
                                          db.collection("Periods").doc(Perioddoc.id).delete().then(()=> {
                                              console.log("Period deleted for user with email: " + email + " with firebase id: " + firebaseUserID)
                                          }).catch((error) => {
                                              console.error(error.message)
                                          })
                                      })
                                  }).catch((error) => {
                                      console.error(error.message)
                                  })
                                  db.collection("Records").where("useruid","==",firebaseUserID).get().then((querySnapshot) => {
                                      querySnapshot.forEach((Recorddoc) => {
                                          db.collection("Records").doc(Recorddoc.id).delete().then(() => {
                                              db.collection("ZoomOAuth").doc(userID).delete().then(() => {
                                                  console.log("Record deleted for user with email: " + email + " with firebase id: " + firebaseUserID)
                                              }).catch((error) => {
                                                  console.error(error.message)
                                              })
                                          }).catch((error) => {
                                              console.error(error.message)
                                          })
                                      })
                                  }).catch((error) => {
                                      console.error(error.message)
                                  })
                                  db.collection("ZoomOAuth").doc(userID).delete().then(()=>{
                                      console.info("All user information deleted for user with email: " + email + " with firebase id: " + firebaseUserID)
                                  }).catch((error) => {
                                      console.error(error.message)
                                  })
                              }).catch((error) => {
                                  console.error(error.message)
                              })
                          }).catch((error) => {
                              console.error(error.message)
                          })
                      })
                  }).catch((error) => {
                      console.error(error.message)
                  })
              }
          }).catch((error) => {
              console.error(error.message)
          })
      }
    })

  } else {
    res.status(401)
    res.send()
  }
})


const server = app.listen(port, () => console.log(`Ease Attendance running on server on ${port}!`))
