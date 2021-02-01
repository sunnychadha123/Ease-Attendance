
document.getElementById("user-name").innerHTML = localStorage.getItem("userDisplayName")
document.getElementById("user-email").innerHTML = localStorage.getItem("userEmail")
if(localStorage.getItem("userEmail") === ""){
    window.location.href = "index.html";
}


