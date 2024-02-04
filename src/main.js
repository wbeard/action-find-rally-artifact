const core = require('@actions/core')
const utils = require('./utils')
const rally = require('rally')

function getFormattedIds({
  artifactPrefixes,
  title,
  branch,
  body,
  commitMessages
}) {
  const possibleArtifactRegexes = artifactPrefixes.map(
    prefix => new RegExp(`${prefix}\\d{1,10}`, 'g')
  )
  const titleMatches = possibleArtifactRegexes
    .flatMap(regex => title.match(regex))
    .filter(Boolean)
  const bodyMatches = possibleArtifactRegexes
    .flatMap(regex => body.match(regex))
    .filter(Boolean)
  const branchMatches = possibleArtifactRegexes
    .flatMap(regex => branch.match(regex))
    .filter(Boolean)
  let commitMatches = []
  for (const message of commitMessages) {
    commitMatches = commitMatches.concat(
      possibleArtifactRegexes.flatMap(regex => message.match(regex))
    )
  }
  return titleMatches
    .concat(bodyMatches)
    .concat(branchMatches)
    .concat(commitMatches)
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const title = utils.getTitle() || ''
    const branch = utils.getBranch() || ''
    const body = utils.getBody() || ''
    const commitMessages = utils.getCommitMessages() || []
    const storyPrefix = core.getInput('rally-story-prefix', { required: true })
    const defectPrefix = core.getInput('rally-defect-prefix', {
      required: true
    })
    const artifactPrefixes = [storyPrefix, defectPrefix]
    const formattedIds = getFormattedIds({
      artifactPrefixes,
      title,
      branch,
      body,
      commitMessages
    })

    if (formattedIds.length === 0) {
      core.setFailed(
        'No Rally artifact formatted id found in the commit messages, title, body, or branch name.'
      )
      return
    }

    core.setOutput('rally-artifacts', formattedIds)

    const rallyApiKey = core.getInput('rally-api-key', { required: true })
    const rallyApi = rally({
      apiKey: rallyApiKey,
      requestOptions: {
        headers: {
          'X-RallyIntegrationName': 'Github Action',
          'X-RallyIntegrationVersion': '1.0'
        }
      }
    })
    const type = formattedIds[0].startsWith(storyPrefix)
      ? 'hierarchicalrequirement'
      : 'defect'
    const artifact = await utils.getRallyArtifact(
      rallyApi,
      type,
      formattedIds[0]
    )

    if (!artifact) {
      core.setFailed(
        `Could not find Rally artifact with FormattedID: ${formattedIds[0]}`
      )
      return
    }

    core.setOutput('rally-artifact-id', artifact._refObjectUUID)
    core.setOutput('rally-artifact-name', artifact._refObjectName)
    core.setOutput('rally-artifact-formatted-id', artifact.FormattedID)
    core.setOutput('rally-artifact-url', artifact._ref)
    core.setOutput('rally-artifact-oid', artifact.ObjectID)
    core.setOutput('rally-artifact-description', artifact.Description)
    core.setOutput('rally-artifact-type', artifact._Type)
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
