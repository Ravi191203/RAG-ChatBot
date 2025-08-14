pipeline {
    agent any

    environment {
        // Use the project name for the Docker image and container
        PROJECT_NAME = 'contextual-companion'
        // Use the Jenkins BUILD_NUMBER to version the Docker image
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        // The name for the running Docker container
        CONTAINER_NAME = "${PROJECT_NAME}"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    // Use a specific Node.js version in a Docker container for consistency
                    docker.image('node:18').inside {
                        // Clean install for a reliable build
                        sh 'npm ci'
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Run tests inside the same Node.js container environment
                    docker.image('node:18').inside {
                        // Perform static type checking as a basic test
                        sh 'npm run typecheck'
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image using the Dockerfile in the current directory
                    sh "docker build -t ${PROJECT_NAME}:${IMAGE_TAG} ."
                    sh "docker tag ${PROJECT_NAME}:${IMAGE_TAG} ${PROJECT_NAME}:latest"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Stop and remove the old container if it exists to prevent conflicts
                    sh "docker stop ${CONTAINER_NAME} || true"
                    sh "docker rm ${CONTAINER_NAME} || true"
                    
                    // Run the new container, passing the .env file for environment variables
                    // and mapping port 3000 to the host.
                    sh """
                    docker run -d --name ${CONTAINER_NAME} \\
                               --env-file .env \\
                               -p 3000:3000 \\
                               ${PROJECT_NAME}:latest
                    """
                }
            }
        }
    }

    post {
        always {
            // Clean up old, untagged Docker images to save disk space
            sh 'docker image prune -f'
        }
    }
}
