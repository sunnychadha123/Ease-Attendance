require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const path = require('path')
const app = express()
const http = require("http")
const https = require("https")
const port = process.env.PORT || 4000
const WebSocket = require("ws");
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");

const options = {
  hostname: 'https://api.zoom.us/v2',
  port: 4000,
  path: '/past_meetings/',
  method: 'GET'
}

const wsServer = new WebSocket.Server({noServer: true})

class Meeting{
  constructor(hostId,meetingName,hostEmail) {
    this.hostId = hostId
    this.meetingName = meetingName
    this.participantsToSend = []
    this.hostEmail = hostEmail
    this.finishedTS = new Set()
    this.messageLog = []
  }
}

// Client Websockets
Clients = {}
// current meetings going on
Meetings = {}
// Email to host id references
EmailToID = {}


wsServer.on("connection", socket => {
  socket.on("message", email => {
    console.log(email)
    if(email.includes("@")){
      Clients[email] = socket
      socket.id = email
      if(email in EmailToID){
        for(i = 0; i < Meetings[EmailToID[email]].messageLog.length;i++){
          socket.send(Meetings[EmailToID[email]].messageLog[i])
        }
      }
    }
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
app.post('/', (req, res) => {
  res.status(200)
  res.send()
  const body = req.body
  const host_id = body.payload.object.host_id
  if(Meetings[host_id] == null){
    Meetings[host_id] = new Meeting(host_id, null,null)
  }
  if(!Meetings[host_id].finishedTS.has(body.event_ts)){
    Meetings[host_id].finishedTS.add(body.event_ts)
    console.log(body.event_ts)
    console.log("<====================================================>")
    console.log(req.body)
    console.log(req.body.payload.object.participant)
    console.log("<====================================================>")
    if(body.event === "meeting.started"){
      Meetings[host_id].meetingName = body.payload.object.topic
    }
    else if(body.event === "meeting.ended"){
      delete Meetings[host_id]
    }
    else if(body.event === "meeting.participant_joined"){
      const participant = body.payload.object.participant
      const participantID = participant.id
      const participantName = participant.user_name
      const participantEmail = participant.email
      if(participantID === host_id){
        EmailToID[participantEmail] = host_id;
        Meetings[host_id].hostEmail = participantEmail
        console.log("<host email>")
        console.log(participantEmail)
        console.log("<host email>")
        Meetings[host_id].messageLog.push("meeting.started " + Meetings[host_id].meetingName)
        Meetings[host_id].messageLog.push("participant.joined " + participantName)
        Clients[participantEmail].send("meeting.started " + Meetings[host_id].meetingName)
        Clients[participantEmail].send("participant.joined " + participantName)
        for(i = 0; i <  Meetings[host_id].participantsToSend.length;i++){
          Meetings[host_id].messageLog.push("participant.joined " + Meetings[host_id].participantsToSend[i])
          Clients[participantEmail].send("participant.joined " + Meetings[host_id].participantsToSend[i])
        }
        Meetings[host_id].participantsToSend.splice(0,Meetings[host_id].participantsToSend.length)
      }
      else{
        if(Meetings[host_id].hostEmail == null){
          Meetings[host_id].participantsToSend.push(participantName)
        }
        else{
          Meetings[host_id].messageLog.push("participant.joined " + participantName)
          Clients[Meetings[host_id].hostEmail].send("participant.joined " + participantName)
        }
      }

    }
    else if(body.event === "meeting.participant_left"){
      const participant = body.payload.object.participant
      const participantID = participant.id
      const participantName = participant.user_name
      const participantEmail = participant.email
      if(Meetings[host_id].hostEmail == null){
        remove(Meetings[host_id].participantsToSend,participantName)
      }
      else{
        if(participantEmail === Meetings[host_id].hostEmail){
          delete EmailToID[participantEmail]
          Meetings[host_id].messageLog.push("meeting.ended " + Meetings[host_id].meetingName)
          Clients[participantEmail].send("meeting.ended " + Meetings[host_id].meetingName)
        }
        Meetings[host_id].messageLog.push("participant.left " + participantName)
        Clients[Meetings[host_id].hostEmail].send("participant.left " + participantName)
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
    res.send('Unauthorized request to Unsplash Chatbot for Zoom.')
  }
})

const server = app.listen(port, () => console.log(`Server Up and Running on ${port}!`))
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
