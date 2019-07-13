const getClient = require("../helpers/graphqlClient");
const { clientId } = require("../index");
const gql = require("graphql-tag");
const { App } = require("./index");


var theObservable
var simulatorId = ""
var sensorsId = ""
var domain = "external"
let mutationData = []

const QUERY = gql `
query Sensors (
    $simulatorId:ID!
    $domain:String!
) {
  sensors (
    simulatorId: $simulatorId
    domain: $domain
  ) {
    id
    domain
    type
    name
    displayName
  }
}
`

const MUTATION = gql `
mutation ProcessedData(
  $id: ID
  $simulatorId: ID
  $domain: String
  $data: String!
  $flash: Boolean
) {
  processedData(
    id: $id
    simulatorId: $simulatorId
    domain: $domain
    data: $data
    flash: $flash
  )
}
`;


class SensorsInfo {
  constructor() {
    setSensorsId();
  }
  setup(simId) {
    simulatorId = simId;
    setSensorsId();
  }
  send(data, flash) {
    mutationData["id"] = sensorsId;
    mutationData["simulatorId"] = simulatorId;
    mutationData["domain"] = domain;
    mutationData["data"] = data;
    mutationData["flash"] = flash;
    sendMutation();
  }
}

const sensorsInfo = new SensorsInfo();
module.exports = sensorsInfo;



function setSensorsId() {
  if (!simulatorId || simulatorId == "") {
    sensorsId = ""
  } else {
    const graphQLClient = getClient();
    graphQLClient
      .query({
        query: QUERY,
        variables: { simulatorId, domain }
      })
      .then(({ data }) => {
        sensorsId = data.id
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