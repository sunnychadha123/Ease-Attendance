



const auth = firebase.auth()

function signup(){
    const pass = document.getElementById("pass").value
    const repass = document.getElementById("re_pass").value
    const email = document.getElementById("email").value
    const name = document.getElementById("name").value
    console.log("button pressed")
    try{
        if(pass === repass && pass.length >= 8){
            auth.createUserWithEmailAndPassword(email,pass).then(cred => {
                document.getElementById("signUpMessage").innerHTML = "You have created an account"
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
