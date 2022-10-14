import * as core from '@actions/core'
import { Octokit } from '@octokit/action'

async function run(): Promise<void> {

  const organization = core.getInput('organization')
  if (!organization) {
    core.setFailed('No organization passed to the action')
    return
  }

  const imageName = core.getInput('image-name')
  if (!imageName) {
    core.setFailed('No image-name passed to the action')
    return
  }

  const imageTag = core.getInput('image-tag')
  if (!imageTag) {
    core.setFailed('No image-tag passed to the action')
    return
  }

  const token = core.getInput('token')
  if (!token) {
    core.setFailed('No access token passed to the action')
    return
  }

  const octokit = new Octokit({
    auth: token,
  })

  // Query container versions
  const organizationLower = organization.toLowerCase()
  const { data } = await octokit.request(
      `Get /orgs/${organizationLower}/packages/container/${imageName}/versions`
  )

  // Search for the specified tag
  var foundImage = false
  for (let container of data) {
    const tags = container.metadata.container.tags
    for (let tag of tags) {
      if (tag == imageTag) {
        foundImage = true
        break
      }

    }

    if (foundImage) {
      break
    }
  }

  core.setOutput('exists', foundImage)
}

run()
