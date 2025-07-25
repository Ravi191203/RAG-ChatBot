pipeline {
    agent any

    environment {
        // Use the name you want for your Docker image and container
        IMAGE_NAME = 'contextual-companion'
        CONTAINER_NAME = 'contextual-companion-app'
    }

    stages {
        stage('Checkout') {
            steps {
                // Get the latest code from your repository
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${env.IMAGE_NAME}"
                    // Build the Docker image using the Dockerfile in the current directory
                    docker.build(env.IMAGE_NAME, '.')
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Deploying container: ${env.CONTAINER_NAME}"
                    
                    // Check if a container with the same name is already running
                    def existingContainer = sh(script: "docker ps -a -q -f name=${env.CONTAINER_NAME}", returnStatus: true)
                    
                    if (existingContainer == 0) {
                        echo "Stopping and removing existing container: ${env.CONTAINER_NAME}"
                        // Stop and remove the old container to avoid conflicts
                        sh "docker rm -f ${env.CONTAINER_NAME}"
                    } else {
                        echo "No existing container found. Proceeding to run a new one."
                    }

                    echo "Starting new container..."
                    // Run the new Docker container
                    // It's detached (-d), maps port 3000, and uses the .env file from the workspace
                    sh "docker run -d --name ${env.CONTAINER_NAME} --env-file .env -p 3000:3000 ${env.IMAGE_NAME}"
                }
            }
        }
    }

    post {
        always {
            // Clean up old, unused Docker images to save space
            echo 'Cleaning up old Docker images...'
            sh 'docker image prune -f'
        }
    }
}
