firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        window.location.href = "dashboard.html"
    } else {

    }
});