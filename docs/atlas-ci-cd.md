# Atlas CI/CD configuration

The repository has two Atlas apps (`rmap` and `login`) and two Atlas hosts
(`react-host` and `angular-host`). Apps and hosts are both published to the
shared Atlas registry. A changed host is additionally packaged as an nginx
Docker image containing its generated Atlas bootstrap (`index.html`, loader,
runtime configuration, and nginx configuration), pushed to Docker Hub, and
deployed to Render.

Both pipelines use `nx affected`. Unchanged Atlas projects are not linted,
tested, built, published, containerized, or deployed. Nx selects Atlas
publication through the generated `atlas:publish` target and identifies hosts
through their generated `atlas:bootstrap` target. All generated Atlas projects
also carry the standard `atlas` tag.

On a pull request from this repository, GitHub Actions validates the affected
projects and publishes their Atlas PR preview artifacts using the pull
request's actual head SHA. PR publication updates only the shared Atlas
registry; it does not build host images or deploy to Render. Pull requests from
forks are validation-only because GitHub does not expose publication secrets to
untrusted fork code. Closing or merging a pull request removes its preview
artifacts from the registry.

On `master` or a `v*` tag, the delivery order is:

1. Validate only affected Atlas projects.
2. Atlas-publish affected apps and hosts concurrently; Atlas's storage lease
   safely serializes registry mutation.
3. Generate the bootstrap for each affected host.
4. Build affected host images and push both `:<bootstrap-digest>` and `:latest`
   tags.
5. Deploy the immutable bootstrap-digest tag to the matching Render service.
6. Wait for every Render deploy to become `live`, then run `atlas verify`.

## GitHub production environment

Configure these non-secret GitHub environment variables:

| Name                             | Required     | Description                                                                 |
| -------------------------------- | ------------ | --------------------------------------------------------------------------- |
| `ATLAS_S3_BUCKET`                | Yes          | S3-compatible bucket containing Atlas objects.                              |
| `ATLAS_S3_REGION`                | Yes          | Signing region, for example `us-east-1`.                                    |
| `ATLAS_REGISTRY_URL`             | Yes          | Public URL serving published Atlas objects.                                 |
| `ATLAS_RUNTIME_URLS`             | Yes          | Comma-separated URLs for both hosts' `atlas.runtime.json` files.            |
| `ATLAS_STORAGE_API_URL`          | Non-AWS S3   | Private provider API endpoint for R2, MinIO, or similar.                    |
| `ATLAS_STORAGE_KEY_PREFIX`       | No           | Optional object-key namespace; public registry URL must serve it.           |
| `ATLAS_S3_FORCE_PATH_STYLE`      | MinIO        | Set to `true` if path-style access is required.                             |
| `DOCKERHUB_USERNAME`             | Host deploys | Docker Hub account name.                                                    |
| `DOCKERHUB_REACT_HOST_IMAGE`     | React host   | Repository without registry or tag, such as `acme/parliament-react-host`.   |
| `DOCKERHUB_ANGULAR_HOST_IMAGE`   | Angular host | Repository without registry or tag, such as `acme/parliament-angular-host`. |
| `RENDER_REACT_HOST_SERVICE_ID`   | React host   | Render service ID beginning with `srv-`.                                    |
| `RENDER_ANGULAR_HOST_SERVICE_ID` | Angular host | Render service ID beginning with `srv-`.                                    |

Example runtime value:

```text
https://angular.example.com/atlas.runtime.json,https://react.example.com/atlas.runtime.json
```

Configure these GitHub environment secrets:

| Secret                            | Purpose                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| `ATLAS_STORAGE_ACCESS_KEY_ID`     | S3-compatible access key.                                      |
| `ATLAS_STORAGE_SECRET_ACCESS_KEY` | S3-compatible secret key.                                      |
| `DOCKERHUB_TOKEN`                 | Docker Hub personal access token with repository write access. |
| `RENDER_API_KEY`                  | Render API key allowed to deploy both host services.           |

Create two private or public Docker Hub repositories matching the configured
image names. In Render, create two image-backed web services whose default
images are `docker.io/<configured-image>:latest`. The repository portion must
match exactly because Render permits the pipeline to change only the image tag
or digest. Configure each service to use the port exposed by its Dockerfile:
React uses `8081`; Angular uses `8080`.

## Jenkins configuration

The Jenkins controller needs a NodeJS tool installation named `node-22`, the
same non-secret environment values listed above, and these Secret Text
credentials:

| Credential ID                     | Purpose                           |
| --------------------------------- | --------------------------------- |
| `atlas-storage-access-key-id`     | S3-compatible access key.         |
| `atlas-storage-secret-access-key` | S3-compatible secret key.         |
| `dockerhub-username`              | Docker Hub account name.          |
| `dockerhub-token`                 | Docker Hub personal access token. |
| `render-api-key`                  | Render API key.                   |

The Jenkins agent must provide Docker with the Buildx plugin and retain enough
Git history to contain the previous successful commit and pull-request target.
Jenkins stores Docker credentials only under the disposable job workspace.

## Performance and safety

GitHub Actions uses Nx's `nx-set-shas`, so a failed run cannot cause the next
run to skip changes. Jenkins compares against `GIT_PREVIOUS_SUCCESSFUL_COMMIT`;
pull requests compare with their target branch. Lockfile changes use Nx's
`auto` dependency mapping instead of invalidating every project.

The npm cache, local Nx cache, BuildKit layer cache, and Docker Hub build cache
avoid repeating work. Host deployments run concurrently after their images are
pushed. Production runs are serialized, while stale pull-request runs are
canceled. GitHub Actions are pinned to immutable commit SHAs and the workflow
token is read-only. Docker Hub uses a token rather than a password, and Render
deploys an immutable bootstrap-digest tag rather than mutable `latest`.

For cross-run Nx artifact caching, connect Nx Cloud. The current setup does not
require an Nx Cloud account.

References:

- [Atlas production deployment](https://github.com/bendaj11/atlas/blob/main/docs/production-deployment.md)
- [Atlas CLI](https://github.com/bendaj11/atlas/blob/main/packages/cli/README.md)
- [Nx affected in CI](https://nx.dev/docs/features/ci-features/affected)
- [Docker GitHub Actions](https://docs.docker.com/build/ci/github-actions/)
- [Docker build cache backends](https://docs.docker.com/build/cache/backends/)
- [Render image-backed services](https://render.com/docs/docker)
- [Render deploy API](https://api-docs.render.com/reference/create-deploy)
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use)
- [Jenkins Pipeline syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
