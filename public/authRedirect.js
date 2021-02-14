auth.onAuthStateChanged((user) => {
    console.log(user)
    if (user && user.emailVerified) {
        window.location.href = "dashboard"
    }
})
