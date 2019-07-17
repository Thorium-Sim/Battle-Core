let weapon = new(require('./weapon'))

module.exports = class Interaction {
	constructor(id_, originationShip_, destinationShip_, weaponType_) {
		console.log(weaponType_)
		this.lastThrusterUpdate = {
			"x": 0,
			"y": 0,
			"z": 0,
			"lastTimeStamp": 0,
			"lastx": 0,
			"lasty": 0,
			"lastz": 0
		}
		this.thrusterVector = {
			"angle": 3.14159265,
			"magnitude": 0.62458
		};
		this.id = id_
		this.originationShip = originationShip_
		this.destinationShip = destinationShip_
		this.weaponType = weaponType_
		this.isCancelled = false;
		const { App } = require("../index");
		App.emit("newInteraction", this);
		setTimeout(() => {
			const { App } = require("../index");
			App.emit("interactionResult", calculateImpactChance(this));
		}, this.calculateTimeToImpact())
	}
	addThrusterAdjustment(thrusterValues) {
		let currentMillisec = 100 //(new Date).getMilliseconds()
		if (this.lastThrusterUpdate.lastTimeStamp) {
			let timeInThrust = currentMillisec - this.lastThrusterUpdate.lastTimeStamp
			let newx = this.lastThrusterUpdate.lastx * timeInThrust / 1000 + this.lastThrusterUpdate.x
			let newy = this.lastThrusterUpdate.lasty * timeInThrust / 1000 + this.lastThrusterUpdate.y
			let newz = this.lastThrusterUpdate.lastz * timeInThrust / 1000 + this.lastThrusterUpdate.z
			this.lastThrusterUpdate.x = newx
			this.lastThrusterUpdate.y = newy
			this.lastThrusterUpdate.z = newz
			this.lastThrusterUpdate.lastTimeStamp = currentMillisec
			this.lastThrusterUpdate.lastx = thrusterValues.x
			this.lastThrusterUpdate.lasty = thrusterValues.y
			this.lastThrusterUpdate.lastz = thrusterValues.z
		} else {
			this.lastThrusterUpdate.lastTimeStamp = currentMillisec
			this.lastThrusterUpdate.lastx = thrusterValues.x
			this.lastThrusterUpdate.lasty = thrusterValues.y
			this.lastThrusterUpdate.lastz = thrusterValues.z
		}
	}
	updateDestinationShip(destinationShip_) {
		this.destinationShip = destinationShip_
	}
	cancelInteraction() {
		this.isCancelled = true;
	}
	getId() {
		return this.id
	}
	getWeaponType() {
		return this.weaponType
	}
	getDestinationShip() {
		return this.destinationShip
	}

	calculateTimeToImpact() {
		//Determine Distance between both ships
		//Determine weapon type (and consequently, speed)
		//Multiply distance by weapon type speed
		//return that value
		//Take into account the already passed time??????????  Maybe laters.
		if (this.weaponType == "phaser") {
			return 1500;
		} else {
			return 5000;
		}
	}
}


function calculateImpactChance(interaction) {
	if (!interaction.isCancelled) {
		var impactData = {
			"interactionId": interaction.id,
			"shipId": interaction.destinationShip.getID(),
			"systemsHit": [
				{ "system": "Hull A1", "damage": 1 },
				{ "system": "Hull A2", "damage": 1 }
			],
			"shieldsHit": [
				{ "shield": "aft", "damage": 1 },
			]
		}
		//Cacluate the angle of attack of the weapon (trajectory) (angle between originating ship location and destination ship orientation)
		//Thruster raw effectiveness (or orthoganol time) is calculated by taking the yThrust*cos(angle) + xThrust*sin(angle) + zThrust*.5 //Opposite on purpose
		//Thruster effectiveness is then multiplied by the destination ship's thrusterEffectivenessAdjustment (Speed of their thrusters)
		//Thruster effectiveness is then multiplied by the weapon's thrusterHitChanceReductionRate
		//that resulting number is subtracted from 1.  That is the %Chance of a successful hit
		//If a successful hit, based on the angle +/- 45 degrees, determine the potential impact side(s)
		//Determine the targeted system.  If it's any system on the impact sides, it automatically gets hit in that area
		//If general, or if targeted system does not exist, then roll random to determine impact side, and roll random to determine hit system
		//If hit system is already super damaged, find systems right next to it, and take them down by 1
		//if shields are up, then hit shields


		//console.log(impactData)
		return impactData
	} else {
		return {}
	}
}