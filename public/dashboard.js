class Meeting{
    constructor(name,id,arr){
        this.name = name
        this.id = id
        this.arr = arr
    }
}
class Participant{
    constructor(first,last,attendance, roster) {
        this.firstName = first
        this.lastName = last
        this.state = attendance
        this.partOfRoster = roster
    }
}
class PastMeeting{
    constructor(MeetingName, MeetingID, MeetingStart,MeetingEnd,events,docID) {
        this.MeetingName = MeetingName
        this.MeetingID = MeetingID
        this.MeetingStart = MeetingStart
        this.MeetingEnd = MeetingEnd
        this.events = events
        this.docID = docID
    }
}
//TODO: make sure to clear table at meeting end
//TODO: add alert for save meeting
var Meetings = []
var PastMeetings
var MeetingsdidLoad = false
var Participants = []
var names = []
var meetingOccuring = false
var CurrentMeeting = ""
var CurrentMeetingID = ""
var meetingIndex = -1
var currentRecordIndex = -1
const firestore = firebase.firestore()
const auth = firebase.auth()

document.getElementById("meeting-id-attendance").hidden = true
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

function updateParticipantTable(){
    if( document.getElementById("present-filter").classList.contains("filter-active")){
        filterClick("present-filter")
    }
    else if( document.getElementById("all-filter").classList.contains("filter-active")){
        filterClick("all-filter")
    }
    else if( document.getElementById("absent-filter").classList.contains("filter-active")){
        filterClick("absent-filter")
    }
    else if( document.getElementById("left-meeting-filter").classList.contains("filter-active")){
        filterClick("not-registered-filter")
    }
    else if( document.getElementById("not-registered-filter").classList.contains("filter-active")){
        filterClick("not-registered-filter")
    }
}



try{
    var connectionToServer = setInterval(()=> {
        clearInterval(connectionToServer)
        const socket = new WebSocket('ws://bf19eede0484.ngrok.io');
        socket.onerror=function(event){
            console.log("Connection to server has been refused");
        }
        socket.addEventListener("open", () => {
            console.log("Connected to Server")
            socket.send(localStorage.getItem("userEmail"))

        })
        socket.addEventListener('message', function (event) {
            const data = event.data.split(" ");
            const eventType = data[0]
            if(eventType === "meeting.started"){
                document.getElementById("meeting-id-attendance").hidden = false
                var meetingName = ""
                for(i = 1; i < data.length;i++){
                    meetingName += data[i] + " "
                }
                CurrentMeeting = meetingName
                meetingOccuring = true
                document.getElementById("currentMeeting-name").innerHTML = "Meeting: " + meetingName
                document.getElementById("status-dot").classList.remove("dot-danger")
                if(meetingIndex === -1){
                    document.getElementById("status-dot").classList.add("dot-warning")
                }
                else{

                    document.getElementById("status-dot").classList.add("dot-success")
                }


            }
            else if(eventType === "meeting.ended"){
                document.getElementById("status-dot").classList.remove("dot-success")
                document.getElementById("status-dot").classList.add("dot-danger")
                document.getElementById("currentMeeting-name").innerHTML = "No meeting has started"
                document.getElementById("meeting-id-attendance").value = ""
                document.getElementById("meeting-id-attendance").hidden = true
                if(meetingIndex === -1){
                    $('#add-edit-meeting-modal').modal('show');
                    $("#meeting-id-input-field").val(CurrentMeetingID)
                    $("#meeting-name-input-field").val(CurrentMeeting)
                    $("#delete-meeting-button").prop('disabled', true)
                    $("#delete-meeting-button").hide()
                    $("#save-meeting-button").innerHTML = "Add Meeting"
                    const studentInputTable = document.getElementById("student-input-table")
                    while (studentInputTable.rows.length !== 0) {
                        studentInputTable.deleteRow(0)
                    }
                    for (i = 0; i < Participants.length; i++) {
                        addStudent(Participants[i].firstName + " " + Participants[i].lastName)
                    }
                    document.getElementById("meeting-modal-title").innerHTML = "Add Meeting"
                }
                meetingOccuring = false
                CurrentMeeting = ""
                CurrentMeetingID = ""
            }
            else if(eventType === "meeting.id"){
                CurrentMeetingID = data[1]
                document.getElementById("meeting-id-attendance").innerHTML = "ID: " + CurrentMeetingID
                meetingOccuring = false
                CurrentMeeting = ""
                document.getElementById("status-dot").classList.remove("dot-success")
                document.getElementById("status-dot").classList.add("dot-danger")
                for(i = 0; i < Meetings.length; i++){
                    if(String(Meetings[i].id) === String(CurrentMeetingID)){
                        meetingIndex = i;
                        break
                    }
                }
                if(meetingIndex !== -1){
                    for(i = 0 ; i < Meetings[meetingIndex].arr.length; i++){
                        const name = Meetings[meetingIndex].arr[i].split(" ")
                        const participantFirst = name[0]
                        const participantLast = name[name.length-1]
                        Participants.unshift(new Participant(participantFirst, participantLast, "Absent", true))

                    }
                }
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
                if(meetingIndex !== -1){
                    var isPartOfRoster = false
                    for(i = 0 ; i < Participants.length; i++){
                        if(Participants[i].firstName === participantFirst && Participants[i].lastName === participantLast){
                            const toAdd = Participants[i]
                            isPartOfRoster = true
                            Participants.splice(i,1)
                            Participants.unshift(new Participant(toAdd.firstName, toAdd.lastName, "Present",true, toAdd.presentTime, toAdd.absentTime))
                            break
                        }
                    }
                    if(!isPartOfRoster){
                        Participants.unshift(new Participant(participantFirst, participantLast, "Present",false,0,0))
                    }
                }
                else{
                    Participants.unshift(new Participant(participantFirst, participantLast, "Not Registered",false, 0 ,0))
                }
                updateParticipantTable()
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
                for(i = 0 ; i < Participants.length; i++){
                    if(Participants[i].firstName === participantFirst && Participants[i].lastName === participantLast){
                        const currParticipant = Participants[i]
                        Participants.splice(i,1)
                        if(currParticipant.partOfRoster){
                            Participants.unshift(new Participant(currParticipant.firstName, currParticipant.lastName, "Left Meeting", true))
                        }
                        break
                    }
                }
                updateParticipantTable()
            }
        });

    },500)

}
catch(e){
    console.log("Connection to server has been refused");
}

function clearTable(){
    const participantTable = document.getElementById("participant-table")
    const currentNumRows = participantTable.rows.length
    for(i = 0; i < currentNumRows-1; i++){
        participantTable.deleteRow(1);
    }
}



$("#student-search-input-field").on('keyup', function (e) {
    const participantTable = document.getElementById("participant-table")
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
    // TODO: Clear search bar
    const participantTable = document.getElementById("participant-table")
    document.getElementById(clicked_id).classList.add("filter-active")
    clearTable()
    if(clicked_id === "all-filter"){
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("absent-filter").classList.remove("filter-active")
        document.getElementById("not-registered-filter").classList.remove("filter-active")
        document.getElementById("left-meeting-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            var row = participantTable.insertRow(1);
            Participants[i].row = row
            if(Participants[i].state === "Not Registered"){
                row.style.backgroundColor = "#b8b8b8"
            }
            else{
                row.style.backgroundColor = "#ffffff"
            }
            row.style.color = "#000000"
            var cell1 = row.insertCell(0)
            var cell2 = row.insertCell(1)
            var cell3 = row.insertCell(2)
            cell3.innerHTML = Participants[i].state
            if(Participants[i].state === "Present"){
                cell3.style.color = "#00bc50"
            }
            if(Participants[i].state === "Absent"){
                cell3.style.color = "#dd174d"
            }
            if(Participants[i].state === "Left Meeting"){
                cell3.style.color = "#ddb217"
            }
            cell1.innerHTML = Participants[i].firstName
            cell2.innerHTML = Participants[i].lastName
        }
    }
    else if(clicked_id === "present-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("absent-filter").classList.remove("filter-active")
        document.getElementById("not-registered-filter").classList.remove("filter-active")
        document.getElementById("left-meeting-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "Present"){
                var row = participantTable.insertRow(1);
                row.style.backgroundColor = "#ffffff"
                row.style.color = "#000000"
                var cell1 = row.insertCell(0)
                var cell2 = row.insertCell(1)
                var cell3 = row.insertCell(2)
                cell3.innerHTML = Participants[i].state
                cell3.style.color = "#00bc50"
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
            }
        }
    }
    else if(clicked_id === "absent-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("not-registered-filter").classList.remove("filter-active")
        document.getElementById("left-meeting-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "Not Present"){
                var row = participantTable.insertRow(1);
                row.style.backgroundColor = "#ffffff"
                row.style.color = "#000000"
                var cell1 = row.insertCell(0)
                var cell2 = row.insertCell(1)
                var cell3 = row.insertCell(2)
                cell3.innerHTML = Participants[i].state
                cell3.style.color = "#dd174d"
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
            }
        }
    }
    else if(clicked_id === "not-registered-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("absent-filter").classList.remove("filter-active")
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("left-meeting-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "Not Registered"){
                var row = participantTable.insertRow(1);
                row.style.backgroundColor = "#b8b8b8"
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
    else if(clicked_id === "left-meeting-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("absent-filter").classList.remove("filter-active")
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("not-registered-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "Left Meeting"){
                var row = participantTable.insertRow(1);
                row.style.backgroundColor = "#ffffff"
                var cell1 = row.insertCell(0)
                var cell2 = row.insertCell(1)
                var cell3 = row.insertCell(2)
                cell3.innerHTML = Participants[i].state
                cell3.style.color = "#ddb217"
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
            }
        }
    }
}
const studentTableBlock = "<th scope=\"col\"> <input type=\"text\" placeholder=\"First name\" class=\"form-control student-name student-first-name modal-input\"></th>\n" +
    "<th scope=\"col\"> <input type=\"text\" placeholder=\"Last name\" class=\"form-control student-name modal-input\"></th>\n" +
    "<th scope=\"col\"> <button onclick=\"deleteStudent(this)\" class=\"btn trash-btn\" type=\"button\"><span class=\"iconify\" data-inline=\"false\" data-icon=\"ei:trash\" style=\"font-size: 30px;\"></span></button></th>"


function addMeetingModal(){
    const studentInputTable = document.getElementById("student-input-table")
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
    document.getElementById("meeting-modal-title").innerHTML = "Add Meeting"
}
function addStudent(name){
    const studentInputTable = document.getElementById("student-input-table")
    var row = studentInputTable.insertRow(studentInputTable.rows.length)
    row.innerHTML = studentTableBlock
    if(name){
        var res = name.split(" ")

        row.cells[0].children[0].value = res[0]
        row.cells[1].children[0].value = res[res.length-1]
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
if(localStorage.getItem("uid") !== "null") {
    firestore.collection("Periods").where("useruid", "==", localStorage.getItem("uid"))
        .onSnapshot((querySnapshot) => {
            if (localStorage.getItem("uid") !== "null") {
                Meetings = []
                querySnapshot.forEach((doc) => {
                    const currData = doc.data()
                    Meetings.push(new Meeting(currData.periodName, currData.meetingId, currData.studentsNames))
                })
                const meetingTable = document.getElementById("my-meetings-table")
                Meetings.sort(compareMeetings)
                while (meetingTable.rows.length > 1) {
                    meetingTable.deleteRow(1)
                }
                const studentInputTable = document.getElementById("student-input-table")
                for (i = Meetings.length - 1; i >= 0; i--) {
                    var currentRow = meetingTable.insertRow(1)
                    currentRow.classList.add("meeting-row")
                    currentRow.addEventListener("click", function () {
                        var index = this.rowIndex
                        currentRecordIndex = index-1
                        document.getElementById("meeting-modal-title").innerHTML = "Edit Meeting"
                        editingIndex = index
                        $('#add-edit-meeting-modal').modal('show');
                        const currentMeeting = Meetings[index - 1]
                        $("#meeting-id-input-field").val(currentMeeting.id)
                        $("#meeting-name-input-field").val(currentMeeting.name)
                        $("#delete-meeting-button").prop('disabled', false)
                        $("#delete-meeting-button").show()
                        while (studentInputTable.rows.length !== 0) {
                            studentInputTable.deleteRow(0)
                        }
                        for (i = 0; i < currentMeeting.arr.length; i++) {
                            addStudent(currentMeeting.arr[i])
                        }
                    })
                    var cell1 = currentRow.insertCell(0)
                    var cell2 = currentRow.insertCell(1)
                    cell1.innerHTML = Meetings[i].name
                    cell2.innerHTML = Meetings[i].id
                    cell2.classList.add("meeting-id-text")
                }
                MeetingsdidLoad = true
            }
        });
}
function compareMeetings(a, b) {
    if (a.name > b.name) return 1;
    if (b.name > a.name) return -1;
    if(a.id > b.id) return 1
    if(a.id < b.id) return -1
    return 0;
}
function comparePastMeetings(a, b) {
    if (a.MeetingStart > b.MeetingEnd) return -1
    return 1;
}
if(localStorage.getItem("uid") !== "null") {
    firestore.collection("Records").where("useruid", "==", localStorage.getItem("uid"))
        .onSnapshot((querySnapshot) => {
            if (localStorage.getItem("uid") !== "null") {
                PastMeetings = []
                querySnapshot.forEach((doc) => {
                    const currData = doc.data()
                    PastMeetings.push(new PastMeeting(currData.MeetingName, currData.MeetingID, currData.MeetingStart, currData.MeetingEnd, currData.Events,doc.id))
                })
                const recordTable = document.getElementById("records-table")
                PastMeetings.sort(comparePastMeetings)
                while (recordTable.rows.length > 1) {
                    recordTable.deleteRow(1)
                }
                console.log(PastMeetings)
                const currentRecordTable = document.getElementById("current-record-table")
                for (i = PastMeetings.length - 1; i >= 0; i--) {
                    var currentRow = recordTable.insertRow(1)
                    currentRow.classList.add("record-row");
                    currentRow.addEventListener("click", function () {
                        var index = this.rowIndex
                        currentRecordIndex = index-1
                        const currentMeeting = PastMeetings[index - 1]
                        document.getElementById("current-record-name").innerHTML = "Meeting Name: " + currentMeeting.MeetingName
                        document.getElementById("current-record-id").innerHTML = "Meeting ID: " + currentMeeting.MeetingID
                        document.getElementById("current-record-date").innerHTML = "Date: " + currentMeeting.MeetingStart.toDate().toLocaleString() + " - " + currentMeeting.MeetingEnd.toDate().toLocaleString()
                        $('#meeting-record-modal').modal('show');
                        while (currentRecordTable.rows.length !== 0) {
                            currentRecordTable.deleteRow(0)
                        }
                        for (i = 0; i < currentMeeting.events.length; i++) {
                            var row = currentRecordTable.insertRow(currentRecordTable.rows.length)
                            var cell1 = row.insertCell(0)
                            cell1.innerHTML = currentMeeting.events[i]
                        }
                    })
                    var cell1 = currentRow.insertCell(0)
                    var cell2 = currentRow.insertCell(1)
                    var cell3 = currentRow.insertCell(2)
                    currentRow.style.backgroundColor = "#ffffff"
                    cell1.innerHTML = PastMeetings[i].MeetingName
                    cell2.innerHTML = PastMeetings[i].MeetingID
                    cell3.innerHTML = PastMeetings[i].MeetingStart.toDate().toLocaleString()
                    cell2.classList.add("meeting-id-text")
                }
            }
        });
}
$("#records-search-input-field").on('keyup', function (e) {
    const recordTable = document.getElementById("records-table")
    currValue = $(this).val();
    if (e.key === 'Enter' || e.keyCode === 13) {
        $("#records-search-input-field").blur()
    }
    while(recordTable.rows.length > 1){
        recordTable.deleteRow(1)
    }
    for(let i = PastMeetings.length-1; i >= 0; i--){
        const name = PastMeetings[i].MeetingName
        const currentRecordTable = document.getElementById("current-record-table")
        if(name.includes(currValue)){
            var currentRow = recordTable.insertRow(1)
            currentRow.addEventListener("click", function () {
                var index = this.rowIndex
                currentRecordIndex = index-1
                const currentMeeting = PastMeetings[index - 1]
                document.getElementById("current-record-name").innerHTML = "Meeting Name: " + currentMeeting.MeetingName
                document.getElementById("current-record-id").innerHTML = "Meeting ID: " + currentMeeting.MeetingID
                document.getElementById("current-record-date").innerHTML = "Date: " + currentMeeting.MeetingStart.toDate().toLocaleString() + " - " + currentMeeting.MeetingEnd.toDate().toLocaleString()
                $('#meeting-record-modal').modal('show');

                while (currentRecordTable.rows.length !== 0) {
                    currentRecordTable.deleteRow(0)
                }
                for (i = 0; i < currentMeeting.events.length; i++) {
                    var row = currentRecordTable.insertRow(currentRecordTable.rows.length)
                    var cell1 = row.insertCell(0)
                    cell1.innerHTML = currentMeeting.events[i]
                }
            })
            var cell1 = currentRow.insertCell(0)
            var cell2 = currentRow.insertCell(1)
            var cell3 = currentRow.insertCell(2)
            currentRow.style.backgroundColor = "#ffffff"
            cell1.innerHTML = PastMeetings[i].MeetingName
            cell2.innerHTML = PastMeetings[i].MeetingID
            cell3.innerHTML = PastMeetings[i].MeetingStart.toDate().toLocaleString()
            cell2.classList.add("meeting-id-text")
            currentRow.classList.add("record-row")
        }
    }

});
$("#current-record-search-input-field").on('keyup', function (e) {
    const currentRecordTable = document.getElementById("current-record-table")
    currValue = $("#current-record-search-input-field").val();
    if (e.key === 'Enter' || e.keyCode === 13) {
        $("#current-record-search-input-field").blur()
    }

    while(currentRecordTable.rows.length > 0){
        currentRecordTable.deleteRow(0)
    }
    for(let i = PastMeetings[currentRecordIndex].events.length-1; i >= 0; i--){
        const currString = PastMeetings[currentRecordIndex].events[i]
        if(currString.includes(currValue)){
            var row = currentRecordTable.insertRow(0);
            row.style.backgroundColor = "#ffffff"
            row.style.color = "#000000"
            var cell1 = row.insertCell(0)
            cell1.innerHTML = PastMeetings[currentRecordIndex].events[i]

        }
    }

});

function deleteRecord(){
    const currentRecord = PastMeetings[currentRecordIndex]
    firestore.collection("Records").doc(currentRecord.docID).delete().then(() => {
        $("#meeting-record-modal").modal("hide")
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });
}

var editingIndex = 1
function deleteMeeting(){
    const currentMeeting = Meetings[editingIndex-1]
    const uid = localStorage.getItem("uid")
    const currentId = currentMeeting.id
    const reference = uid+currentId
    firestore.collection("Periods").doc(reference).delete().then(() => {
        $("#add-edit-meeting-modal").modal("hide")
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });
}

function check(){
    const idInput = document.getElementById("meeting-id-input-field").value
    const nameInput = document.getElementById("meeting-name-input-field").value

    names = []
    var currentName = ""
    var currentCount = 0
    var shouldProceed = true;
    if(idInput === "" || idInput == null){
        document.getElementById("meeting-id-input-field").classList.add("input-error")
        shouldProceed = false;
    }
    else{
        document.getElementById("meeting-id-input-field").classList.remove("input-error")
    }
    if(nameInput === "" || idInput == null){
        document.getElementById("meeting-name-input-field").classList.add("input-error")
        shouldProceed = false;
    }
    else{
        document.getElementById("meeting-name-input-field").classList.remove("input-error")
    }
    $('.student-name').each(function(index,data) {
        const value = $(this).val().trim();
        if(currentCount % 2 === 0){
            currentName += value + " "
        }
        else{
            currentName += value
            names.push(currentName)
            currentName = ""
        }
        if(value === "" || value == null){
            this.classList.add("input-error")
            shouldProceed = false;
        }
        else{
            this.classList.remove("input-error")
        }
        currentCount += 1
    });
    return shouldProceed
}
function checkID(){
    const currID = document.getElementById("meeting-id-input-field").value
    if(currID.length < 9){
        document.getElementById("meeting-id-input-field").classList.add("input-error")
        return false
    }
    document.getElementById("meeting-id-input-field").classList.remove("input-error")
    return true
}

function checkDuplicateID(){
    const meetingId = document.getElementById("meeting-id-input-field").value
    if(document.getElementById("delete-meeting-button").hasAttribute("disabled")){
        for(i = 0; i < Meetings.length; i++){
            if(Meetings[i].id === meetingId){
                console.log(1)
                document.getElementById("meeting-id-input-field").classList.add("input-error")
                return false;
            }
        }
    }
    else{
        for(i = 0; i < Meetings.length; i++){
            if(Meetings[i].id === meetingId && i !== editingIndex-1){
                console.log(2)
                document.getElementById("meeting-id-input-field").classList.add("input-error")
                return false;
            }
        }
    }
    document.getElementById("meeting-id-input-field").classList.remove("input-error")
    return true
}

function addMeeting(){
    const shouldProceed = check()
    if(shouldProceed){
        if(checkID()){
            if(checkDuplicateID()){
                const user = auth.currentUser
                const periodName = document.getElementById("meeting-name-input-field").value
                const meetingId = document.getElementById("meeting-id-input-field").value
                if(!document.getElementById("delete-meeting-button").hasAttribute("disabled")){
                    if(meetingId !== Meetings[editingIndex-1].id){
                        deleteMeeting()
                    }
                }
                firestore.collection("Periods").doc(user.uid+meetingId).set({
                    useruid : user.uid,
                    periodName : periodName,
                    meetingId : meetingId,
                    studentsNames: names,
                }).then(() => {
                    $("#add-edit-meeting-modal").modal("hide")
                }).catch((error)=>{
                    console.log(error.message)
                    $(".notify").addClass("notify-active");
                    $("#notifyType").addClass("failureServer");

                    setTimeout(function(){
                        $(".notify").removeClass("notify-active");
                        $("#notifyType").removeClass("failureServer");
                    },2000);
                })
            }
            else{
                $(".notify").addClass("notify-active");
                $("#notifyType").addClass("failureIDDup");

                setTimeout(function(){
                    $(".notify").removeClass("notify-active");
                    $("#notifyType").removeClass("failureIDDup");
                },2000);
            }
        }
        else{
            $(".notify").addClass("notify-active");
            $("#notifyType").addClass("failureID");

            setTimeout(function(){
                $(".notify").removeClass("notify-active");
                $("#notifyType").removeClass("failureID");
            },2000);
        }
    }
    else{
        $(".notify").addClass("notify-active");
        $("#notifyType").addClass("failure");

        setTimeout(function(){
            $(".notify").removeClass("notify-active");
            $("#notifyType").removeClass("failure");
        },2000);
    }

}
function logout(){
    auth.signOut().then(r => {
        console.log("user has signed out")
        localStorage.setItem("userDisplayName",null)
        localStorage.setItem("userEmail",null)
        localStorage.setItem("uid",null)
        window.location.href = "index.html";
    }).catch(err => {console.log(err.message)});
}
function resetSettingInput(){
    document.getElementById("displayName-input-field").value = ""
    document.getElementById("old-email-input-field").value = ""
    document.getElementById("current-password-input-field").value = ""
    document.getElementById("email-input-field").value = ""
    document.getElementById("pass-current-email-input-field").value = ""

}
function saveDisplayName(){
    if(document.getElementById("displayName-input-field").value !== ""){
        auth.currentUser.updateProfile({
            displayName: document.getElementById("displayName-input-field").value
        }).then(function() {
            //TODO: add success alert
            //TODO: update firestore
            document.getElementById("user-name").innerHTML = "Welcome " + document.getElementById("displayName-input-field").value
            localStorage.setItem("userDisplayName",document.getElementById("displayName-input-field").value)
            document.getElementById("displayName-input-field").value = ""
        }).catch(function(error) {
            //TODO: add error alert
            console.log(error)
        });
    }
    else{
        //TODO: add error alert
        console.log("please enter in the input field")
    }

}
function saveEmail(){
    firebase.auth().signInWithEmailAndPassword(document.getElementById("old-email-input-field").value, document.getElementById("current-password-input-field").value)
        .then((userCredential) => {
            auth.currentUser.updateEmail(document.getElementById("email-input-field").value).then(function() {
                console.log(auth.currentUser)
                auth.currentUser.sendEmailVerification().then(function() {
                    //TODO: say verification email has been sent
                    //TODO: update firestore
                }).catch(function(error) {
                    console.log(error.message)
                });
            }).catch(function(error) {
                console.log(error.message)
            });
        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(error.message)
        });
    document.getElementById("old-email-input-field").value = ""
    document.getElementById("current-password-input-field").value = ""
    document.getElementById("email-input-field").value = ""
}
function resendVerificationEmail(){
    auth.currentUser.sendEmailVerification().then(function() {
        //TODO: say verification email has been sent
    }).catch(function(error) {
        console.log(error.message)
    });
}
function resetPassword(){
    auth.sendPasswordResetEmail(document.getElementById("pass-current-email-input-field").value).then(function() {
        //TODO: say email has been sent
    }).catch(function(error) {
        console.log(error)
    });
}
//TODO; fix input icons
//TODO: disable functions when email is not entered
//TODO: check meeting record update
