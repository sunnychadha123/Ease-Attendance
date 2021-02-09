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
const functions = require("firebase-functions")
console.log("firebase-functions loaded")
//serverside read and write Admin:
const admin = require('firebase-admin')
console.log("firebase-admin loaded")
const serviceAccount = require('./easeattendance-c68ed-10bfc6103416.json')
console.log("service account configuration loaded")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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
    this.finishedTS = new Set()
    this.messageLog = []
    this.recordLog = []
    this.meetingStart = new Date()
  }
}
//TODO: test for host change
//TODO: remove occurrences of client
//TODO: only keep errors

// current meetings going on
Meetings = {}



app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/authorize', (req, res) => {

  res.redirect('https://zoom.us/launch/chat?jid=robot_' + process.env.zoom_bot_jid)
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
  if(Meetings[host_id] == null){
    Meetings[host_id] = new Meeting(host_id, null,null)
  }
  if(!Meetings[host_id].finishedTS.has(body.event_ts)){
    Meetings[host_id].finishedTS.add(body.event_ts)
    console.log("<====================================================>")
    console.log(req.body)
    console.log(req.body.payload.object.participant)
    console.log("<====================================================>")
    if(body.event === "meeting.started"){
      Meetings[host_id].meetingName = body.payload.object.topic
      Meetings[host_id].meetingId = body.payload.object.id
      let currentDate = new Date()
      Meetings[host_id].recordLog.push("Meeting: " + body.payload.object.topic + " has started " + "with ID: " + body.payload.object.id + "  " + currentDate)
    }
    else if(body.event === "meeting.ended"){
      if(Meetings[host_id]){
        let currentDate = new Date()
        Meetings[host_id].recordLog.push("Meeting: " + body.payload.object.topic + " has ended " + "with ID: " + body.payload.object.id + "  " + currentDate);
        db.collection("Users").where("email", "==", Meetings[host_id].hostEmail)
            .get()
            .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
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
                    })
                    .catch((error) => {
                      console.error("Error adding document: ", error);
                    });
                return
              });
            })
            .catch((error) => {
              console.log("Error getting documents: ", error);
            });
        db.collection("CurrentMeetings").doc(Meetings[host_id].hostUID).delete().then(() => {
          delete Meetings[host_id]
        }).catch((error) => {
          console.error("error deleting document")
        });
      }
    }
    else if(body.event === "meeting.participant_joined"){
      const participant = body.payload.object.participant
      const participantID = participant.id
      const participantName = participant.user_name
      const participantEmail = participant.email
      if(Meetings[host_id]){
        let currentDate = new Date()
        Meetings[host_id].recordLog.push(participantName +  " has joined" + "  " + currentDate)
        if(participantID === host_id || Meetings[host_id].hostEmail != null){
          Meetings[host_id].hostEmail = participantEmail
          db.collection("Users").where("email","==",participantEmail).get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              Meetings[host_id].hostUID = doc.id
              console.log("doc.id is " + doc.id)
              Meetings[host_id].messageLog.push("meeting.id " + Meetings[host_id].meetingId)
              Meetings[host_id].messageLog.push("meeting.started " + Meetings[host_id].meetingName)
              Meetings[host_id].messageLog.push("participant.joined " + participantName)
              db.collection("CurrentMeetings").doc(doc.id).set({
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
        else if(Meetings[host_id].hostEmail == null){
          Meetings[host_id].messageLog.push("participant.joined " + participantName)
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
        Meetings[host_id].recordLog.push(participantName +  " has left" + "  " + currentDate)
        Meetings[host_id].messageLog.push("participant.left " + participantName)
        if(participantEmail === Meetings[host_id].hostEmail){
          Meetings[host_id].messageLog.push("meeting.ended " + Meetings[host_id].meetingName)
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
exports.app = functions.https.onRequest(app)

