import * as core from '@actions/core'
import { Octokit } from '@octokit/action'
import { RequestError } from '@octokit/request-error'

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

  const packageType = core.getInput('package-type') || 'container'

  const octokit = new Octokit({
    auth: token,
  })

  var foundImage = false

  try {
    // Query container versions
    const organizationLower = organization.toLowerCase()
    const { data } = await octokit.request(
      `Get /orgs/${organizationLower}/packages/${packageType}/${imageName}/versions`
    )

    // Search for the specified tag
    if (packageType === 'container') {
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
    } else {
      // check collapsed 0s version
      const alternateVersion = imageTag.split('.').map(x => parseInt(x, 10)).join('.')

      for (let pkg of data) {
        if (pkg.name === imageTag || pkg.name === alternateVersion)  {
          foundImage = true
          break
        }
      }
    }
  } catch (err: unknown) {

    // If we got a 404, the container doesn't exist. Warn, but continue
    const error = err as RequestError
    if (error && error.status == 404) {
      core.warning(`Container ${imageName} does not exist on the registry`)
    } else {
      core.setFailed(error)
    }
  } finally {
    core.setOutput('exists', foundImage ? 'true' : null)
  }
}

run()
