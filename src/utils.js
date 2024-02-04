const { context } = require('@actions/github')

async function getRallyArtifact(rally, type, formattedId) {
  const queryResult = await rally.query({
    type,
    query: `(FormattedID = ${formattedId})`,
    fetch: ['FormattedID', 'Description', 'Name', 'PlanEstimate']
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

function getCommitMessages() {
  return context?.payload?.commits?.map(commit => commit.message)
}

module.exports = {
  getCommitMessages,
  getRallyArtifact,
  getTitle,
  getBranch,
  getBody
}
