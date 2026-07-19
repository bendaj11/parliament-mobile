pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
    timeout(time: 45, unit: 'MINUTES')
    timestamps()
  }

  tools {
    nodejs 'node-22'
  }

  environment {
    ATLAS_DEFAULT_BRANCH = 'master'
    ATLAS_STORAGE = 's3'
    ATLAS_REQUIRE_PUBLICATION = 'true'
    CI = 'true'
    NX_DAEMON = 'false'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci --prefer-offline --no-audit --no-fund'
      }
    }

    stage('Set affected range') {
      steps {
        script {
          env.NX_HEAD = sh(
            script: 'git rev-parse HEAD',
            returnStdout: true
          ).trim()

          if (env.CHANGE_TARGET) {
            env.NX_BASE = sh(
              script: "git merge-base HEAD origin/${env.CHANGE_TARGET}",
              returnStdout: true
            ).trim()
          } else if (
            env.GIT_PREVIOUS_SUCCESSFUL_COMMIT &&
            sh(
              script: "git cat-file -e ${env.GIT_PREVIOUS_SUCCESSFUL_COMMIT}^{commit}",
              returnStatus: true
            ) == 0
          ) {
            env.NX_BASE = env.GIT_PREVIOUS_SUCCESSFUL_COMMIT
          } else {
            env.NX_BASE = sh(
              script: 'git rev-parse HEAD~1 2>/dev/null || git hash-object -t tree /dev/null',
              returnStdout: true
            ).trim()
          }

          env.ATLAS_GIT_SHA = env.NX_HEAD
          env.ATLAS_GIT_BRANCH = env.CHANGE_BRANCH ?: env.BRANCH_NAME
          env.ATLAS_GIT_COMMIT_TITLE = sh(
            script: 'git log -1 --format=%s',
            returnStdout: true
          ).trim()

          env.ATLAS_PROJECTS_AFFECTED = findAffectedProjects('atlas:publish')
          env.ATLAS_HOSTS_AFFECTED = findAffectedProjects('atlas:bootstrap')
          env.ATLAS_APPS_AFFECTED = commaSeparatedDifference(
            env.ATLAS_PROJECTS_AFFECTED,
            env.ATLAS_HOSTS_AFFECTED
          )

          echo "Nx affected range: ${env.NX_BASE}..${env.NX_HEAD}"
          echo "Affected Atlas projects: ${env.ATLAS_PROJECTS_AFFECTED ?: 'none'}"
          echo "Affected Atlas apps: ${env.ATLAS_APPS_AFFECTED ?: 'none'}"
          echo "Affected Atlas hosts: ${env.ATLAS_HOSTS_AFFECTED ?: 'none'}"
        }
      }
    }

    stage('Validate affected projects') {
      when {
        expression {
          env.ATLAS_PROJECTS_AFFECTED?.trim()
        }
      }
      steps {
        sh 'npx nx sync:check'
        sh '''
          npx nx affected \
            -t lint test build \
            --outputStyle=static
        '''
      }
    }

    stage('Publish Atlas artifacts') {
      when {
        beforeAgent true
        allOf {
          anyOf {
            branch 'master'
            buildingTag()
          }
          expression {
            env.ATLAS_PROJECTS_AFFECTED?.trim()
          }
        }
      }
      steps {
        withCredentials([
          string(credentialsId: 'atlas-storage-access-key-id', variable: 'ATLAS_STORAGE_ACCESS_KEY_ID'),
          string(credentialsId: 'atlas-storage-secret-access-key', variable: 'ATLAS_STORAGE_SECRET_ACCESS_KEY')
        ]) {
          sh '''
            required="ATLAS_S3_BUCKET ATLAS_S3_REGION ATLAS_REGISTRY_URL ATLAS_RUNTIME_URLS ATLAS_STORAGE_ACCESS_KEY_ID ATLAS_STORAGE_SECRET_ACCESS_KEY"
            for name in $required; do
              eval "value=\${$name:-}"
              if [ -z "$value" ]; then
                echo "Missing required Atlas deployment value: $name" >&2
                exit 1
              fi
            done

            if [ -n "${TAG_NAME:-}" ]; then
              export CI_COMMIT_TAG="$TAG_NAME"
            fi

            npx nx affected \
              -t atlas:publish \
              --outputStyle=static
          '''
        }
      }
    }

    stage('Build and deploy host images') {
      when {
        beforeAgent true
        allOf {
          anyOf {
            branch 'master'
            buildingTag()
          }
          expression { env.ATLAS_HOSTS_AFFECTED?.trim() }
        }
      }
      steps {
        withCredentials([
          string(credentialsId: 'dockerhub-username', variable: 'DOCKERHUB_USERNAME'),
          string(credentialsId: 'dockerhub-token', variable: 'DOCKERHUB_TOKEN'),
          string(credentialsId: 'render-api-key', variable: 'RENDER_API_KEY')
        ]) {
          sh '''
            required="DOCKERHUB_USERNAME DOCKERHUB_TOKEN RENDER_API_KEY"
            case ",$ATLAS_HOSTS_AFFECTED," in
              *,react-host,*)
                required="$required DOCKERHUB_REACT_HOST_IMAGE RENDER_REACT_HOST_SERVICE_ID"
                ;;
            esac
            case ",$ATLAS_HOSTS_AFFECTED," in
              *,angular-host,*)
                required="$required DOCKERHUB_ANGULAR_HOST_IMAGE RENDER_ANGULAR_HOST_SERVICE_ID"
                ;;
            esac
            for name in $required; do
              eval "value=\${$name:-}"
              if [ -z "$value" ]; then
                echo "Missing required host deployment value: $name" >&2
                exit 1
              fi
            done

            npx nx affected \
              -t atlas:bootstrap \
              --outputStyle=static

            read_digest() {
              node -e '
                const metadata = require(`./${process.argv[1]}/dist/bootstrap/atlas.bootstrap.json`);
                process.stdout.write(metadata.digest.replace(/^sha256:/, ""));
              ' "$1"
            }
            case ",$ATLAS_HOSTS_AFFECTED," in
              *,react-host,*) export REACT_HOST_BOOTSTRAP_DIGEST="$(read_digest apps/react-host)" ;;
            esac
            case ",$ATLAS_HOSTS_AFFECTED," in
              *,angular-host,*) export ANGULAR_HOST_BOOTSTRAP_DIGEST="$(read_digest apps/angular-host)" ;;
            esac

            export DOCKER_CONFIG="$WORKSPACE/.docker-ci"
            mkdir -p "$DOCKER_CONFIG"
            printf '%s' "$DOCKERHUB_TOKEN" | \
              docker login --username "$DOCKERHUB_USERNAME" --password-stdin
            docker buildx version

            case ",$ATLAS_HOSTS_AFFECTED," in
              *,react-host,*)
                docker buildx build \
                  --push \
                  --provenance=true \
                  --sbom=true \
                  --cache-from "type=registry,ref=$DOCKERHUB_REACT_HOST_IMAGE:buildcache" \
                  --cache-to "type=registry,ref=$DOCKERHUB_REACT_HOST_IMAGE:buildcache,mode=max" \
                  --tag "$DOCKERHUB_REACT_HOST_IMAGE:$REACT_HOST_BOOTSTRAP_DIGEST" \
                  --tag "$DOCKERHUB_REACT_HOST_IMAGE:latest" \
                  apps/react-host
                ;;
            esac
            case ",$ATLAS_HOSTS_AFFECTED," in
              *,angular-host,*)
                docker buildx build \
                  --push \
                  --provenance=true \
                  --sbom=true \
                  --cache-from "type=registry,ref=$DOCKERHUB_ANGULAR_HOST_IMAGE:buildcache" \
                  --cache-to "type=registry,ref=$DOCKERHUB_ANGULAR_HOST_IMAGE:buildcache,mode=max" \
                  --tag "$DOCKERHUB_ANGULAR_HOST_IMAGE:$ANGULAR_HOST_BOOTSTRAP_DIGEST" \
                  --tag "$DOCKERHUB_ANGULAR_HOST_IMAGE:latest" \
                  apps/angular-host
                ;;
            esac

            pids=""
            case ",$ATLAS_HOSTS_AFFECTED," in
              *,react-host,*)
                node tools/ci/deploy-render.mjs \
                  "$RENDER_REACT_HOST_SERVICE_ID" \
                  "docker.io/$DOCKERHUB_REACT_HOST_IMAGE:$REACT_HOST_BOOTSTRAP_DIGEST" &
                pids="$pids $!"
                ;;
            esac
            case ",$ATLAS_HOSTS_AFFECTED," in
              *,angular-host,*)
                node tools/ci/deploy-render.mjs \
                  "$RENDER_ANGULAR_HOST_SERVICE_ID" \
                  "docker.io/$DOCKERHUB_ANGULAR_HOST_IMAGE:$ANGULAR_HOST_BOOTSTRAP_DIGEST" &
                pids="$pids $!"
                ;;
            esac
            for pid in $pids; do
              wait "$pid"
            done
          '''
        }
      }
    }

    stage('Verify deployment') {
      when {
        beforeAgent true
        allOf {
          anyOf {
            branch 'master'
            buildingTag()
          }
          expression {
            env.ATLAS_PROJECTS_AFFECTED?.trim()
          }
        }
      }
      steps {
        sh 'npx atlas verify'
      }
    }
  }

  post {
    always {
      deleteDir()
    }
  }
}

String findAffectedProjects(String targetName) {
  return sh(
    script: """
      projects_json=\$(
        npx nx show projects \\
          --affected \\
          --with-target '${targetName}' \\
          --json
      )
      node -e '
        const projects = JSON.parse(process.argv[1]);
        process.stdout.write(projects.sort().join(","));
      ' "\$projects_json"
    """,
    returnStdout: true
  ).trim()
}

String commaSeparatedDifference(String projects, String excludedProjects) {
  def excluded = (excludedProjects ?: '').split(',').findAll().toSet()
  return (projects ?: '').split(',').findAll { !excluded.contains(it) }.join(',')
}
