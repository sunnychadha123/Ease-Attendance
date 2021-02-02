
document.getElementById("user-name").innerHTML = "Welcome " + localStorage.getItem("userDisplayName")

if(localStorage.getItem("userEmail") === ""){
    window.location.href = "index.html";
}

const socket = new WebSocket('ws://localhost:4000');

socket.addEventListener("open", () => {
    console.log("we are connected")
    socket.send(localStorage.getItem("userEmail"))

})
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});

