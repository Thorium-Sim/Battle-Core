const getClient = require("../helpers/graphqlClient");
const { clientId } = require("../index");
const gql = require("graphql-tag");
const { App } = require("./index");


var theObservable
var simulatorId = ""


const SUBSCRIPTION = gql `
subscription ShieldsUpdate($simulatorId: ID!) {
  shieldsUpdate(simulatorId: $simulatorId) {
    id
    simulatorId
    name
    type
    power {
      power
      powerLevels
    }
    damage {
      damaged
      destroyed
    }
    displayName
    stealthFactor
    heat
    coolant
    position
    frequency
    state
    integrity
    damage {
      damaged
      destroyed
      which
    }
  }
}
`;


class Shield {
  constructor() {
    if (simulatorId && simulatorId != "") {
      subscribe();
    }
  }
  setup(simId) {
    simulatorId = simId;
    if (theObservable) {
      unsubscribe();
    }
    if (simulatorId && simulatorId != "") {
      subscribe();
    }
  }
}

const shield = new Shield();
module.exports = shield;



function unsubscribe() {
  theObservable.subscribe().unsubscribe()
}


function subscribe() {
  const graphQLClient = getClient();
  graphQLClient
    .subscribe({
      query: SUBSCRIPTION,
      variables: { simulatorId }
    })
    .then(observable => {
      theObservable = observable;
      observable.subscribe(
        ({ data }) => {
          App.emit("shieldChange", data);
        },
        error => {
          console.log("Error: ", error);
        }
      );
    })
    .catch(err => console.error(err));
}