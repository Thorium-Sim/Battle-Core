const { App } = require("../index");


var id = ""
var originationShip = {}
var destinationShip = {}
var weaponType = {}

var lastThrusterUpdate = {
	"totalAngle":0,
	"totalMagnitude":0,
	"lastAngle":0,
	"lastMagnitude":0,
	"lastTimeStamp":0
}

var lastThrusterUpdateUpDown = {
	"totalAngle":0,
	"totalMagnitude":0,
	"lastAngle":0,
	"lastMagnitude":0,
	"lastTimeStamp":0
}

var thrusterVector = {
	"angle": 3.14159265 "magnitude": 0.62458
};

var isCancelled = false;


class Interaction {
	constructor(originationShip_, destinationShip_, weaponType_) {
		id = "new UUID" //Create an ID (use a GUID)
		originationShip = JSON.parse(JSON.stringify(originationShip_))
		destinationShip = JSON.parse(JSON.stringify(destinationShip_))
		weaponType = JSON.parse(JSON.stringify(weaponType_))
		setTimeout(calculateImpact(), calculateTimeToImpact())
	}
	addThrusterAdjustment(thrusterValues) {
		let currentMillisec = 100 //(new Date).getMilliseconds()
		if (lastThrusterUpdate.lastTimeStamp) {
			let timeInThrust = currentMillisec - lastThrusterUpdate.lastTimeStamp
			let newVector = vectorAdd(lastThrusterUpdate.totalAngle,lastThrusterUpdate.totalMagnitude,lastThrusterUpdate.lastAngle,(lastThrusterUpdate.lastMagnitude*timeInThrust/1000))
			lastThrusterUpdate.totalAngle = newVector.theta
			lastThrusterUpdate.totalMagnitude = newVector.radius
			lastThrusterUpdate.lastAngle = thrusterValues.angle
			lastThrusterUpdate.lastMagnitude = thrusterValues.magnitude
			lastThrusterUpdate.lastTimeStamp = currentMillisec
		} else {
			lastThrusterUpdate.lastAngle = thrusterValues.angle
			lastThrusterUpdate.lastMagnitude = thrusterValues.magnitude
			lastThrusterUpdate.lastTimeStamp = currentMillisec
		}
	}
	addThrusterAdjustmentUpDown(thrusterValues) {
		let currentMillisec = 100 //(new Date).getMilliseconds()
		if (lastThrusterUpdateUpDown.lastTimeStamp) {
			let timeInThrust = currentMillisec - lastThrusterUpdateUpDown.lastTimeStamp
			let newVector = vectorAdd(lastThrusterUpdateUpDown.totalAngle,lastThrusterUpdateUpDown.totalMagnitude,lastThrusterUpdateUpDown.lastAngle,(lastThrusterUpdateUpDown.lastMagnitude*timeInThrust/1000))
			lastThrusterUpdateUpDown.totalAngle = newVector.theta
			lastThrusterUpdateUpDown.totalMagnitude = newVector.radius
			lastThrusterUpdateUpDown.lastAngle = thrusterValues.angle
			lastThrusterUpdateUpDown.lastMagnitude = thrusterValues.magnitude
			lastThrusterUpdateUpDown.lastTimeStamp = currentMillisec
		} else {
			lastThrusterUpdateUpDown.lastAngle = thrusterValues.angle
			lastThrusterUpdateUpDown.lastMagnitude = thrusterValues.magnitude
			lastThrusterUpdateUpDown.lastTimeStamp = currentMillisec
		}
	}
	updateDestinationShip(destinationShip_) {
		destinationShip = destinationShip_
	}
	cancelInteraction() {
		isCancelled = true;
	}
}

function calculateTimeToImpact() {
	//Determine Distance between both ships
	//Determine weapon type (and consequently, speed)
	//Multiply distance by weapon type speed
	//return that value
	return 5;
}

function calculateImpactChance() {
	if (!isCancelled) {
		var impactData = {
			"didImpact": true,
			"systemHit": "Hull A1"
		}



		App.emit("interactionResult", impactData);
	}
}

const interaction = new Interaction();
module.exports = interaction;




function vectorAdd(theta_1,radius_1,theta_2,radius_2) {
	theta = theta_1+Math.atan2(radius_2*Math.sin(theta_2−theta_1),radius_1+radius_2*Math.cos(theta_2−theta_1))
	radius = Math.sqrt(radius_1^2+radius_2^2+2*radius_1*radius_2*Math.cos(theta_2-theta_1))
	return {
		"theta": theta,
		"radius": radius
	}
}



Determine weapon TRAJECTORY Single number - from a straight line from ship to target - between 0 and 360.(Essentially, what point of the ship the weapon will hit.HIT CHANCE Set ORIENTATION See values above.Set to Fore, Starboard, Aft, port THCRR Set HIT CHANCE Always set to 1 ARC OF FIRE Multiply THCRR by target 's TEA											TEA				
	Start Countdown Watch Thruster Fire IF: Thrusters are fired parallel to trajectory, no change in HIT CHANCE IF: Thrusters are fired to yaw, pitch, or roll, no change to HIT CHANCE IF: Thrusters are fired perpendicular to trajectory, reduce HIT CHANCE by weapon 's THCRR														
	IF: Thrusters are fired up / down reduce HIT CHANCE by 1 / 2 weapon 's THCRR														
	AT: ATTI = 0, determine
	if weapon hits(roll against HIT CHANCE at time of impact) If the hit is successful, determine ARC OF FIRE ORIENTATION + /- 45 degrees												
	Randomly determine a value within the ARC OF FIRE Determine which sector(Fore, Starboard, Aft, Port) the determined value falls in
	IF: shields are raised in that section, reduce DAMAGE VALUE(DV) by 1)
THEN: HIT SHIELDS ON TARGET
for between 5 and 15 percent, determined randomly.OR: display "Shields hit"
if it 's the crew'
s ship getting hit.
Roll on Hit Table specific to the target 's Sector Impact															
Assign modified weapon damage(after accounting
	for shields) to the location on the hit table.