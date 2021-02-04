


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
                            email: user.email,
                            periods: []
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
function getNames(){
    names = []
    var currentName = ""
    var currentCount = 0
    var shouldProceed = true;
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
            this.classList.add("student-name-error")
            shouldProceed = false;
        }
        else{
            this.classList.remove("student-name-error")
        }
        currentCount += 1
    });
    return shouldProceed
}
function addMeeting(){
    const shouldProceed = getNames()
    if(shouldProceed){
        const user = auth.currentUser
        const periodName = document.getElementById("meeting-name-input-field").value
        const meetingId = document.getElementById("meeting-id-input-field").value
        firestore.collection("Periods").doc(user.uid+meetingId).set({
            periodName : periodName,
            meetingId : meetingId,
            studentsNames: names,
        }).then(() => {
            firestore.collection("Users").doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    var currentPeriods = doc.data().periods
                    const newPeriod = user.uid + meetingId
                    currentPeriods.push(newPeriod)
                    firestore.collection("Users").doc(user.uid).update({
                        periods: currentPeriods
                    }).then(() => {
                        $("#add-edit-meeting-modal").modal("hide")
                    }).catch((error) => {
                        console.log(error.message)
                        //TODO: add alert
                    })
                } else {
                    const newPeriod = user.uid + meetingId
                    var newPeriodArray = []
                    newPeriodArray.push(newPeriod)
                    firestore.collection("Users").doc(user.uid).update({
                        periods: newPeriodArray
                    }).then(() => {
                        $("#add-edit-meeting-modal").modal("hide")
                    }).catch((error) => {
                        console.log(error.message)
                        //TODO: add alert
                    })
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
                //TODO: add alert
            });

        }).catch((error)=>{
            console.log(error.message)
            //TODO: add alert
        })
    }
    else{
        console.log("check input vals")
        //TODO: add alert
    }

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
