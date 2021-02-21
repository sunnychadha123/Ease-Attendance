import requests

def startMeeting(meetingName,meetingID):
    url = "https://www.easeattendance.com/api/requests"

    payload = "{\r\n  \"event\": \"meeting.started\",\r\n  \"event_ts\": 1234566789900,\r\n  \"payload\": {\r\n    \"account_id\": \"o8KK_AAACq6BBEyA70CA\",\r\n    \"object\": {\r\n      \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\r\n      \"id\": \"111111111\",\r\n      \"host_id\": \"hIk5FOWfR-SFE9DgN-2N2w\",\r\n      \"topic\": \"Varun Chitturi's Zoom Meeting\",\r\n      \"type\": 2,\r\n      \"start_time\": \"2019-07-09T17:00:00Z\",\r\n      \"duration\": 60,\r\n      \"timezone\": \"America/Los_Angeles\"\r\n    }\r\n  }\r\n}"
    headers = {
        'authorization': 'YYzbQmUuQ72ZZsbaionu2A',
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(response.text)