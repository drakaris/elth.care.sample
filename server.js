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
var api_key = 'AIzaSyCR0Im17axVc4hgO-T4pr3lgM1vHeGcNxw';
var port = 9000;
app.use(morgan('dev'));

/**********************
* Reference Variables *
**********************/
var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/***********************
* Supporting Functions *
***********************/
var makeSlots = function (obj, callback) {
  var timeSlice = 300;
  var day = obj.close.day == obj.open.day ? obj.close.day : callback('Unchecked duration');
  var slots = [];
  // Start spliting duration with time slice and append to slots.
  var startTime = Number(obj.open.time);
  var endTime = Number(obj.close.time);
  var timeMarker = startTime;
  // Initial tick calculation
  var nextTick = startTime % timeSlice == 0 ? startTime + timeSlice : startTime + timeSlice - startTime % timeSlice;
  async.whilst(function() { return timeMarker < endTime; }, function(callback) {
    var tmp = {};
    // Add zero padding if needed
    tmp['Start Time'] = timeMarker.toString().length < 4 ? "0" + timeMarker.toString() : timeMarker.toString();
    if(nextTick <= Number(obj.close.time)) {
      // End current slot
      tmp['End Time'] = nextTick.toString().length < 4 ? "0" + nextTick.toString() : nextTick.toString();
      timeMarker += nextTick;
    } else {
      tmp['End Time'] = obj.close.time;
    }
    nextTick += timeSlice;
    timeMarker = tmp['End Time'];
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
        'Day' : days[day],
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
  res.send({
    'Name' : 'Elth.care sample server',
    'Author' : 'Arjhun Srinivas',
    'Version' : '1.0.0'
  });
});

app.get('/getSlots', function(req,res) {
  if(typeof req.query.id === 'undefined' || typeof req.query.id === null || req.query.id == '') {
    res.send({
      'Error' : 'Undefined ID'
    });
    return;
  }
  var url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + req.query.id + '&key=' + api_key;
  request(url, function(error, response, body) {
    var data = JSON.parse(body);
    if(data.status == "INVALID_REQUEST") {
      res.send({
        'status' : data.status
      });
      return;
    }
    async.map(data.result.opening_hours.periods, makeSlots, function(err, results) {
      if(err) {
        console.log(err);
        res.send(err);
      }
      var result = [];
      // Create queue and worker with concurrency 1
      var q = async.queue(function(item, callback) {
        index = days.indexOf(item.Day);
        if(result[index] != null) {
          //console.log(item.Day, 'Not Empty');
          result[index].Slots = result[index].Slots.concat(item.Slots);
          //console.log(result[index].Slots);
          //console.log(item.Slots);
        } else {
          //console.log(item.Day, 'Empty');
          result[index] = item;
          //console.log(result[index].Slots);
        }
        callback();
      });
      // Push results into queue
      q.push(results, function(err) {
        if(err) {
          console.log(err)
          res.send(err);
        }
      });
      q.drain = function() {
        // All tasks completed
        var finalResult = new Array();
        for(i = 0; i < result.length; i++) {
          if(typeof result[i] !== 'undefined' && typeof result[i] !== null) {
            finalResult.push(result[i]);
          }
        }
        res.send(finalResult);
      };
    });
  })
});

/***************
* Start Server *
***************/
app.listen(port, function() {
  console.log('Listening on port : ' + port);
});
