const getClient = require("../helpers/graphqlClient");
const { clientId } = require("../index");
const gql = require("graphql-tag");
const { App } = require("./index");


var theObservable
var simulatorId = ""


const SUBSCRIPTION = gql `
subscription SensorContactUpdate($simulatorId: ID!) {
  sensorContactUpdate(simulatorId: $simulatorId) {
    id
    name
    type
    size
    icon
    picture
    color
    rotation
    speed
    location {
      x
      y
      z
    }
    destination {
      x
      y
      z
    }
    position {
      x
      y
      z
    }
    startTime
    endTime
  }
}
`;


class SensorContact {
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

const sensorContact = new SensorContact();
module.exports = sensorContact;



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
          App.emit("sensorContactChange", data);
        },
        error => {
          console.log("Error: ", error);
        }
      );
    })
    .catch(err => console.error(err));
}