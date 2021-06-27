const core = require('@actions/core');
const github = require('@actions/github');
import {hasLabel, areBasicChecksCompleted, areWebhookChecksCompleted, markFinancialOnboardingTaskAsCompleted, removeIgnoreTaskLitsText, checkIfTaskCompleted, areChecksCompleted} from './utils'

async function run() {
  console.log("Hello world!")
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
  const octokit =  github.getOctokit(GITHUB_TOKEN)

  const { context = {} } = github;
  const { issue } = context.payload;
  console.log("issue",issue)

  const hasFinancialUnverifiedLabel= hasLabel(issue, 'financial-onboarding-unverified')
  const hasFinancialDraftLabel= hasLabel(issue, 'financial-onboarding-draft')

  if (context.eventName == 'issues' && (context.payload.action == 'edited' || context.payload.action == 'opened')){
    if(hasFinancialDraftLabel || hasFinancialUnverifiedLabel){
      //check if all checks are marked as completed
      var issueBody=removeIgnoreTaskLitsText(issue.body)
      if(areChecksCompleted(issueBody)){
        //close the issue
        await octokit.rest.issues.update({
          ...context.repo,
          issue_number: issue.number,
          state: 'closed'
        })
      }
    }
    if(hasFinancialDraftLabel){
      //draft app steps
      var issue_text_as_array = issue.body.split('**')
      //check if basic checks and webhook checks are completed
      if(areBasicChecksCompleted(issue_text_as_array) && areWebhookChecksCompleted(issue_text_as_array)){
        //check if google form label is sent
        isGoogleFormSent = hasLabel(issue, 'form-sent')
        //if google form is not sent
        if(!isGoogleFormSent){
          //send email with google form here
          //add form-sent label 
          octokit.rest.issues.addLabels({
            ...context.repo,
            issue_number: issue.number,
            labels: ["form-sent"]
          })
          // mark form sent as completed
          let updated_body_with_form_sent_checked = markFinancialOnboardingTaskAsCompleted(issue_text_as_array, "Financial onboarding initial form sent.")
          await octokit.rest.issues.update({
            ...context.repo,
            issue_number: issue.number,
            body: updated_body_with_form_sent_checked,
          });
        }
        performRemainingFinancialOnboardingSteps(issue, octokit, context)
      }
    }else if(hasFinancialUnverifiedLabel){
      //unverified app steps
      var issue_text_as_array = issue.body.split('**')
      if(areWebhookChecksCompleted(issue_text_as_array)){
        performRemainingFinancialOnboardingSteps(issue, octokit, octokit)
      }
    }
  }
}

async function performRemainingFinancialOnboardingSteps(issue, octokit, context){
  let issue_text_as_array = issue.body.split('**')
  //if google form is already sent
  //check if form data fetched has been marked as completed
  if(checkIfTaskCompleted(issue_text_as_array, "Financial onboarding initial data fetched.")){
    //check if accounts payable was already tagged, if not
    if(checkIfTaskCompleted(issue_text_as_array, "@accountspayable tagged to the issue and column updated")){
      return
    }else{
        //tag accounts payable
        await octokit.rest.issues.createComment({
          ...context.repo,
          issue_number: issue.number,
          body: "tagging @suhanichawla"
        })
        //check the tick which says accounts payable has been tagged
        var updated_body_two= markFinancialOnboardingTaskAsCompleted(issue_text_as_array, "@accountspayable tagged to the issue and column updated")
        await octokit.rest.issues.update({
          ...context.repo,
          issue_number: issue.number,
          body: updated_body_two,
        });
    }
  }  
}

run()