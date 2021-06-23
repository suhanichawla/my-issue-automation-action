const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    console.log("Hello world!")
    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
    const octokit =  github.getOctokit(GITHUB_TOKEN)

    const { context = {} } = github;
    const { issue } = context.payload;
    console.log("context",context)
    var bodysplit = issue.body.split('\r\n')
    console.log("issue",bodysplit)

    var rbody= removeIgnoreTaskLitsText(issue.body)
    const text = createTaskListText(rbody)
    console.log("text is", text)
    //divide into three sections
    //treat each as body and find how many are unchecked in each, or if all are checked
    // if all basic checks are checked and webhook check also, send email for financial onboarding
    await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: issue.number,
        body: text
    })
}

function removeIgnoreTaskLitsText(text) {
    return text.replace(
      /<!-- ignore-task-list-start -->[\s| ]*(- \[[x| ]\] .+[\s| ]*)+<!-- ignore-task-list-end -->/g,
      ''
    )
  }
  
function createTaskListText(body) {
    const completedTasks = body.match(/(- \[[x]\].+)/g)
    const uncompletedTasks = body.match(/(- \[[ ]\].+)/g)
  
    let text = ''
  
    if (completedTasks !== null) {
      for (let index = 0; index < completedTasks.length; index++) {
        if (index === 0) {
          text += '## :white_check_mark: Completed Tasks\n'
        }
        text += `${completedTasks[index]}\n`
      }
    }
  
    if (uncompletedTasks !== null) {
      for (let index = 0; index < uncompletedTasks.length; index++) {
        if (index === 0) {
          text += '## :x: Uncompleted Tasks\n'
        }
        text += `${uncompletedTasks[index]}\n`
      }
    }
  
    return text
  }

run()