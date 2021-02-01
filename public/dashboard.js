setTimeout(() => {
    document.getElementById("user-name").innerHTML = firebase.auth().currentUser.displayName
    document.getElementById("user-email").innerHTML = firebase.auth().currentUser.email
},3000)

function logout(){
    auth.signOut().then(r => {
        console.log("user has signed out")
        window.location.href = "index.html";
    }).catch(err => {console.log(err.message)});
}
