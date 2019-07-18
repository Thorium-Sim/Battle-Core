const getClient = require("../../helpers/graphqlClient");
const { clientId } = require("../../index");
const gql = require("graphql-tag");
const { App } = require("../index");


var theObservable
var simulatorId = ""


const SUBSCRIPTION = gql `
subscription ThrustersUpdate($simulatorId: ID!) {
  rotationChange(simulatorId: $simulatorId) {
    id
    simulatorId
    name
    type
    direction {
      x
      y
      z
    }
    rotation {
      yaw
      pitch
      roll
    }
    rotationDelta {
      yaw
      pitch
      roll
    }
    rotationRequired {
      yaw
      pitch
      roll
    }
    manualThrusters
    rotationSpeed
    movementSpeed
  }
}
`;


class Thruster {
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

const thruster = new Thruster();
module.exports = thruster;



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
          App.emit("thrusterChange", data.rotationChange);
        },
        error => {
          console.log("Error: ", error);
        }
      );
    })
    .catch(err => console.error(err));
}