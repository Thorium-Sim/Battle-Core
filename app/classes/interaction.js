let weapon = new(require('./weapon'))
let custMath = require('../../helpers/mathFunctions')

module.exports = class Interaction {
	constructor(id_, originationShip_, destinationShip_, weaponType_) {
		this.lastThrusterUpdate = {
			"x": 0,
			"y": 0,
			"z": 0,
			"lastTimeStamp": 0,
			"lastx": 0,
			"lasty": 0,
			"lastz": 0
		}
		this.id = id_
		this.originationShip = originationShip_
		this.destinationShip = destinationShip_
		this.weaponType = weaponType_
		this.isCancelled = false;
		const { App } = require("../index");
		App.emit("newInteraction", this);
		setTimeout(() => {
			const { App } = require("../index");
			this.addThrusterAdjustment({
				"x": 0,
				"y": 0,
				"z": 0
			})
			App.emit("interactionResult", calculateImpact(this));
		}, this.calculateTimeToImpact())
	}
	addThrusterAdjustment(thrusterValues) {
		var currentMillisec = (new Date()).getTime();
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
		let distance = custMath.distance((this.originationShip.getPosition()).x, (this.originationShip.getPosition()).y, (this.destinationShip.getPosition()).x, (this.destinationShip.getPosition()).y)
		distance = distance * 3
		let time = weapon.getSecondsToImpactAtMaxDistance(this.weaponType)
		//Take into account the already passed time??????????  Maybe laters.
		//take into account the actual current position of the contact???  Maybe Laters....
		return distance * time * 1000
	}
}


function calculateImpact(interaction) {
	if (!interaction.isCancelled) {
		var impactData = {
			"interactionId": interaction.id,
			"shipId": interaction.destinationShip.getID(),
			"systemsHit": [],
			"shieldsHit": []
		}

		//Cacluate the angle of attack of the weapon (trajectory) (angle between originating ship location and destination ship orientation)
		let angle = custMath.find_angle({
				"x": (interaction.originationShip.getPosition()).x,
				"y": -1
			},
			interaction.originationShip.getPosition(),
			interaction.destinationShip.getPosition())

		angle = custMath.radianToDegree(angle)
		if ((interaction.destinationShip.getPosition()).x < 0) {
			angle = 360 - angle;
		}

		//Thruster raw effectiveness (or orthoganol time) is calculated by taking the yThrust*cos(angle) + xThrust*sin(angle) + zThrust*.5 //Opposite on purpose (for a user ship)
		//For the non-user ships, it's just about 50% of the max weapon time
		let thrusterOrthogonality = 0
		if (interaction.destinationShip.getIsUserShip()) {
			thrusterOrthogonality = Math.abs(interaction.lastThrusterUpdate.y * Math.cos(angle)) +
				Math.abs(interaction.lastThrusterUpdate.x * Math.sin(angle)) +
				Math.abs(interaction.lastThrusterUpdate.z * .5) //Opposite on purpose
		} else {
			// console.log(interaction.destinationShip.getFlightSkill(), weapon.getSecondsToImpactAtMaxDistance(interaction.weaponType), .5)
			thrusterOrthogonality = interaction.destinationShip.getFlightSkill() * weapon.getSecondsToImpactAtMaxDistance(interaction.weaponType) * .5
		}

		//Thruster effectiveness is then multiplied by the destination ship's thrusterEffectivenessAdjustment (Speed of their thrusters)
		let thrusterEffectiveness = thrusterOrthogonality * interaction.destinationShip.getThrusterEffectivenessAdjustment()

		//Thruster effectiveness is then multiplied by the weapon's thrusterHitChanceReductionRate
		//that resulting number is subtracted from 1.  That is the %Chance of a successful hit
		let chanceForSuccessfulHit = 1 - (thrusterEffectiveness * weapon.getThrusterHitChanceReductionRate(interaction.weaponType))

		//If a successful hit, based on the angle +/- 45 degrees, determine the potential impact side(s)
		let isHit = (Math.random() < chanceForSuccessfulHit)

		//Determine the targeted system.  If it's any system on the impact sides, it automatically gets hit in that area
		//If general, or if targeted system does not exist, then roll random to determine impact side, and roll random to determine hit system

		// console.log(thrusterOrthogonality, thrusterEffectiveness, chanceForSuccessfulHit, isHit)

		if (isHit) {
			/*
			315 to 45= fore
			45 to 135 = starboard
			135 to 225= aft
			225 to 315 = port
			*/
			//This stuff commented out below is for having a "spread" of potential impact areas.  I'm going to hopefully program that in laters.
			// let potentialImpactAreaUpper = (angle + 45)
			// if (potentialImpactAreaUpper >= 360) { potentialImpactAreaUpper -= 360 }
			// let potentialImpactAreaLower = (angle - 45)
			// if (potentialImpactAreaLower >= 360) { potentialImpactAreaLower += 360 }
			let shipSide = ""
			if (angle > 315 || angle <= 45) { shipSide = "fore" }
			if (angle > 45 && angle <= 135) { shipSide = "starboard" }
			if (angle > 135 && angle <= 225) { shipSide = "aft" }
			if (angle > 225 && angle <= 315) { shipSide = "port" }
			let systemListLength = interaction.destinationShip.getSystemsList()[shipSide].length - 1
			if (systemListLength == -1) { systemListLength = 0 }
			let randomSystemNum = Math.round(Math.random() * systemListLength)
			//If hit system is already super damaged, find systems right next to it, and take them down by 1

			//Determin Weapon Damage Level
			let weaponDamageLevel = weapon.getDamageValue(interaction.weaponType)

			//if shields are up, then hit shields
			if (interaction.destinationShip.getShieldsUp(shipSide)) {
				impactData.shieldsHit.push({ "shield": shipSide, "damage": 1 })
				weaponDamageLevel -= 1
			}

			if (weaponDamageLevel > 0) {
				impactData.systemsHit.push({ "system": interaction.destinationShip.getSystemsList()[shipSide][randomSystemNum], "damage": weaponDamageLevel })
			}
			return impactData
		} else {
			return {"result":"no impact"}
		}
	} else {
		return {}
	}
}