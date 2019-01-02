var EventEmitter = require('events');
// var net = require("net");
var plugin = require('jaxcore-plugin');
var log = plugin.createLogger('ZWave Service');
var ZWaveClient = require('./client');

function ZWaveService() {
	this.constructor();
	this.clients = {};
}

ZWaveService.prototype = new EventEmitter();
ZWaveService.prototype.constructor = EventEmitter;

ZWaveService.prototype.connect = function(config) {
	var id = config.device;
	
	this.clients[id] = new ZWaveClient(config);
	
	var me = this;
	this.clients[id].on('connect', function () {
		log('connected '+id);
		me.emit('connect', me.clients[id]);
	});
	this.clients[id].once('disconnect', function () {
		me.emit('disconnect', me.clients[id]);
	});
	
	this.clients[id].connect();
	
};

// process.on('SIGINT', function () {
// 	console.log('disconnecting...');
// 	zwave.disconnect(zwaveDevice);
// 	// process.exit();
// });

module.exports = new ZWaveService();