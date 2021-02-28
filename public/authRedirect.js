/*
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
 */
auth.onAuthStateChanged((user) => {
    if (user && user.emailVerified) {
        window.location.href = "dashboard"
    }
})
