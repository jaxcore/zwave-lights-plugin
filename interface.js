module.exports = function (log) {
	return {
		states: {
			id: {
				type: 'string',
				defaultValue: ''
			},
			power: {
				type: 'boolean',
				defaultValue: false
			},
			dimLevel: {
				type: 'integer',
				defaultValue: 0
			}
		},
		devices: {
			lights: {
				events: {
					// input: ['integer'],
				},
				actions: {
					lightsOn: function() {
						this.power(true);
					},
					lightsOff: function () {
						this.power(false);
					},
					togglePower: function() {
						//this.dim(99);
					},
					dimUp: function() {
						this.lights.dim(this.state.dimLevel + 5);
					},
					dimDown: function() {
						this.lights.dim(this.state.dimLevel - 5);
					}
				},
				settings: {
					power: function(power) {
						this.dim(power? 99 : 0);
					},
					dim: function(level) {
						if (level < 0) level = 0;
						if (level > 99) level = 99;
						
						
						this.setState({
							dimLevel: level
						});
						
						var percent = level / 99;
						this.lights.emit('dim', level, percent);
						
						log('level', level);
						
						// this.zwave.setValue(2,38,1,0,this.state.dimLevel);
						
						this.zwave.setValue(2,38,1,0,this.state.dimLevel);
					},
					changeDim: function(d) {
						this.lights.dim(this.state.dimLevel + d);
					}
				}
			}
		},
		
		parsers: {}
		
	}
};