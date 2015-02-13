/*
The paramter for the program is lat (input center lat), lon (input center lon),
inputMeters (input edge in meters). The program will measure the greeness of each 10m x 10m
squares within the range, and return a two dimentional array.
*/


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var ColorThief = require('color-thief');
var request = require('request').defaults({ encoding: null });
var async = require('async');

app.get('/', function(req, res){
  res.sendfile('index.html');
  
});

	
io.on('connection', function(socket){
  //reading the file
  var colorThief = new ColorThief();
  var lat = 38.986005, lon = -76.944577;
  var inputMeters = 50;
  var edge = pixelConversion (lat, 17, inputMeters); // 50 meters as in this example
  var count = 0;
  var sEdge = pixelConversion (lat, 17, 10); // each square is 10 meters
  var diff = pixelConversion (lat, 17, 5); // it decreases 5 meters each time
  var result = [];

  //pixel conversion; the unit for groundResolution is meter/pixels
  function pixelConversion (lat, zoomLevel, meters) {
  	var groundResolution = (Math.cos(lat * Math.PI/180) * 2 * Math.PI * 6378137) / (256 * Math.pow(2, zoomLevel));
  	var pix = meters * groundResolution;
  	return pix;
  }

  console.log("edge: " + edge + "; sEdge: " + sEdge + "; diff: " + diff);
  /* brng starts at the vertical direction of the center point as either 0 degree or 360 degree and will rotate
  	 clockwise as degree increases */
  	 
  	var xCorr = edge / 2 - diff, yCorr = edge / 2 - diff;
  	//console.log("xCorr: " + xCorr + "; yCorr: " + yCorr);
  	var dist, brng;
  	while (xCorr > edge / (-2) ) {
  		while (yCorr > edge / (-2) ) {
  			dist = Math.sqrt(xCorr * xCorr + yCorr * yCorr) / 1000;
  			
  			if (xCorr > 0 && yCorr > 0) 
  				brng = Math.atan(xCorr / yCorr);
	  		else if (xCorr > 0 && yCorr < 0) 
  				brng = Math.PI - Math.atan(xCorr / yCorr * (-1));
  			else if (xCorr == 0) {
  				if (yCorr >= 0)
  					brng = 0;
  				else (yCorr < 0)
  					brng = Math.PI;

  			} else if (xCorr < 0 && yCorr < 0)
  				brng = Math.atan(xCorr / yCorr) + Math.PI;

  			else if (yCorr == 0)
  				if (xCorr > 0)
  					brng = Math.PI / 2;
  				else if (xCorr < 0)
  					brng = Math.PI * 1.5;
  				else 
  					brng = 0;
  			else if (xCorr < 0 && yCorr > 0)
  				brng = Math.PI * 2 - Math.atan(xCorr / yCorr * (-1));


	  		if (typeof(Number.prototype.toRadians) === "undefined") {
  				Number.prototype.toRadians = function() {
  					return this * Math.PI / 180;
  				};
  			}

		  	var theta = brng;
    		var delta = Number(dist) / 6371; // angular distance in radians

    		// lat and lon are the center point of the over all picture
		    var phi1 = lat.toRadians();
    		var lambda1 = lon.toRadians();

	    	var phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
    		var lambda2 = lambda1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(phi1), Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));
    		lambda2 = (lambda2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180..+180°

    		var newLat = phi2 * 180/Math.PI;
    		var newLon = lambda2 * 180/Math.PI;
    		count ++;
    		console.log(newLat + " " + newLon);
			
			result.push({ "lat":newLat, "lon":newLon });
			// move down one square
  			yCorr -= sEdge;
		}
		
		// move yCorr to the top and shift xCorr to the left by 10 units
		yCorr = edge / 2 - diff;
		xCorr -= sEdge;

    }
    	
  	var arrayLength = Math.sqrt(count);
  	var greenCal = new Array(arrayLength);

  	for (var i = 0; i < arrayLength; i++)
  		greenCal[i] = new Array(arrayLength);

  	var count1 = 0;
  	var row = 0, col = 0;
 
async.whilst(
    function () { return count1 < count; },
    function (callback) {
        var cur = result[count1++];
        if (row == arrayLength) {
        	row = 0;
        	col ++;
        }
        var url = "https://maps.googleapis.com/maps/api/staticmap?center=" + cur.lat + "," + cur.lon + "&zoom=17&size=" + parseInt(sEdge, 10) + "x" + parseInt(sEdge, 10) + "&key=AIzaSyDF5MKVqpVYwrZxsSMoHmYGvSMVqrqzD2Y";
  			var green;
  			request.get(url, function(err, res, body){
  				//console.log(url);
  				var c = colorThief.getColor(body);
  				if (c[0] >= c[1]) { 
  					green = 0;
  					greenCal[row][arrayLength - 1 - col] = green;
  					//console.log(green);
  				} else { 
  					green = 1;
  					greenCal[row][arrayLength - 1 - col] = green;
  					//console.log(green);
  				}
  				row ++;
  				//console.log("count: " + count1);
  				callback();
  				
  			});
    },

    function (err) {
        if (err) console.log("error occurred");

        console.log("done"); 
        console.log(greenCal);
    }
);

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


