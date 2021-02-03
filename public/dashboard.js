



document.getElementById("user-name").innerHTML = "Welcome " + localStorage.getItem("userDisplayName")

if(localStorage.getItem("userEmail") === ""){
    window.location.href = "index.html";
}
class Participant{
    constructor(first,last,attendance) {
        this.firstName = first
        this.lastName = last
        this.state = attendance
    }
}


Participants = []
const participantTable = document.getElementById("participant-table")
var meetingOccuring = false
var CurrentMeeting = ""

const socket = new WebSocket('ws://8fa46a4fbfff.ngrok.io');

socket.addEventListener("open", () => {
    console.log("Connected to Server")
    socket.send(localStorage.getItem("userEmail"))

})
function clearTable(){
    const currentNumRows = participantTable.rows
    for(i = 0; i < currentNumRows; i++){
        participantTable.deleteRow(0);
    }
}
socket.addEventListener('message', function (event) {
    const data = event.data.split(" ");
    const eventType = data[0]
    if(eventType === "meeting.started"){
        var meetingName = ""
        for(i = 1; i < data.length;i++){
            meetingName += data[i] + " "
        }
        CurrentMeeting = meetingName
        meetingOccuring = true
        document.getElementById("currentMeeting-name").innerHTML = "Meeting: " + meetingName
        document.getElementById("status-dot").classList.remove("dot-danger")
        document.getElementById("status-dot").classList.add("dot-success")
    }
    else if(eventType === "meeting.ended"){
        document.getElementById("currentMeeting-name").innerHTML = "Meeting: " + CurrentMeeting + " has ended"
        meetingOccuring = false
        CurrentMeeting = ""
        document.getElementById("status-dot").classList.remove("dot-success")
        document.getElementById("status-dot").classList.add("dot-danger")

    }
    else if(eventType === "participant.joined"){
        var participantFirst = ""
        var participantLast = ""
        if(data.length === 2){
            participantFirst = data[1]
        }
        else if(data.length > 2){
            participantFirst = data[1]
            participantLast = data[2]
        }
        Participants.unshift(new Participant(participantFirst, participantLast, "present"))
        var row = participantTable.insertRow(1)
        row.style.backgroundColor = "#ffffff"
        var cell1 = row.insertCell(0)
        var cell2 = row.insertCell(1)
        var cell3 = row.insertCell(2)
        cell1.innerHTML = participantFirst
        cell2.innerHTML = participantLast
        cell3.innerHTML = "present"
    }
    else if(eventType === "participant.left"){
        var participantFirst = ""
        var participantLast = ""
        if(data.length === 2){
            participantFirst = data[1]
        }
        else if(data.length > 2){
            participantFirst = data[1]
            participantLast = data[2]
        }
        for(i = 0; i < Participants.length; i++){
            if(Participants[i].firstName === participantFirst && Participants[i].lastName === participantLast){
                participantTable.deleteRow(1);
                Participants.splice(i,1)
                break
            }
        }
    }
});

