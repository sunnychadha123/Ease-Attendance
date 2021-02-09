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
const WebSocket = require("ws");
console.log("ws loaded")
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
const wsServer = new WebSocket.Server({noServer: true})
console.log("wsServer created")

class Meeting{
  constructor(hostId,meetingName,hostEmail, id) {
    this.meetingId = id
    this.hostId = hostId
    this.meetingName = meetingName
    this.participantsToSend = []
    this.hostEmail = hostEmail
    this.finishedTS = new Set()
    this.messageLog = []
    this.recordLog = []
    this.meetingStart = new Date()
  }
}

// Client Websockets
Clients = {}
// current meetings going on
Meetings = {}
// Email to host id references
EmailToID = {}


wsServer.on("connection", socket => {
  socket.on("message", uid => {
    console.log(uid)
      var docRef = db.collection("Users").doc(uid)
      docRef.get().then((doc) => {
        if(doc.exists){
          const email = doc.data().email
          Clients[email] = socket
          socket.id = email
          if(email in EmailToID){
            for(i = 0; i < Meetings[EmailToID[email]].messageLog.length;i++){
              socket.send(Meetings[EmailToID[email]].messageLog[i])
            }
          }
        }
      }).catch((error) => {
        console.log(error)
      })



  });
  socket.on("close", () => {
    console.log(socket.id + " has disconnected");
    delete Clients[socket.id]
  })
})




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

app.post('/api/requests', (req, res) => {
  res.status(200)
  res.send()
  if(req.headers.authorization === process.env.zoom_verification_token){
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
                      delete Meetings[host_id]
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
      }
      else if(body.event === "meeting.participant_joined"){
        const participant = body.payload.object.participant
        const participantID = participant.id
        const participantName = participant.user_name
        const participantEmail = participant.email
        let currentDate = new Date()
        Meetings[host_id].recordLog.push(participantName +  " has joined" + "  " + currentDate)
        if(participantID === host_id){
          EmailToID[participantEmail] = host_id;
          Meetings[host_id].hostEmail = participantEmail
          console.log("<host email>")
          console.log(participantEmail)
          console.log("<host email>")
          Meetings[host_id].messageLog.push("meeting.id " + Meetings[host_id].meetingId)
          Meetings[host_id].messageLog.push("meeting.started " + Meetings[host_id].meetingName)
          Meetings[host_id].messageLog.push("participant.joined " + participantName)
          if(Clients[participantEmail] != null){
            Clients[participantEmail].send("meeting.id " + Meetings[host_id].meetingId)
            Clients[participantEmail].send("meeting.started " + Meetings[host_id].meetingName)
            Clients[participantEmail].send("participant.joined " + participantName)
          }
          for(i = 0; i <  Meetings[host_id].participantsToSend.length;i++){
            Meetings[host_id].messageLog.push("participant.joined " + Meetings[host_id].participantsToSend[i])
            if(Clients[participantEmail] != null){
              Clients[participantEmail].send("participant.joined " + Meetings[host_id].participantsToSend[i])
            }

          }
          Meetings[host_id].participantsToSend.splice(0,Meetings[host_id].participantsToSend.length)
        }
        else{
          if(Meetings[host_id].hostEmail == null){
            Meetings[host_id].participantsToSend.push(participantName)
          }
          else{
            Meetings[host_id].messageLog.push("participant.joined " + participantName)
            if(Clients[Meetings[host_id].hostEmail] != null){
              Clients[Meetings[host_id].hostEmail].send("participant.joined " + participantName)
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
        Meetings[host_id].recordLog.push(participantName +  " has left" + "  " + currentDate)
        if(Meetings[host_id].hostEmail == null){
          remove(Meetings[host_id].participantsToSend,participantName)
        }
        else{
          if(participantEmail === Meetings[host_id].hostEmail){
            delete EmailToID[participantEmail]
            Meetings[host_id].messageLog.push("meeting.ended " + Meetings[host_id].meetingName)
            if(Clients[participantEmail] != null){
              Clients[participantEmail].send("meeting.ended " + Meetings[host_id].meetingName)
            }
          }
          Meetings[host_id].messageLog.push("participant.left " + participantName)
          if(Clients[Meetings[host_id].hostEmail] != null){
            Clients[Meetings[host_id].hostEmail].send("participant.left " + participantName)
          }
        }
      }
    }
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

const server = app.listen(4000, () => console.log(`Server Up and Running on 4000!`))
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
