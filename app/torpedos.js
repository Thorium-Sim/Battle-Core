const getClient = require("../helpers/graphqlClient");
const { clientId } = require("../index");
const gql = require("graphql-tag");
const { App } = require("./index");


var theObservable
var simulatorId = ""


const SUBSCRIPTION = gql `
subscription TorpedosUpdate($simulatorId: ID!) {
  torpedosUpdate(simulatorId: $simulatorId) {
    id
    simulatorId
    name
    type
    displayName
    power {
      power
      powerLevels
    }
    damage {
      damaged
      destroyed
    }
    inventory {
      id
      type
      probe
    }
    loaded
    state
  }
}
`;


class Torpedo {
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

const torpedo = new Torpedo();
module.exports = torpedo;



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
          App.emit("torpedoChange", data);
        },
        error => {
          console.log("Error: ", error);
        }
      );
    })
    .catch(err => console.error(err));
}