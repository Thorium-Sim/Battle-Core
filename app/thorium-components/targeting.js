const getClient = require("../../helpers/graphqlClient");
const { clientId } = require("../../index");
const gql = require("graphql-tag");
const { App } = require("../index");


var theObservable
var simulatorId = ""


const QUERY = gql `
query Targeting(
  $simulatorId: ID!,
) {
  targeting(
    simulatorId: $simulatorId,
  ) {
    id
    simulatorId
    type
    name
    displayName
    contacts {
      id
      class
      name
      size
      targeted
      system
      icon
      picture
      speed
      quadrant
      destroyed
      moving
    }
    classes {
      id
      name
      size
      icon
      picture
      speed
      quadrant
      moving
    }
    quadrants
    range
    coordinateTargeting
    interference
    targetedSensorContact {
      id
    }
    calculatedTarget {
      x
      y
      z
    }
    enteredTarget {
      x
      y
      z
    }
  }
}
`;


const SUBSCRIPTION = gql `
subscription TargetingUpdate($simulatorId: ID!) {
  targetingUpdate(simulatorId: $simulatorId) {
    id
    simulatorId
    type
    name
    displayName
    contacts {
      id
      class
      name
      size
      targeted
      system
      icon
      picture
      speed
      quadrant
      destroyed
      moving
    }
    classes {
      id
      name
      size
      icon
      picture
      speed
      quadrant
      moving
    }
    quadrants
    range
    coordinateTargeting
    interference
    targetedSensorContact {
      id
    }
    calculatedTarget {
      x
      y
      z
    }
    enteredTarget {
      x
      y
      z
    }
  }
}
`;


class Targeting {
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

const targeting = new Targeting();
module.exports = targeting;



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
        App.emit("targetingChange", data.targeting[0]);
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
          App.emit("targetingChange", data.targetingUpdate[0]);
        },
        error => {
          console.log("Error: ", error);
        }
      );
    })
    .catch(err => console.error(err));
}