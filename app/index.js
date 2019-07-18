const { EventEmitter } = require("events");
const App = new EventEmitter();
const getClient = require("../helpers/graphqlClient");
const registerClient = require("../helpers/registerClient");
const gql = require("graphql-tag");
const fs = require('fs')
const uuid = require('uuid/v4')

let ship = require('./classes/ship')
let interaction = require('./classes/interaction')
let weapon = new(require('./classes/weapon'))

var currentStation = "";
var currentSimId = "";
var shipList = {
  "user": new ship("user")
}
var eventList = []
var interactionList = {}
var prevTorpedoObj = {}
var prevPhaserObj = {}

shipList["user"].setType("user")
shipList["user"].setName("user")



module.exports = (address, port, clientId) => {
  console.log("Starting app...");

  // Create the client singleton
  getClient(address, port, clientId);

  // Register this app with Thorium as a client
  registerClient();
  console.log("Registered Client");

  // Grab the client object to instantiate it
  const client = require("./thorium-components/client");
  App.on("clientChange", clientObj => {
    if (clientObj.station != null && clientObj.station.name !== currentStation) {
      currentStation = clientObj.station.name;
      const graphQLClient = getClient();
    }
    if (clientObj.simulator != null && clientObj.simulator.id !== currentSimId) {
      currentSimId = clientObj.simulator.id;
      phasers.setup(currentSimId)
      torpedos.setup(currentSimId)
      thrusters.setup(currentSimId)
      shields.setup(currentSimId)
      sensorContacts.setup(currentSimId)
      targeting.setup(currentSimId)
      sensorsInfo.setup(currentSimId)
    } else {
      currentSimId = "";
      phasers.setup("")
      torpedos.setup("")
      thrusters.setup("")
      shields.setup("")
      sensorContacts.setup("")
      targeting.setup("")
      sensorsInfo.setup("")
    }
  });

  /* Subscriptions */
  //Instantiate the phaser object
  const phasers = require("./thorium-components/phasers");
  App.on("phaserChange", phaserObj => {
    // console.log("phaserChange", phaserObj)
    for (let x in phaserObj) {
      if (prevPhaserObj[x]) {
        for (let y in phaserObj[x].beams) {
          if (phaserObj[x].beams[y].state == "idle" && prevPhaserObj[x].beams[y].state == "firing" && phaserObj[x].beams[y].charge < .1 && phaserObj[x].beams[y].heat > .1) {
            let interaction_id = phaserObj[x].beams[y].id
            let weapType = "phaser"
            interactionList[interaction_id] = new interaction(interaction_id, shipList["user"], shipList[shipList["user"].getTargetedContact()], weapType)
          }
        }
      }
    }
    prevPhaserObj = phaserObj
  });

  //Instantiate the torpedo object
  const torpedos = require("./thorium-components/torpedos");
  App.on("torpedoChange", torpedoObj => {
    //console.log("torpedoChange", torpedoObj)
    for (let x in torpedoObj) {
      if (prevTorpedoObj[x]) {
        if (torpedoObj[x].state == "fired" && prevTorpedoObj[x].state == "loaded") {
          let interaction_id = uuid()
          let weapType = prevTorpedoObj[x].typeName
          interactionList[interaction_id] = new interaction(interaction_id, shipList["user"], shipList[shipList["user"].getTargetedContact()], weapType)
        } else if (torpedoObj[x].state == "loaded") {
          for (let y in torpedoObj[x].inventory) {
            if (torpedoObj[x].inventory[y].id == torpedoObj[x].loaded) {
              torpedoObj[x].typeName = torpedoObj[x].inventory[y].type
            }
          }
        }
      }
    }
    prevTorpedoObj = torpedoObj
  });

  //Instantiate the thruster object
  const thrusters = require("./thorium-components/thrusters");
  App.on("thrusterChange", thrusterObj => {
    //console.log("thrusterChange", thrusterObj)
    for (let x in interactionList) {
      if ((interactionList[x].getDestinationShip()).getID() == "user") {
        interactionList[x].addThrusterAdjustment(thrusterObj.direction)
      }
    }
  });

  //Instantiate the sensor object
  const sensorContacts = require("./thorium-components/sensorContacts");
  App.on("sensorContactChange", sensorContactObj => {
    // console.log("sensorContactChange", sensorContactObj)
    for (let x in shipList) {
      shipList[x].setExists(false)
    }
    shipList["user"].setExists(true)
    for (let x = 0; x < sensorContactObj.length; x++) {
      let ship_id = sensorContactObj[x].id
      if (!shipList[ship_id]) {
        shipList[ship_id] = new ship(ship_id)
        //assign types from static file history or just by the default if one is not found
        shipList[ship_id].setType("Medium")
        shipList[ship_id].setName(sensorContactObj[x].name)
        shipList[sensorContactObj[x].id].setPosition(sensorContactObj[x].destination)
      } else {
        //console.log(sensorContactObj[x].id)
        shipList[sensorContactObj[x].id].setExists(true)
      }
      for (let x in shipList) {
        if (!shipList[x].getExists()) {
          delete shipList[x]
        }
      }
      //Go through all the sensor contacts again,
      //and set the possible targets for those ships
    }
  });

  //Instantiate the shield object
  const shields = require("./thorium-components/shields");
  App.on("shieldChange", shieldObj => {
    //console.log("shieldChange", shieldObj)
    for (let x = 0; x < shieldObj.length; x++) {
      shipList["user"].raiseShields(shieldObj[x].name, shieldObj[x].state);
      shipList["user"].setShieldIntegrity(shieldObj[x].name, shieldObj[x].integrity);
      //Maybe at some point in time, make it so shield frequency is
      //more and less effective against different weapons / phaser arcs?
    }
  });

  //Instantiate the targeting object
  const targeting = require("./thorium-components/targeting");
  App.on("targetingChange", targetingObj => {
    // console.log("targetingChange", targetingObj)
    for (let x = 0; x < targetingObj.contacts.length; x++) {
      if (targetingObj.contacts[x].targeted) {
        shipList["user"].setTargetedContact(targetingObj.contacts[x].class)
      }
    }
  });



  const sensorsInfo = require("./thorium-components/sensorsInfo");
  App.on("newInteraction", interactionClass => {
    if (interactionClass.getDestinationShip() == "") { return; }
    if ((interactionClass.getDestinationShip()).getID() == "user") {
      let timeToImpact = Math.round(interactionClass.calculateTimeToImpact() / 100) / 10
      if (timeToImpact > 2) {
        sensorsInfo.send("Incoming " + interactionClass.getWeaponType() + " fire!  Impact in " + timeToImpact + " seconds", true)
      } else {
        sensorsInfo.send(interactionClass.getWeaponType() + " impact detected", true)
      }
    }
  });

  App.on("interactionResult", interactionObj => {
    delete interactionList[interactionObj.interactionId]
    console.log(interactionObj)
    /*
    //Shields already instantiated, we call it here
    setTimeout(function() {
      shields.hit(shieldIds["Fore"])
    }, 1000)
    setTimeout(function() {
      shields.hit(shieldIds["Aft"])
    }, 2000)
    setTimeout(function() {
      shields.hit(shieldIds["Port"])
    }, 3000)
    setTimeout(function() {
      shields.hit(shieldIds["Starboard"])
    }, 4000)
    */
  });




  App.on("FD_typeChange", appObj => {
    shipList[appObj.id].setType(appObj.type)
    //Also add something in here that saves it to a static file, so it can
    //be pulled up later without having to set the ship type again.
  })

  App.on("FD_skillChange", appObj => {
    shipList[appObj.id].setFlightSkill(appObj.flightSkillLevel)
    shipList[appObj.id].setWeaponsSkill(appObj.weaponsSkillLevel)
    //Also add something in here that saves it to a static file, so it can
    //be pulled up later without having to set the ship type again.
  })

  App.on("FD_newTarget", appObj => {
    shipList[appObj.id].setTargetedContact(appObj.targetedId)
  })

  App.on("FD_shields", appObj => {
    if (appObj.foreRaised) { shipList[appObj.id].raiseShields("fore", appObj.foreRaised) }
    if (appObj.portRaised) { shipList[appObj.id].raiseShields("port", appObj.portRaised) }
    if (appObj.starboardRaised) { shipList[appObj.id].raiseShields("starboard", appObj.starboardRaised) }
    if (appObj.aftRaised) { shipList[appObj.id].raiseShields("aft", appObj.aftRaised) }

    if (appObj.foreIntegrity) { shipList[appObj.id].setShieldIntegrity("fore", appObj.foreIntegrity) }
    if (appObj.portIntegrity) { shipList[appObj.id].setShieldIntegrity("port", appObj.portIntegrity) }
    if (appObj.starboardIntegrity) { shipList[appObj.id].setShieldIntegrity("starboard", appObj.starboardIntegrity) }
    if (appObj.aftIntegrity) { shipList[appObj.id].setShieldIntegrity("aft", appObj.aftIntegrity) }
  })

  App.on("FD_weaponsFire", appObj => {
    let interaction_id = uuid()
    interactionList[interaction_id] = new interaction(interaction_id, shipList[appObj.originationId], shipList[shipList[appObj.originationId].getTargetedContact()], appObj.weaponType)
  })

  App.on("FD_damagedSystems", appObj => {

  })

  // setTimeout(() => {
  //   let interaction_id = uuid()
  //   interactionList[interaction_id] = new interaction(interaction_id, shipList[shipList["user"].getTargetedContact()], shipList["user"], "photon")
  // }, 2000)


};
module.exports.App = App;



var http = require('http');
var url = require('url');

http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  var q = url.parse(req.url, true).query;
  let result = ""
  switch (q.doWhat) {
    case "getCurrentContacts":
      for (let x in shipList) {
        result += (shipList[x].getName() + ":" + x + "\n")
      }
      break;
    case "getCurrentTargetedContact":

      result = shipList[q.shipId].getTargetedContact()
      if (result != "") {
      result += "\n" + shipList[shipList[q.shipId].getTargetedContact()].getName()
      }
    break;
    case "FD_newTarget":
      App.emit("FD_newTarget", q);
      // id
      // targetedId
      break;
    case "FD_weaponsFire":
      App.emit("FD_weaponsFire", q);
      //originationId
      //weaponType
      break;
    default:
      break
  }
  res.write(result);
  res.end()
}).listen(8080);