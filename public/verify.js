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
