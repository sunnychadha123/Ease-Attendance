/*
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
 */
function checkVerificationStatus(){
    setInterval(() => {
        auth.currentUser.reload().then(load => {
            if(auth.currentUser.emailVerified){
                window.location.href = "dashboard"
            }
        })
    },1000)
}
checkVerificationStatus()
