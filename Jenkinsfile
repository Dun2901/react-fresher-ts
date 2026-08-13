pipeline {
    agent {
        label 'dev-server'
    }

    stages {
        stage('Info') {
            steps {
                sh(
                    script: '''
                        whoami
                        pwd
                        ls -la
                    ''',
                    label: 'first stage'
                )
            }
        }
    }
}
