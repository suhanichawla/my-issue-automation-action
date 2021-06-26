const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  console.log("Hello world!")
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
  const octokit =  github.getOctokit(GITHUB_TOKEN)

  const { context = {} } = github;
  const { issue } = context.payload;
  console.log("issue",issue.labels)

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
        isGoogleFormSent = hasLabel('form-sent')
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
        //if google form is already sent
        //check if form data fetched has been marked as completed
        if(check_if_task_completed(issue_text_as_array, "Financial onboarding initial data fetched.")){
          //check if accounts payable was already tagged, if not
          if(check_if_task_completed(issue_text_as_array, "@accountspayable tagged to the issue and column updated")){
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
    }else if(hasFinancialUnverifiedLabel){
      //unverified app steps
      var bodysplit = issue.body.split('**')
      var webhook_check_index = bodysplit.indexOf("WebHook Check");
      var webhook_check=removeIgnoreTaskLitsText(bodysplit[webhook_check_index - 1])
      if(areChecksCompleted(basic_checks) && areChecksCompleted(webhook_check)){
        // check mark Financial onboarding initial data fetched
        //check_form_sent(issue)
        //check if first recieved is checked, if yes tag accounts payable
      }
    }
  }
}

function hasLabel(issue, labelname){
  return issue.labels.some(function(el) {
    return el.name === labelname
  });
}

function areBasicChecksCompleted(text){
  var basic_checks_index = text.indexOf("Basic Checks");
  var basic_checks=removeIgnoreTaskLitsText(text[basic_checks_index - 1])
  return areChecksCompleted(basic_checks)
}

function areWebhookChecksCompleted(text){
  var webhook_checks_index = text.indexOf("WebHook Check");
  var webhook_checks=removeIgnoreTaskLitsText(text[webhook_checks_index - 1])
  return areChecksCompleted(webhook_checks)
}

function markFinancialOnboardingTaskAsCompleted(text, taskName){
  //"Financial onboarding initial form sent."
  var financial_onboarding_checks_index = text.indexOf("Financial Onboarding");
  var financial_onboarding_checks=text[financial_onboarding_checks_index+1].split("\r\n")
  for(let i=0;i<financial_onboarding_checks.length;i++){
    if(financial_onboarding_checks[i].includes(taskName)){
      var checkedoff_task = changeToChecked(financial_onboarding_checks[i])
      financial_onboarding_checks[i]=checkedoff_task
    }
  }
  //merge the financial onboarding list
  text[financial_onboarding_checks_index+1] = financial_onboarding_checks.join("\r\n")
  //merge the entire issue body
  text = text.join("**")
  return text
}

function removeIgnoreTaskLitsText(text) {
  return text.replace(
    /<!-- ignore-task-list-start -->[\s| ]*(- \[[x| ]\] .+[\s| ]*)+<!-- ignore-task-list-end -->/g,
    ''
  )
}

function check_if_task_completed(text, taskName){
  var financial_onboarding_checks_index = text.indexOf("Financial Onboarding");
  var financial_onboarding_checks=text[financial_onboarding_checks_index+1].split("\r\n")
  for(let i=0;i<financial_onboarding_checks.length;i++){
    if(financial_onboarding_checks[i].includes(taskName)){
      var check=removeIgnoreTaskLitsText(financial_onboarding_checks[i])
      if(areChecksCompleted(check)){
        return true
      }else{
        return false
      }
    }
  }
}

function areChecksCompleted(body){
  const uncompletedTasks = body.match(/(- \[[ ]\].+)/g)
  if(uncompletedTasks == null){
      return true
  }else{
      return false
  }
}

function changeToChecked(text){
  const isInComplete = text.match(/(- \[[ ]\].+)/g)
  if(isInComplete){
    var updated_check_item= text.replace("[ ]", "[x]")
    return updated_check_item
  }
}

run()