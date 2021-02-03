


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
                            periods: names
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

    const user = auth.currentUser
    var periodName = document.getElementById("PeriodName").value

    console.log("period name is "+ periodName)

    firestore.collection("Periods").doc(user.uid+periodName).set({
        names: names,
    })

    console.log("collection send with "+ names)

    var temp = firestore.collection("Users").doc(user.uid)
    var prevPeriods = temp.periods

    console.log("prev periods from user "+ prevPeriods)


    if (prevPeriods !== undefined) {
        prevPeriods.add(user.uid+periodName)

        firestore.collection("Users").doc(user.uid).update({
            periods: prevPeriods
        })
    }else{
        var tempReference = [user.uid+periodName]
        firestore.collection("Users").doc(user.uid).update({
            periods: tempReference
        })
    }
    console.log("prev periods from user "+ prevPeriods)
    names.splice(0,names.length)
    document.getElementById("list").value = ""
}

function updateList() {
    console.log("request to update list sent")
    var text = document.getElementById("personName").value;
    names[names.length] = text
    console.log(names)
    //Now use appendChild and add it to the list!
    document.getElementById("list").append(" "+text);
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
        localStorage.setItem("userDisplayName","")
        localStorage.setItem("userEmail","")
        window.location.href = "index.html";
    }).catch(err => {console.log(err.message)});
}
