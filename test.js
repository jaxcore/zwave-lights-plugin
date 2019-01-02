var Spin = require('jaxcore-spin');

var zwavelights = require('./service');

zwavelights.on('connect', function(zwave) {
	console.log('zwave connected', zwave);
	
	Spin.connectAll(function(spin) {
	// Spin.connectTo('3C71BF0DC804', function(spin) {
		// adapter.emit('spin-connected', spin);
		console.log('spin connected', spin);
		
		zwave.lights.on('dim', function(level, percent) {
			console.log('dim', level, percent);
			spin.scale(percent);
		});
		
		spin.on('spin', function (direction, position) {
			console.log('spin zwave', direction);
			if (spin.buffer(direction, 2, 1)) {
				if (direction === 1) {
					zwave.lights.changeDim(5);
				}
				else {
					zwave.lights.changeDim(-5);
				}
			}
		});
		
		spin.on('button', function (pushed) {
			console.log('button', pushed);
			zwave.lights.togglePower();
		});
		
		spin.on('button-hold', function () {
			console.log('button-hold');
		});
		
		spin.on('knob', function (pushed) {
			console.log('knob', pushed);
		});
		
		
	});
});

zwavelights.connect({
	device: '/dev/cu.usbmodem14641420'
});

