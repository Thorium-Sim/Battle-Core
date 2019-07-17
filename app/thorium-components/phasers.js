const getClient = require("../../helpers/graphqlClient");
const { clientId } = require("../../index");
const gql = require("graphql-tag");
const { App } = require("../index");


var theObservable
var simulatorId = ""


const QUERY = gql `
query Phasers($simulatorId: ID!) {
  phasers(simulatorId: $simulatorId) {
    id
    simulatorId
    name
    beams {
      id
      state
      charge
      heat
    }
    arc
  }
}
`;


const SUBSCRIPTION = gql `
subscription PhasersUpdate($simulatorId: ID!) {
  phasersUpdate(simulatorId: $simulatorId) {
    id
    simulatorId
    name
    beams {
      id
      state
      charge
      heat
    }
    arc
  }
}
`;


class Phaser {
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

const phaser = new Phaser();
module.exports = phaser;



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
        App.emit("phaserChange", data.phasers);
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
          App.emit("phaserChange", data.phasersUpdate);
        },
        error => {
          console.log("Error: ", error);
        }
      );
    })
    .catch(err => console.error(err));
}