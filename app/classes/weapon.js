
module.exports = class Weapon {
	constructor() {
		this.weaponInfo = {}
		const fs = require('fs')
		let data = JSON.parse(fs.readFileSync('./app/settings/weapon-types.json', 'utf8'))
		this.weaponInfo = JSON.parse(JSON.stringify(data))
	}
	getTypes() {
		let weaponTypes = [];
		for (let type_ in this.weaponInfo) {
			weaponTypes.push(type_);
		}
		return weaponTypes
	}
	getDamageValue(type_) { return this.weaponInfo[type_]['damageValue']; }
	getSecondsToImpactAtMaxDistance(type_) { return this.weaponInfo[type_]['secondsToImpactAtMaxDistance']; }
	getThrusterHitChanceReductionRate(type_) { return this.weaponInfo[type_]['thrusterHitChanceReductionRate']; }
}