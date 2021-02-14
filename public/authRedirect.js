auth.onAuthStateChanged((user) => {
    if (user && user.emailVerified) {
        window.location.href = "dashboard"
    }
})
