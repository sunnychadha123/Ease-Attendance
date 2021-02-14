

const auth = firebase.auth()
const firestore = firebase.firestore()

function authenticate(){
    const pass = document.getElementById("pass").value
    const repass = document.getElementById("re_pass").value
    const email = document.getElementById("email").value.trim()
    const name = document.getElementById("name").value.trim()
    if(name.length > 35){
        document.getElementById("signUpMessage").innerHTML = "Please choose a shorter display name"
    }
    else if (!validateEmail(email)){
        document.getElementById("signUpMessage").innerHTML = "Please enter a valid email"
    }
    else{
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
                                    window.location.href = "verify"
                                })
                                .catch(function(error) {
                                    document.getElementById("signUpMessage").innerHTML = error.message
                                });
                        }).catch((error) => {
                            document.getElementById("signUpMessage").innerHTML = "Please enter a valid email"
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

}
function validateEmail(email)
{
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}
function login(){
    const email = document.getElementById("login-email").value.trim()
    const pass = document.getElementById("login-pass").value
    const remember = document.getElementById("remember-me").checked
    if(validateEmail(email)){
        auth.signInWithEmailAndPassword(email,pass).then(cred => {
            var userEmail = cred.user.email
            var userDisplayName = cred.user.displayName
            if(userDisplayName == null){
                userDisplayName = ""
            }
            if(userEmail == null){
                userEmail = ""
            }
            if(remember === true){
                auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
                    window.location.href = "dashboard"
                }).catch((error) =>{
                    document.getElementById("loginMessage").innerHTML = error.message;
                })
            }
            else{
                auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).then(() => {
                    window.location.href = "dashboard"
                }).catch((error) => {
                    document.getElementById("loginMessage").innerHTML = error.message;
                })
            }



        }).catch(err => {
            if(err.code === "auth/user-not-found"){
                document.getElementById("loginMessage").innerHTML = "There is no user with that email address";
            }
            else if(err.code === "auth/network-request-failed"){
                document.getElementById("loginMessage").innerHTML = "Please connect to the internet";
            }
            else if(err.code === "auth/wrong-password"){
                document.getElementById("loginMessage").innerHTML = "Incorrect password";
            }
           else{
                document.getElementById("loginMessage").innerHTML = err.message;
            }
        })
    }
    else{
        document.getElementById("loginMessage").innerHTML = "Please enter a valid email"
    }
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



