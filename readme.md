db.oauthclients.insert({name:'ldrp',client_id:'friend',client_secret:'123',grants:['password','refresh_token'],refreshTokenLifetime:8400000, accessTokenLifetime:8400000})

POST /oauth/token HTTP/1.1
Host: localhost:3000
Authorization: Basic ZnJpZW5kOjEyMw==
Content-Type: application/x-www-form-urlencoded

username=ilesh21190%40gmail.com&password=12345&grant_type=password

response :

{
"token": {
"user": {
"\_id": "5d7d4d91a606e535e4c29b4b",
"name": "Ilesh",
"password": "$2b$10\$CQLu7cZ3j.Xnx9Y8Ee5Y2.fRXVI46OfUSd0t7TO/r5cseSrq8Qgo2",
"email": "ilesh21190@gmail.com",
"type": "student",
"\_\_v": 0
},
"accessToken": "423ed8264a270d7b8f81cffb7b88f288b502445c",
"accessTokenExpiresAt": "2019-12-21T02:40:55.983Z",
"refreshToken": "95abd68d7daf093185e43916e297b675dd42344f",
"refreshTokenExpiresAt": "2019-12-21T02:40:55.984Z"
},
"status": "success"
}

POST /user/get-all-user HTTP/1.1
Authorization: Bearer 423ed8264a270d7b8f81cffb7b88f288b502445c

response :

[
{
"_id": "5d7d4d91a606e535e4c29b4b",
"name": "Ilesh",
"email": "ilesh21190@gmail.com",
"type": "student",
"__v": 0
}
]
