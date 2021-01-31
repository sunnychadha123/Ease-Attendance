const socket = new WebSocket('ws://localhost:4000');

socket.addEventListener("open", () => {
    console.log("we are connected")
    socket.send("hello from client")

})
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});
