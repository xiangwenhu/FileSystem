var express = require('express')
var app = express()

app.use(express.static(__dirname + '/test'))

app.listen(8888)
