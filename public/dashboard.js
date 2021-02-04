$("input").on("click", function(){
    $(this).removeClass('input-error')
})
$(function() {
    $('#meeting-id-input-field').on('keypress', function(e) {
        if (e.which === 32 || document.getElementById("meeting-id-input-field").value.length >= 11){
            return false;
        }
    });
});
$('#meeting-id-input-field').on('paste', function (event) {
    if (event.originalEvent.clipboardData.getData('Text').match(/[^\d]/)) {
        event.preventDefault();
    }
});

document.getElementById("user-name").innerHTML = "Welcome " + localStorage.getItem("userDisplayName")

if(localStorage.getItem("userEmail") === "null"){
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
    const currentNumRows = participantTable.rows.length
    for(i = 0; i < currentNumRows-1; i++){
        participantTable.deleteRow(1);
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
        document.getElementById("currentMeeting-name").innerHTML = "Meeting: " + CurrentMeeting
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
        row.style.color = "#000000"
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
            participantLast = data[data.length-1]
        }
        for(i = 0; i < Participants.length; i++){
            if(Participants[i].firstName === participantFirst && Participants[i].lastName === participantLast){
                participantTable.deleteRow(i+1);
                Participants.splice(i,1)
                break
            }
        }
    }
});

$("#student-search-input-field").on('keyup', function (e) {
    //TODO : base on current table not on participant list
    currValue = $("#student-search-input-field").val();
    if (e.key === 'Enter' || e.keyCode === 13) {
        $("#student-search-input-field").blur()
    }

    clearTable()
    for(let i = Participants.length-1; i >= 0; i--){
        const fullName = Participants[i].firstName + " " + Participants[i].lastName
        if(fullName.includes(currValue)){
            var row = participantTable.insertRow(1);
            row.style.backgroundColor = "#ffffff"
            row.style.color = "#000000"
            var cell1 = row.insertCell(0)
            var cell2 = row.insertCell(1)
            var cell3 = row.insertCell(2)
            cell3.innerHTML = Participants[i].state
            cell1.innerHTML = Participants[i].firstName
            cell2.innerHTML = Participants[i].lastName
        }
    }

});
function filterClick(clicked_id){
    document.getElementById(clicked_id).classList.add("filter-active")
    clearTable()
    if(clicked_id === "all-filter"){
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("not-present-filter").classList.remove("filter-active")
        document.getElementById("tardy-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            var row = participantTable.insertRow(1);
            row.style.backgroundColor = "#ffffff"
            row.style.color = "#000000"
            var cell1 = row.insertCell(0)
            var cell2 = row.insertCell(1)
            var cell3 = row.insertCell(2)
            cell3.innerHTML = Participants[i].state
            cell1.innerHTML = Participants[i].firstName
            cell2.innerHTML = Participants[i].lastName
        }
    }
    else if(clicked_id === "present-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("not-present-filter").classList.remove("filter-active")
        document.getElementById("tardy-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "present"){
                var row = participantTable.insertRow(1);
                row.style.backgroundColor = "#ffffff"
                row.style.color = "#000000"
                var cell1 = row.insertCell(0)
                var cell2 = row.insertCell(1)
                var cell3 = row.insertCell(2)
                cell3.innerHTML = Participants[i].state
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
            }
        }
    }
    else if(clicked_id === "not-present-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("tardy-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "not-present"){
                var row = participantTable.insertRow(1);
                row.style.backgroundColor = "#ffffff"
                row.style.color = "#000000"
                var cell1 = row.insertCell(0)
                var cell2 = row.insertCell(1)
                var cell3 = row.insertCell(2)
                cell3.innerHTML = Participants[i].state
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
            }
        }
    }
    else if(clicked_id === "tardy-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("not-present-filter").classList.remove("filter-active")
        document.getElementById("present-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "tardy"){
                var row = participantTable.insertRow(1);
                row.style.backgroundColor = "#ffffff"
                row.style.color = "#000000"
                var cell1 = row.insertCell(0)
                var cell2 = row.insertCell(1)
                var cell3 = row.insertCell(2)
                cell3.innerHTML = Participants[i].state
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
            }
        }
    }
}
const studentInputTable = document.getElementById("student-input-table")
const studentTableBlock = "<th scope=\"col\"> <input type=\"text\" placeholder=\"First name\" class=\"form-control student-name student-first-name modal-input\"></th>\n" +
    "<th scope=\"col\"> <input type=\"text\" placeholder=\"Last name\" class=\"form-control student-name modal-input\"></th>\n" +
    "<th scope=\"col\"> <button onclick=\"deleteStudent(this)\" class=\"btn trash-btn\" type=\"button\"><span class=\"iconify\" data-inline=\"false\" data-icon=\"ei:trash\" style=\"font-size: 30px;\"></span></button></th>"


function addMeetingModal(){
    $("#delete-meeting-button").prop('disabled',true)
    $("#delete-meeting-button").hide()
    $("#meeting-id-input-field").val("")
    $("#meeting-name-input-field").val("")
    $("#meeting-id-input-field").removeClass("input-error")
    $("#meeting-name-input-field").removeClass("input-error")
    while(studentInputTable.rows.length !== 0){
        studentInputTable.deleteRow(0)
    }
    addStudent()
}
function addStudent(name){
    let row = studentInputTable.insertRow(studentInputTable.rows.length)
    row.innerHTML = studentTableBlock
    if(name){
        var res = name.split(" ")

        row.cells[0].children[0].value = res[0]
        row.cells[1].children[0].value = res[1]
    }
    $("input").on("click", function(){
        $(this).removeClass('input-error')
    })
    $('.student-name').on('keypress', function(e) {
        if (e.which === 32){
            return false;
        }
    });
    $('.student-name').on('paste', function (event) {
        if (event.originalEvent.clipboardData.getData('Text').match(/[^\w]/)) {
            event.preventDefault();
        }
    });
}
function deleteStudent(e){
    const currentRow = e.parentNode.parentNode
    currentRow.parentNode.removeChild(currentRow)
}
