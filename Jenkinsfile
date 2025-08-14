pipeline {
    // This agent directive tells Jenkins to build the Dockerfile from the current directory
    // and run all subsequent steps inside a container based on that image.
    // This is the standard and most reliable way to build Docker-based projects.
    agent {
        dockerfile true
    }

    stages {
        // Stage 1: Install Dependencies
        // This command runs inside the container defined by your Dockerfile.
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        // Stage 2: Run Tests
        // This runs the typecheck script defined in your package.json.
        stage('Run Tests') {
            steps {
                sh 'npm run typecheck'
            }
        }

        // Stage 3: Build and Deploy
        // Since the previous stages already confirm the app builds and passes tests,
        // we can now build the production image and deploy it.
        stage('Build and Deploy') {
            steps {
                script {
                    // Use the Jenkins BUILD_NUMBER for a unique tag
                    def dockerImage = "contextual-companion:${env.BUILD_NUMBER}"
                    
                    // Build the final production image
                    sh "docker build -t ${dockerImage} ."
                    
                    // Stop and remove the existing container if it's running, ignoring errors if it doesn't exist
                    sh 'docker stop contextual-companion || true'
                    sh 'docker rm contextual-companion || true'
                    
                    // Run the new container
                    sh "docker run -d --name contextual-companion -p 3000:3000 --env-file ./.env ${dockerImage}"
                }
            }
        }
    }
    
    post {
        always {
            // Clean up dangling Docker images to save space on the Jenkins server
            sh 'docker image prune -f'
        }
    }
}
