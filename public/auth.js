


const auth = firebase.auth()
const firestore = firebase.firestore()
var periodReferences = []

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
                            email: user.email,
                            periods: periodReferences
                        })
                            .then(function() {
                                localStorage.setItem("userDisplayName",userDisplayName)
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

function addPeriod(){

    //following creates a document in 'Periods' collection with the following values
    //names is constantly being updated with every click of button 'personName' in updateList()
    const user = auth.currentUser
    var periodName = document.getElementById("PeriodName").value
    var meetingId = document.getElementById("meetingId").value

    firestore.collection("Periods").doc(user.uid+periodName).set({
        periodName : periodName,
        meetingId : meetingId,
        studentsNames: periodReferences,
    })

    //adds reference to Period document in 'Period' array in User document
    //using const var firestore didnt work but firebase.firestore does for some reason
    //^^that needs a fix lmao
    var temp = firestore.collection("Users").doc(user.uid)
    temp.update({
        periods : firebase.firestore.FieldValue.arrayUnion(user.uid+periodName)
    })

    //resets array and visual aids that show array on dashboard
    document.getElementById("list").innerHTML = ''
    periodReferences.splice(0,periodReferences.length)
    document.getElementById("list").value = ""
}

function deletePeriod(){
    const periodName = document.getElementById("DeletePeriodName").value
    const userUID = auth.currentUser.uid
    firestore.collection("Periods").doc(userUID+periodName).delete()
    firestore.collection("Users").doc(userUID).update({
        periods : firebase.firestore.FieldValue.arrayRemove(userUID+periodName)
    })
}

function updateList() {
    //gets name from editable and displays under buttons, puts in global array 'names'
    var name = document.getElementById("personName").value;

    var codeBlock = '<div class="content">' +
        '<h3>'+name+'</h3>' +
        '</div>';

    periodReferences.push(name);
    //appends codeblock into list
    document.getElementById("list").innerHTML = document.getElementById("list").innerHTML+codeBlock
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
        window.location.href = "index.html";
    }).catch(err => {console.log(err.message)});
}
