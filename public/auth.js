


const auth = firebase.auth()
const firestore = firebase.firestore()


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
                    const user = cred.user
                    firestore.collection("Users").doc(user.uid).set({
                        name: user.displayName,
                        email: user.email
                    })
                        .then(function() {
                            localStorage.setItem("userDisplayName",userDisplayName)
                            localStorage.setItem("userEmail",userEmail)
                            window.location.href = "dashboard.html";
                        })
                        .catch(function(error) {
                            document.getElementById("signUpMessage").innerHTML = error.message
                        });

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
