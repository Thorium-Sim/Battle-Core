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
var interactionList = {}

var prevTorpedoObj = {}
var prevPhaserObj = {}

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
    //Updates all user related interactions
    console.log("thrusterChange", thrusterObj)
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
        //assign types from static file history
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
    for (let x = 0; x < shieldObj.length; x++) {
      shipList["user"].raiseShields(shieldObj[x].name, shieldObj[x].state);
      shipList["user"].setShieldIntegrity(shieldObj[x].name, shieldObj[x].integrity);
      //Maybe at some point in time, make it so shield frequency is
      //more and less effective against different weapons / phaser arcs?
    }
    //console.log("shieldChange", shieldObj)
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


  /* Mutations */
  //Instantiate the sensorInfo object

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



  App.on("interactionResult", interactionObj => {
    delete interactionList[interactionObj.interactionId]
    console.log(interactionObj)
  });

  const sensorsInfo = require("./thorium-components/sensorsInfo");
  App.on("newInteraction", interactionClass => {
    if ((interactionClass.getDestinationShip()).getID() == "user") {
      let timeToImpact = Math.round(interactionClass.calculateTimeToImpact() / 100) / 10
      if (timeToImpact > 2) {
        sensorsInfo.send("Incoming " + interactionClass.getWeaponType() + " fire!  Impact in " + timeToImpact + " seconds", true)
      } else {
        sensorsInfo.send(interactionClass.getWeaponType() + " impact detected", true)
      }
    }
  });





};
module.exports.App = App;