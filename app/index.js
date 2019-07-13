const { EventEmitter } = require("events");
const App = new EventEmitter();
const getClient = require("../helpers/graphqlClient");
const registerClient = require("../helpers/registerClient");
const gql = require("graphql-tag");
const fs = require('fs')

var currentStation = "";
var currentSimId = "";

module.exports = (address, port, clientId) => {
  console.log("Starting app...");

  // Create the client singleton
  getClient(address, port, clientId);

  // Register this app with Thorium as a client
  registerClient();
  console.log("Registered Client");


  // Grab the client object to instantiate it
  const client = require("./client");
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
  const phasers = require("./phasers");
  App.on("phaserChange", phaserObj => {
    console.log("phaserChange", phaserObj)
  });

  //Instantiate the torpedo object
  const torpedos = require("./torpedos");
  App.on("torpedoChange", torpedoObj => {
    console.log("torpedoChange", torpedoObj)
  });

  //Instantiate the thruster object
  const thrusters = require("./thrusters");
  App.on("thrusterChange", thrusterObj => {
    console.log("thrusterChange", thrusterObj)
  });

  //Instantiate the shield object
  const shields = require("./shields");
  let shieldIds = {};
  App.on("shieldChange", shieldObj => {
    //console.log("shieldChange", shieldObj)
    for (let x = 0; x < shieldObj.length; x++) {
      shieldIds[shieldObj[x].name] = shieldObj[x].id
    }
  });

  //Instantiate the sensor object
  const sensorContacts = require("./sensorContacts");
  App.on("sensorContactChange", sensorContactObj => {
    console.log("sensorContactChange", sensorContactObj)
  });

  //Instantiate the targeting object
  const targeting = require("./targeting");
  App.on("targetingChange", targetingObj => {
    console.log("targetingChange", targetingObj)
  });


  /* Mutations */
  //Instantiate the sensorInfo object
  const sensorsInfo = require("./sensorsInfo");
  setTimeout(function() {
    sensorsInfo.send("woot!", true)
  }, 3000)

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


};
module.exports.App = App;