pipeline {
    agent {
        label 'dev-server'
    }

    environment {
        APP_NAME = 'BookStore'
        APP_TYPE = 'react'
        BUILD_SCRIPT = 'npm ci && npm run build'
    }

    stages {
        stage('Info') {
            steps {
                sh(
                    script: '''
                        whoami
                        node --version
                        npm --version
                    ''',
                    label: 'check tools'
                )
            }
        }

        stage('Build') {
            steps {
                sh(
                    script: '''
                        npm ci
                        npm run build
                        test -d dist
                    ''',
                    label: 'build React app'
                )
            }
        }
    }
}
