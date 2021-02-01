



const auth = firebase.auth()

function authenticate(){
    const pass = document.getElementById("pass").value
    const repass = document.getElementById("re_pass").value
    const email = document.getElementById("email").value
    const name = document.getElementById("name").value
    console.log("button pressed")
    try{
        if(pass === repass && pass.length >= 8){
            auth.createUserWithEmailAndPassword(email,pass).then(cred => {
                document.getElementById("signUpMessage").innerHTML = "You have created an account"
                window.location.href = "dashboard.html";
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

function logout(){
    auth.signOut().then(r => {
        console.log("user has signed out")
        window.location.href = "index.html";
    }).catch(err => {console.log(err.message)});
}
function login(){
    const email = document.getElementById("login-email").value
    const pass = document.getElementById("login-pass").value
    auth.signInWithEmailAndPassword(email,pass).then(cred => {
        // TODO: remove this console log
        console.log(cred);
        window.location.href = "dashboard.html";

    })

}
