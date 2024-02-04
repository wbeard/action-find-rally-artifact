const { context } = require('@actions/github')

async function getRallyArtifact(rally, formattedId) {
  const queryResult = await rally.query({
    type: 'hierarchicalrequirement',
    query: `(FormattedID = ${formattedId})`,
    fetch: ['FormattedID', 'Description']
  })

  return queryResult?.Results?.[0]
}
function getTitle() {
  return context?.payload?.pull_request?.title
}

function getBranch() {
  return context.payload.pull_request?.head.ref
}

function getBody() {
  return context?.payload?.pull_request?.body
}

module.exports = {
  getRallyArtifact,
  getTitle,
  getBranch,
  getBody
}
