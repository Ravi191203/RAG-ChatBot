
pipeline {
    agent any

    environment {
        // Use a unique name for the Docker image and container
        DOCKER_IMAGE_NAME = "contextual-companion"
        DOCKER_CONTAINER_NAME = "contextual-companion-app"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    // Run npm install inside a temporary node container
                    sh "docker run --rm -v \${env.WORKSPACE}:/app -w /app node:20 npm install"
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Run typecheck inside a temporary node container
                     sh "docker run --rm -v \${env.WORKSPACE}:/app -w /app node:20 npm run typecheck"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image and tag it with the build number
                    sh "docker build -t ${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER} ."
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Stop and remove the old container if it exists
                    sh "docker stop ${DOCKER_CONTAINER_NAME} || true"
                    sh "docker rm ${DOCKER_CONTAINER_NAME} || true"
                    
                    // Run the new container from the newly built image
                    sh "docker run -d --name ${DOCKER_CONTAINER_NAME} --env-file .env -p 3000:3000 ${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}"
                }
            }
        }
    }

    post {
        always {
            // Clean up old Docker images to save space
            sh 'docker image prune -f'
        }
    }
}
