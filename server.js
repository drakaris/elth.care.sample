/*******************
* Elth.care Server *
*******************/

/*********************
* Essential Includes *
*********************/
var express = require('express');
var morgan = require('morgan');
var request = require('request');
var async = require('async');
var app = express();

/***********************
* Server configuration *
***********************/
var api_key = '';
var port = 3000;
app.use(morgan('dev'));
//app.use(bodyParser.urlencoded({ extended : false}));
//app.use(bodyParser.json());

/**********************
* Reference Variables *
**********************/
var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/***********************
* Supporting Functions *
***********************/
var makeSlots = function (obj, callback) {
  var timeSlice = 300;
  var day = obj.close.day == obj.open.day ? obj.close.day : callback('Unchecked duration');
  var slots = [];
  // Start spliting duration with time slice and append to slots.
  var timeMarker = Number(obj.open.time);
  async.whilst(function() { return timeMarker < Number(obj.close.time); }, function(callback) {
    var tmp = {};
    // Add zero padding if needed
    tmp['Start Time'] = timeMarker.toString().length < 4 ? "0" + timeMarker.toString() : timeMarker.toString();
    timeMarker += timeSlice;
    if(timeMarker <= Number(obj.close.time)) {
      // Add zero padding if needed
      tmp['End Time'] = timeMarker.toString().length < 4 ? "0" + timeMarker.toString() : timeMarker.toString();
    } else {
      tmp['End Time'] = obj.close.time;
    }
    getDisplayString(tmp['Start Time'],tmp['End Time'], function(displayString) {
      tmp['Display String'] = displayString;
      slots.push(tmp);
      delete(tmp);
      callback(null, timeMarker);
    });
  }, function(err, n) {
    if(err) {
      console.log(err);
    } else {
      result = {
        'Day' : days[day - 1],
        'Slots' : slots
      };
      callback(null, result);
    }
  });
}

function getDisplayString(start,end,callback) {
  // Format start string
  if(Number(start) < 1200 ) {
    start = start.slice(0,2) + ':' + start.slice(2) + 'AM';
  } else if(Number(start.slice(0,2)) > 12) {
     start = "0" + (Number(start.slice(0,2)) - 12).toString() + ':' + start.slice(2) + 'PM';
  } else {
    start = start.slice(0,2) + ':' + start.slice(2) + 'PM';
  }
  // Format end string
  if(Number(end) < 1200) {
    end = end.slice(0,2) + ':' + end.slice(2) + 'AM';
  } else if(Number(end.slice(0,2)) > 12) {
     end = "0" + (Number(end.slice(0,2)) - 12).toString() + ':' + end.slice(2) + 'PM';
  } else {
    end = end.slice(0,2) + ':' + end.slice(2) + 'PM';
  }
  // Return concatinated display string
  callback (start + ' - ' + end);
}

app.get('/', function(req,res) {
  res.send('Hello World!');
});

app.get('/getSlots', function(req,res) {
  var url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + req.query.id + '&key=AIzaSyCR0Im17axVc4hgO-T4pr3lgM1vHeGcNxw';
  request(url, function(error, response, body) {
    var data = JSON.parse(body);
    async.map(data.result.opening_hours.periods, makeSlots, function(err, results) {
      if(err) {
        console.log(err);
        res.send(err);
      }
      res.send(results);
    });
  })
});

/***************
* Start Server *
***************/
app.listen(port, function() {
  console.log('Listening on port : ' + port);
});
