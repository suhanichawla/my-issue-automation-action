const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    console.log("Hello world!")
    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
    const octokit =  github.getOctokit(GITHUB_TOKEN)

    const { context = {} } = github;
    const { issue } = context.payload;
    console.log("context",context)
    console.log("issue",issue)

    await octokit.issues.createComment({
        ...context.repo,
        issue_number: issue.number,
        body: 'Thank you for the issue'
    })
}

run()