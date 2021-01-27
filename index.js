require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const path = require('path')
const app = express()
const http = require("http")
const port = process.env.PORT || 4000
const WebSocket = require("ws");




const wsServer = new WebSocket.Server({noServer: true})

wsServer.on("connection", socket => {
  console.log("new client connected")
  socket.on("message", data => {
    console.log('Client says : ' + data);
  });
  socket.on("close", () => {
    console.log("Client has disconnected");
  })
  socket.send("hello client. This is a message from the server")
})




app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/authorize', (req, res) => {
  res.redirect('https://zoom.us/launch/chat?jid=robot_' + process.env.zoom_bot_jid)
})

app.get('/support', (req, res) => {
  res.send('Contact tommy.gaessler@zoom.us for support.')
})

app.get('/privacy', (req, res) => {
  res.send('The Unsplash Chatbot for Zoom does not store any user data.')
})

app.get('/terms', (req, res) => {
  res.send('By installing the Unsplash Chatbot for Zoom, you are accept and agree to these terms...')
})

app.get('/documentation', (req, res) => {
  res.send('Try typing "island" to see a photo of an island, or anything else you have in mind!')
})

app.get('/zoomverify/verifyzoom.html', (req, res) => {
  res.send(process.env.zoom_verification_code)
})

app.post('/', (req, res) => {
  console.log(req.body)
  wsServer.clients.forEach((client) =>{
    client.send(req.body.event);
  })
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

const server = app.listen(port, () => console.log(`Unsplash Chatbot for Zoom listening on port ${port}!`))
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
