const core = require('@actions/core')
const utils = require('./utils')
const rally = require('rally')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const title = utils.getTitle()
    const branch = utils.getBranch()
    const body = utils.getBody()

    core.debug(`PR Title: ${title}`)
    core.debug(`PR Branch: ${branch}`)
    core.debug(`PR Body: ${body}`)

    if (!title) {
      core.setFailed(`Could not load PR title`)
      return
    }

    if (!branch) {
      core.setFailed(`Could not load PR branch`)
      return
    }

    if (!body) {
      core.setFailed(`Could not load PR body`)
      return
    }

    const storyPrefix = core.getInput('rally-story-prefix', { required: true })
    const defectPrefix = core.getInput('rally-defect-prefix', {
      required: true
    })
    const artifactPrefixes = [storyPrefix, defectPrefix]
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
    const allMatches = titleMatches.concat(bodyMatches).concat(branchMatches)

    if (allMatches.length === 0) {
      core.setFailed(
        'No Rally artifact found in the title, body, or branch name.'
      )
      return
    }

    core.setOutput('rally-artifacts', allMatches)

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

    const artifact = await utils.getRallyArtifact(rallyApi, allMatches[0])

    core.info(JSON.stringify(artifact))

    core.setOutput('rally-artifact-id', artifact._refObjectUUID)
    core.setOutput('rally-artifact-name', artifact._refObjectName)
    core.setOutput('rally-artifact-formatted-id', allMatches[0])
    core.setOutput('rally-artifact-url', artifact._ref)
    core.setOutput('rally-artifact-oid', artifact.ObjectID)
    core.setOutput('rally-artifact-description', artifact.Description)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
