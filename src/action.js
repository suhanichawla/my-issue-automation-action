const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    console.log("Hello world!")
    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
    const octokit =  github.getOctokit(GITHUB_TOKEN)

    const { context = {} } = github;
    const { issue } = context.payload;
    console.log("issue",issue.labels)
    const hasFinancialLabel= issue.labels.some(function(el) {
      return el.name === 'financial-onboarding'
    });
    if(hasFinancialLabel){
      if (context.eventName == 'issues' && (context.payload.action == 'edited' || context.payload.action == 'opened')){
        //check which case is this
        if(issue.title.includes("Onboarding Pending Verification from Draft App")){
          //draft app steps
          var bodysplit = issue.body.split('**')
          for (let i=0;i<bodysplit.length;i++){
            console.log("el at index "+i+" is "+bodysplit[i] )
          }
        }else if(issue.title.includes("Onboarding Pending Verification from Unverified App")){
          //unverified app steps
          var bodysplit = issue.body.split('**')
          for (let i=0;i<bodysplit.length;i++){
            console.log("el at index "+i+" is "+bodysplit[i] )
          }
        }
      }
    }
    // var bodysplit = issue.body.split('**')
    // console.log("issue body split")
    // for (let i=0;i<bodysplit.length;i++){
    //     console.log("el at index "+i+" is "+bodysplit[i] )
    // }
    // var basic_checks=removeIgnoreTaskLitsText(bodysplit[8])
    // var webhook_check=removeIgnoreTaskLitsText(bodysplit[10])
    // var financial_onboarding_checks=removeIgnoreTaskLitsText(bodysplit[12])

    // if(areChecksCompleted(basic_checks) && areChecksCompleted(webhook_check) && !areChecksCompleted(financial_onboarding_checks)){
    //   //check if form sent tag has already been added

    //     await octokit.rest.issues.createComment({
    //         ...context.repo,
    //         issue_number: issue.number,
    //         body: "basic checks completed"
    //     })
    // }
    
    // if(areChecksCompleted(financial_onboarding_checks)){
    //     await octokit.rest.issues.createComment({
    //         ...context.repo,
    //         issue_number: issue.number,
    //         body: "financial checks completed"
    //     })
    // }

    // var rbody= removeIgnoreTaskLitsText(issue.body)
    // const text = createTaskListText(rbody)
    //console.log("text is", text)
    //divide into three sections
    //treat each as body and find how many are unchecked in each, or if all are checked
    // if all basic checks are checked and webhook check also, send email for financial onboarding
    // await octokit.rest.issues.createComment({
    //     ...context.repo,
    //     issue_number: issue.number,
    //     body: text
    // })
}

function removeIgnoreTaskLitsText(text) {
    return text.replace(
      /<!-- ignore-task-list-start -->[\s| ]*(- \[[x| ]\] .+[\s| ]*)+<!-- ignore-task-list-end -->/g,
      ''
    )
  }
  
function areChecksCompleted(body){
    const uncompletedTasks = body.match(/(- \[[ ]\].+)/g)
    if(uncompletedTasks == null){
        return true
    }else{
        return false
    }
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