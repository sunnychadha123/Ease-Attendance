
document.getElementById("user-name").innerHTML = localStorage.getItem("userDisplayName")
document.getElementById("user-email").innerHTML = localStorage.getItem("userEmail")


function logout(){
    auth.signOut().then(r => {
        console.log("user has signed out")
        window.location.href = "index.html";
    }).catch(err => {console.log(err.message)});
}
