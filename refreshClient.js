/*
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
 */
require('dotenv').config()
const refreshAdmin = require('firebase-admin')
refreshAdmin.initializeApp({
    credential: refreshAdmin.credential.cert({
            "type": "service_account",
            "project_id": "easeattendance-c68ed",
            "private_key_id": process.env.firebase_admin_key_id,
            "private_key": process.env.firebase_admin_key,
            "client_email": "easeattendance-c68ed@appspot.gserviceaccount.com",
            "client_id": process.env.firebase_admin_client_id,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/easeattendance-c68ed%40appspot.gserviceaccount.com"
        }
    )
})
const refreshdb = refreshAdmin.firestore();

// Make client refresh browser on push
refreshdb.collection("UpdateBrowser").doc("updateDate").set({
    date: new Date()
}).then().catch(()=>{
    console.error("error setting updateDate doc to update client end")
})
