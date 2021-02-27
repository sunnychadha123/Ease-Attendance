import requests
from time import sleep
import names


def startMeeting(meetingName, meetingID, hostID):
    url = "https://www.easeattendance.com/api/requests"
    url = "http://localhost:4000/api/requests"

    payload = "{\r\n  \"event\": \"meeting.started\",\r\n  \"event_ts\": 1234566789900,\r\n  \"payload\": {\r\n    \"account_id\": \"o8KK_AAACq6BBEyA70CA\",\r\n    \"object\": {\r\n      \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\r\n      \"id\": \"" + meetingID + "\",\r\n      \"host_id\": \"" + hostID + "\",\r\n      \"topic\": \"" + meetingName + "\",\r\n      \"type\": 2,\r\n      \"start_time\": \"2019-07-09T17:00:00Z\",\r\n      \"duration\": 60,\r\n      \"timezone\": \"America/Los_Angeles\"\r\n    }\r\n  }\r\n}"
    headers = {
        'authorization': 'YYzbQmUuQ72ZZsbaionu2A',
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(response)


def endMeeting(meetingName, meetingID, hostID):
    url = "https://www.easeattendance.com/api/requests"
    url = "http://localhost:4000/api/requests"
    payload = "{\n  \"event\": \"meeting.ended\",\n  \"event_ts\": 1234566789900,\n  \"payload\": {\n    \"account_id\": \"o8KK_AAACq6BBEyA70CA\",\n    \"object\": {\n      \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\n      \"id\": \"" + meetingID + "\",\n      \"host_id\": \"" + hostID + "\",\n      \"topic\": \"" + meetingName + "\",\n      \"type\": 2,\n      \"start_time\": \"2019-07-09T17:00:00Z\",\n      \"duration\": 60,\n      \"timezone\": \"America/Los_Angeles\"\n    }\n  }\n}"
    headers = {
        'authorization': 'YYzbQmUuQ72ZZsbaionu2A',
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(response)


def addParticipant(participantName, meetingName, meetingID, hostID, email):
    url = "https://www.easeattendance.com/api/requests"
    url = "http://localhost:4000/api/requests"
    payload = "{\n  \"event\": \"meeting.participant_joined\",\n  \"event_ts\": \"long\",\n  \"payload\": {\n    \"account_id\": \"string\",\n    \"object\": {\n      \"id\": \"" + meetingID + "\",\n      \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\n      \"host_id\": \"" + hostID + "\",\n      \"topic\": \"" + meetingName + "\",\n      \"type\": \"2\",\n      \"start_time\": \"string [date-time]\",\n      \"timezone\": \"string\",\n      \"duration\": \"integer\",\n      \"participant\": {\n        \"user_id\": \"11111111\",\n        \"user_name\": \"" + participantName + "\",\n        \"email\": \""+email+"\",\n        \"id\": \"string\",\n        \"join_time\": \"string [date-time]\"\n      }\n    }\n  }\n}"
    headers = {
        'authorization': 'YYzbQmUuQ72ZZsbaionu2A',
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(response)


def removeParticipant(participantName, meetingName, meetingID, hostID,email):
    url = "https://www.easeattendance.com/api/requests"
    url = "http://localhost:4000/api/requests"
    payload = "{\n    \"event\": \"meeting.participant_left\",\n    \"event_ts\": \"long\",\n    \"payload\": {\n        \"account_id\": \"string\",\n        \"object\": {\n            \"id\": \"" + meetingID + "\",\n            \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\n            \"host_id\": \"" + hostID + "\",\n            \"topic\": \"" + meetingName + "\",\n            \"type\": \"2\",\n            \"start_time\": \"string [date-time]\",\n            \"timezone\": \"string\",\n            \"duration\": \"integer\",\n            \"participant\": {\n                \"user_id\": \"11111111\",\n                \"user_name\": \"" + participantName + "\",\n                \"email\": \""+email+"\",\n                \"id\": \"string\",\n                \"join_time\": \"string [date-time]\"\n            }\n        }\n    }\n}"
    headers = {
        'authorization': 'YYzbQmUuQ72ZZsbaionu2A',
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(response)


VarunHostID = "hIk5FOWfR-SFE9DgN-2N2w"
AdityaHostID = "TbQ_nGjpR9aMPQnS-IkQPQ"
meetingID = "12345612390"
meetingName = "a new meetinga sdf"

startMeeting(meetingName, meetingID, AdityaHostID)

input("next")

for x in range(100):
    addParticipant(names.get_first_name() + " " + names.get_last_name(), meetingName, meetingID, AdityaHostID,"generic Email")
    sleep(0.00)

input("next")

endMeeting(meetingName, meetingID, AdityaHostID)
