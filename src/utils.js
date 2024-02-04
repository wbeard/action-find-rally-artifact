const { context } = require('@actions/github')
const rally = require('rally')

function containsFormattedId(str, formattedIdRegex) {
  const matches = str.match(formattedIdRegex)

  if (matches?.length > 0) {
    return matches[0]
  } else {
    return false
  }
}

async function getRallyArtifact(formattedId) {
  const queryResult = await rally.query({
    query: `(FormattedID = ${formattedId})`
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
  containsFormattedId,
  getRallyArtifact,
  getTitle,
  getBranch,
  getBody
}
