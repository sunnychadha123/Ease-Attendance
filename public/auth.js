


const auth = firebase.auth()
const firestore = firebase.firestore()
var names = []

function authenticate(){
    const pass = document.getElementById("pass").value
    const repass = document.getElementById("re_pass").value
    const email = document.getElementById("email").value
    const name = document.getElementById("name").value
    try{
        if(pass === repass && pass.length >= 8){
            auth.createUserWithEmailAndPassword(email,pass).then(cred => {
                auth.currentUser.updateProfile({
                        displayName: name
                    }
                ).then(function() {
                    var userEmail = cred.user.email
                    var userDisplayName = cred.user.displayName
                    if(userDisplayName == null){
                        userDisplayName = ""
                    }
                    if(userEmail == null){
                        userEmail = ""
                    }
                    auth.currentUser.sendEmailVerification().then(() => {
                        const user = cred.user
                        firestore.collection("Users").doc(user.uid).set({
                            name: user.displayName,
                            email: user.email
                        })
                            .then(function() {
                                localStorage.setItem("userDisplayName",userDisplayName)
                                localStorage.setItem("uid",cred.user.uid)
                                localStorage.setItem("userEmail",userEmail)
                                window.location.href = "verify.html";

                            })
                            .catch(function(error) {
                                document.getElementById("signUpMessage").innerHTML = error.message
                            });
                    }).catch((error) => {
                        document.getElementById("signUpMessage").innerHTML = error.message
                    })


                }).catch((e) => {
                    document.getElementById("signUpMessage").innerHTML = e.message
                })
            }).catch(err => document.getElementById("signUpMessage").innerHTML = err.message)

        }
        else if(pass.length < 8){
            document.getElementById("signUpMessage").innerHTML = "Make sure your password is 8 or more characters"
        }
        else{
            document.getElementById("signUpMessage").innerHTML = "The passwords do not match"
        }
    }
    catch(err){
        document.getElementById("signUpMessage").innerHTML = err.message;
    }
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
    if(currID.length !== 11){
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


function login(){
    const email = document.getElementById("login-email").value
    const pass = document.getElementById("login-pass").value
    auth.signInWithEmailAndPassword(email,pass).then(cred => {
        var userEmail = cred.user.email
        var userDisplayName = cred.user.displayName
        if(userDisplayName == null){
            userDisplayName = ""
        }
        if(userEmail == null){
            userEmail = ""
        }
        localStorage.setItem("userDisplayName",userDisplayName)
        localStorage.setItem("userEmail",userEmail)
        localStorage.setItem("uid",cred.user.uid)
        window.location.href = "dashboard.html";

    }).catch(err => {
        document.getElementById("loginMessage").innerHTML = err.message;
    })
}
function resend(){
    auth.currentUser.sendEmailVerification().then(() => {
        document.getElementById("resend-title").innerHTML = "Please verify your email"
        document.getElementById("resend-description").innerHTML = "A new verification link has just been sent to your email"
    }).catch((error) => {
        document.getElementById("resend-title").innerHTML = "An error has occurred"
        document.getElementById("resend-description").innerHTML = ""
    })

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
class Meeting{
    constructor(name,id,arr){
        this.name = name
        this.id = id
        this.arr = arr
    }
}
var Meetings = []
function compareMeetings(a, b) {
    if (a.name > b.name) return 1;
    if (b.name > a.name) return -1;
    if(a.id > b.id) return 1
    if(a.id < b.id) return -1
    return 0;
}

firestore.collection("Periods").where("useruid", "==", localStorage.getItem("uid"))
    .onSnapshot((querySnapshot) => {
        if(localStorage.getItem("uid") !== "null"){
            Meetings = []
            querySnapshot.forEach((doc) => {
                const currData = doc.data()
                Meetings.push(new Meeting(currData.periodName,currData.meetingId,currData.studentsNames))
            })
            const meetingTable = document.getElementById("my-meetings-table")
            Meetings.sort(compareMeetings)
            while(meetingTable.rows.length > 1){
                meetingTable.deleteRow(1)
            }
            for(i = Meetings.length-1; i >= 0 ; i--){
                var currentRow = meetingTable.insertRow(1)
                currentRow.classList.add("meeting-row")
                currentRow.addEventListener("click", function() {
                    var index = this.rowIndex
                    editingIndex = index
                    $('#add-edit-meeting-modal').modal('show');
                    const currentMeeting = Meetings[index-1]
                    $("#meeting-id-input-field").val(currentMeeting.id)
                    $("#meeting-name-input-field").val(currentMeeting.name)
                    $("#delete-meeting-button").prop('disabled',false)
                    $("#delete-meeting-button").show()
                    $("#save-meeting-button").innerHTML = "Save changes"
                    while(studentInputTable.rows.length !== 0){
                        studentInputTable.deleteRow(0)
                    }
                    for(i = 0; i < currentMeeting.arr.length; i++){
                        addStudent(currentMeeting.arr[i])
                    }
                })
                var cell1 = currentRow.insertCell(0)
                var cell2 = currentRow.insertCell(1)
                cell1.innerHTML = Meetings[i].name
                cell2.innerHTML = Meetings[i].id
                cell2.classList.add("meeting-id-text")
            }



        }
    });



