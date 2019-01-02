var plugin = require('jaxcore-plugin');
var log = plugin.createLogger('ZWave Client');
var Client = plugin.Client;

var ZWave = require('openzwave-shared');
// http://www.gocontrol.com/manuals/LB60Z-1-Install.pdf
// var os = require('os');

var zwave = new ZWave({
	ConsoleOutput: false
});

global.zwave = zwave;

var zwaveStore = plugin.createStore('ZWave Store');
var zwaveInterface = require('./interface')(log);

function ZWaveClient(config) {
	this.zwave = zwave;
	
	// var host = config.host;
	// var port = (config.port || 14999);
	// config.id = host + ':' + port;
	
	config.id = config.device;
	
	this.setStore(zwaveStore);
	this.bindInterface(zwaveInterface, config);
	//this.constructor(zwaveStore, zwaveInterface, config);
	
	this.id = this.state.id;
	
	var me = this;
	
	var nodes = [];
	
	var homeid = '';
	
	zwave.on('driver ready', function (home_id) {
		homeid = home_id;
		console.log('scanning homeid=0x%s...', homeid.toString(16));
	});
	
	zwave.on('driver failed', function () {
		console.log('failed to start driver');
		zwave.disconnect(zwaveDevice);
		process.exit();
	});
	
	zwave.on('node added', function (nodeid) {
		nodes[nodeid] = {
			manufacturer: '',
			manufacturerid: '',
			product: '',
			producttype: '',
			productid: '',
			type: '',
			name: '',
			loc: '',
			classes: {},
			ready: false,
		};
	});
	
	zwave.on('node event', function (nodeid, data) {
		console.log('node%d event: Basic set %d', nodeid, data);
	});
	
	zwave.on('value added', function (nodeid, comclass, value) {
		if (!nodes[nodeid]['classes'][comclass])
			nodes[nodeid]['classes'][comclass] = {};
		nodes[nodeid]['classes'][comclass][value.index] = value;
	});
	
	zwave.on('value changed', function (nodeid, comclass, value) {
		if (nodes[nodeid]['ready']) {
			console.log('node%d: changed: %d:%s:%s->%s', nodeid, comclass,
				value['label'],
				nodes[nodeid]['classes'][comclass][value.index]['value'],
				value['value']);
		}
		nodes[nodeid]['classes'][comclass][value.index] = value;
	});
	
	zwave.on('value removed', function (nodeid, comclass, index) {
		if (nodes[nodeid]['classes'][comclass] &&
			nodes[nodeid]['classes'][comclass][index])
			delete nodes[nodeid]['classes'][comclass][index];
	});
	
	zwave.on('node ready', function (nodeid, nodeinfo) {
		
		console.log('node ready');
		
		nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
		nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
		nodes[nodeid]['product'] = nodeinfo.product;
		nodes[nodeid]['producttype'] = nodeinfo.producttype;
		nodes[nodeid]['productid'] = nodeinfo.productid;
		nodes[nodeid]['type'] = nodeinfo.type;
		nodes[nodeid]['name'] = nodeinfo.name;
		nodes[nodeid]['loc'] = nodeinfo.loc;
		nodes[nodeid]['ready'] = true;
		console.log('node%d: %s, %s', nodeid,
			nodeinfo.manufacturer ? nodeinfo.manufacturer : 'id=' + nodeinfo.manufacturerid,
			nodeinfo.product ? nodeinfo.product : 'product=' + nodeinfo.productid +
				', type=' + nodeinfo.producttype);
		console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
			nodeinfo.name,
			nodeinfo.type,
			nodeinfo.loc);
		for (var comclass in nodes[nodeid]['classes']) {
			switch (comclass) {
				case 0x25: // COMMAND_CLASS_SWITCH_BINARY
				case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
					zwave.enablePoll(nodeid, comclass);
					break;
			}
			var values = nodes[nodeid]['classes'][comclass];
			console.log('node%d: class %d', nodeid, comclass);
			for (idx in values)
				console.log('node%d:   %s=%s', nodeid, values[idx]['label'], values[
					idx]['value']);
		}
	});
	
	zwave.on('notification', function (nodeid, notif) {
		switch (notif) {
			case 0:
				console.log('node%d: message complete', nodeid);
				break;
			case 1:
				console.log('node%d: timeout', nodeid);
				break;
			case 2:
				console.log('node%d: nop', nodeid);
				break;
			case 3:
				console.log('node%d: node awake', nodeid);
				break;
			case 4:
				console.log('node%d: node sleep', nodeid);
				break;
			case 5:
				console.log('node%d: node dead', nodeid);
				break;
			case 6:
				console.log('node%d: node alive', nodeid);
				break;
		}
	});
	
	zwave.on('scan complete', function () {
		console.log('====> scan complete');
		// set dimmer node 5 to 50%
		//    zwave.setValue(5,38,1,0,50);
		//zwave.setValue({node_id:5,	class_id: 38,	instance:1,	index:0}, 50 );
		zwave.requestAllConfigParams(3);
		
		var foundLights = false;
		
		for (var nodeid in nodes) {
			console.log('DEVICE:' + nodeid);
			
			for (var i in nodes[nodeid]) {
				console.log('DEVICE: x ' + nodeid + ' ' + i + ': ' + nodes[nodeid][i]);
				
				foundLights = true;
				if (i === 'classes') {
					for (var c in nodes[nodeid][i]) {
						console.log('classes ' + c + ':', nodes[nodeid][i][c]);
					}
				}
			}
			
		}
		
		if (foundLights) {
			me.emit('connect', this);
		}
		
	});
	
	zwave.on('controller command', function (n, rv, st, msg) {
		console.log(
			'controller commmand feedback: %s node==%d, retval=%d, state=%d', msg,
			n, rv, st);
	});
	
	log("connecting to " + config.device);
	
	log('created client', config);
}

ZWaveClient.prototype = new Client();
ZWaveClient.prototype.constructor = Client;

ZWaveClient.prototype.connect = function() {
	zwave.connect(this.state.id);
};

module.exports = ZWaveClient;