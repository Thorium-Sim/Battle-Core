const getClient = require("../../helpers/graphqlClient");
const { clientId } = require("../../index");
const gql = require("graphql-tag");
const { App } = require("../index");


var theObservable
var simulatorId = ""
var shieldsIntegrity = {}
var mutationData = []


const QUERY = gql `
query Shields (
    $simulatorId:ID!
) {
  shields (
    simulatorId: $simulatorId
  ) {
    id
    simulatorId
    type
    name
    id
    stealthFactor
    position
    frequency
    state
    integrity
  }
}
`

const MUTATION = gql `
mutation SetShields(
  $id: ID!,
  $integrity: Float
) {
  shieldIntegritySet(
    id: $id,
    integrity: $integrity
  )
}
`;

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
      setShieldsId();
    }
  }
  hit(shieldId) {
    if (shieldId && shieldsIntegrity[shieldId]) {
      let amount = ((Math.random() / 10) + .05)
      let newIntegrity = shieldsIntegrity[shieldId] - amount
      mutationData["id"] = shieldId;
      mutationData["integrity"] = (newIntegrity);
      sendMutation();
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
          shieldsIntegrity = {}
          for (let x = 0; x < data.shieldsUpdate.length; x++) {
            shieldsIntegrity[data.shieldsUpdate[x].id] = data.shieldsUpdate[x].integrity
          }
          App.emit("shieldChange", data.shieldsUpdate);
        },
        error => {
          console.log("Error: ", error);
        }
      );
    })
    .catch(err => console.error(err));
}



function setShieldsId() {
  if (!simulatorId || simulatorId == "") {
    shieldsIntegrity = {}
  } else {
    const graphQLClient = getClient();
    graphQLClient
      .query({
        query: QUERY,
        variables: { simulatorId }
      })
      .then(({ data }) => {
        App.emit("shieldChange", data.shields);
        shieldsIntegrity = {}
        for (let x = 0; x < data.shields.length; x++) {
          shieldsIntegrity[data.shields[x].id] = data.shields[x].integrity
        }
      })
      .catch(err => console.error(err));
  }
}



function sendMutation() {
  const graphQLClient = getClient();
  graphQLClient
    .query({ query: MUTATION, variables: mutationData })
    .then(() => {
      console.log("Sent");
    });
}