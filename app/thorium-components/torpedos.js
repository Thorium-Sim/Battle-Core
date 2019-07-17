const getClient = require("../../helpers/graphqlClient");
const { clientId } = require("../../index");
const gql = require("graphql-tag");
const { App } = require("../index");


var theObservable
var simulatorId = ""


const QUERY = gql `
query Torpedos($simulatorId: ID!) {
  torpedos(simulatorId: $simulatorId) {
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
    }
    loaded
    state
  }
}
`;


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
    .query({
      query: QUERY,
      variables: { simulatorId }
    })
    .then(({ data }) => {
        App.emit("torpedoChange", data.torpedos);
      },
      error => {
        console.log("Error: ", error);
      })
    .catch(err => console.error(err));

  graphQLClient
    .subscribe({
      query: SUBSCRIPTION,
      variables: { simulatorId }
    })
    .then(observable => {
      theObservable = observable;
      observable.subscribe(
        ({ data }) => {
          App.emit("torpedoChange", data.torpedosUpdate);
        },
        error => {
          console.log("Error: ", error);
        }
      );
    })
    .catch(err => console.error(err));
}