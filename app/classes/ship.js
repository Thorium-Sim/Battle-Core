module.exports = class Ship {
	constructor(ID_) {
		this.ID = ID_;
		this.type = "none"
		const fs = require('fs')

		this.targetedContact = ""
		this.shieldsOnOff = {
			"fore": false,
			"port": false,
			"starboard": false,
			"aft": false
		}
		this.shieldIntegrity = {
			"fore": 1,
			"port": 1,
			"starboard": 1,
			"aft": 1
		}
		this.flightSkill = 1
		this.weaponsSkill = 1
		this.damagedSystems = {}
		this.exists = true

		this.shipInfo = {}
	}


	setType(type_) {
		this.type = type_;
		fs.readSync('../settings/ship-types.json', 'utf8', function(err, data) {
			if (err) throw err;
			try {
				data = JSON.stringify(data)
				this.shipInfo = JSON.parse(JSON.stringify(data[type_]))
				for (let side in data[type_].systemsList) {
					for (let system in data[type_].systemsList[side]) {
						this.damagedSystems[system] = 0;
					}
				}
			} catch (vError) {
				console.log(vError)
				this.shipInfo = {}
				this.damagedSystems = {}
				this.type = "none"
			}
		})
	}
	setTargetedContact(shipId) {
		this.targetedContact = shipId
	}
	raiseShields(type, TF) {
		if (!this.shieldsOnOff[type]) {
			return "invalid shield type"
		}
		if (TF) {
			this.shieldsOnOff[type] = true
		} else {
			this.shieldsOnOff[type] = false
		}
	}
	setShieldIntegrity(type, perc) {
		if (!this.shieldIntegrity[type]) {
			return "invalid shield type"
		}
		if (!isNaN(perc) && perc <= 100 && perc >= 0) {
			this.shieldIntegrity[type] = perc
		}
	}
	setFlightSkill(skillLevel) {
		if (!isNaN(skillLevel) && skillLevel <= 3 && skillLevel >= 0) {
			this.flightSkill = skillLevel
		}
	}
	setWeaponsSkill(skillLevel) {
		if (!isNaN(skillLevel) && skillLevel <= 3 && skillLevel >= 0) {
			this.weaponsSkill = skillLevel
		}
	}
	setDamageOfSystem(systemName, damageLevel) {
		if (systemName && this.damagedSystems[systemName] && !isNaN(damageLevel) && damageLevel <= 3 && damageLevel >= 0) {
			this.damagedSystems[systemName] = damageLevel
		}
	}
	setExists(TF) {
		this.exists = TF
	}


	getID() { return this.ID; }
	getTargetedContact() { return this.targetedContact; }
	getIsUserShip() { return this.shipInfo[isUserShip] }
	getShieldResiliency() { return this.shipInfo[shieldResiliency] }
	getTargetingRange() { return this.shipInfo[targetingRange] }
	getFlightSkill() { return this.shipInfo[this.flightSkill] }
	getThrusterEffectivenessAdjustment() { return this.shipInfo[thrusterEffectivenessAdjustment] }
	getWeaponsSkill() { return this.shipInfo[this.weaponsSkill] }
	getSystemsList() { return this.shipInfo[systemsList] }
	getSystemsDamage() { return this.damagedSystems }
	getWeaponsList() { return this.shipInfo[weaponsList] }
	getExists() { return this.exists }

}

//const ship = new Ship();
// module.exports = Ship;