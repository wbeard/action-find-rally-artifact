const rally = require('rally')
const core = require('@actions/core')

async function run() {
  try {
    const apiKey = core.getInput('rally-api-key', { required: true })
    const artifactRef = core.getInput('rally-artifact-ref', { required: true })
    const prName = core.getInput('rally-pr-name', { required: true })
    const prUrl = core.getInput('rally-pr-url', { required: true })
    const externalFormattedId = core.getInput('rally-external-formatted-id', {
      required: true
    })
    const externalId = core.getInput('rally-external-id', { required: true })
    const rallyApi = rally({
      apiKey,
      requestOptions: {
        headers: {
          'X-RallyIntegrationName': 'Github Action',
          'X-RallyIntegrationVendor': 'Rally Software'
        }
      }
    })
    const createResult = await rallyApi.create({
      type: 'pullrequest',
      data: {
        PullRequest: {
          Name: prName,
          Url: prUrl,
          Artifact: artifactRef,
          ExternalFormattedId: externalFormattedId,

          ExternalId: externalId
        }
      }
    })

    if (createResult.Errors.length > 0) {
      core.setFailed(`Error creating Rally PR: ${createResult.Errors}`)
      return
    }

    core.setOutput('rally-pr-id', createResult.Object._refObjectUUID)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

run()
