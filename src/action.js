const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  console.log("Hello world!")
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
  const octokit =  github.getOctokit(GITHUB_TOKEN)

  const { context = {} } = github;
  const { issue } = context.payload;
  console.log("issue",issue.labels)
  console.log("calling func check form")
  const hasFinancialLabel= issue.labels.some(function(el) {
    return el.name === 'financial-onboarding'
  });
  if(hasFinancialLabel){
    if (context.eventName == 'issues' && (context.payload.action == 'edited' || context.payload.action == 'opened')){
      //check if all tasks are completed, close the issue
      var issueBody=removeIgnoreTaskLitsText(issue.body)
      if(areChecksCompleted(issueBody)){
        //close the issue
        await octokit.rest.issues.update({
          ...context.repo,
          issue_number: issue.number,
          state: 'closed'
        })
      }else{
        //check which case is this
        if(issue.title.includes("Onboarding Pending Verification from Draft App")){
          //draft app steps
          var bodysplit = issue.body.split('**')
          var basic_checks_index = bodysplit.indexOf("Basic Checks");
          var webhook_check_index = bodysplit.indexOf("WebHook Check");
          var basic_checks=removeIgnoreTaskLitsText(bodysplit[basic_checks_index - 1])
          var webhook_check=removeIgnoreTaskLitsText(bodysplit[webhook_check_index - 1])
          if(areChecksCompleted(basic_checks) && areChecksCompleted(webhook_check)){
            //check if google form label is sent
            isGoogleFormSent = issue.labels.some(function(el) {
              return el.name === 'form-sent'
            });
            if(!isGoogleFormSent){
              //send email with google form here
              //add label
              octokit.rest.issues.addLabels({
                ...context.repo,
                issue_number: issue.number,
                labels: ["form-sent"]
              })
              //tick the form sent check
              // check_form_sent(issue)
              var updated_body = check_form_sent(issue)
              await octokit.rest.issues.update({
                ...context.repo,
                issue_number: issue.number,
                body: updated_body,
              });
            }
            //now also tag account payable
          //   await octokit.rest.issues.createComment({
          //     ...context.repo,
          //     issue_number: issue.number,
          //     body: "tagging @suhanichawla and @accountpayable"
          // })
            //check if first recieved is checked, if yes tag accounts payable
            if(check_if_form_data_fetched(issue)){
              //check if accounts payable was already tagged, if not
              if(check_if_accouts_payable_is_tagged_check(issue)){
                return
              }else{
                  //tag accounts payable
                  await octokit.rest.issues.createComment({
                    ...context.repo,
                    issue_number: issue.number,
                    body: "tagging @suhanichawla"
                  })
                  //check the tick which says accounts payable has been tagged
                  var updated_body_two= check_mark_accounts_payable(issue)
                  await octokit.rest.issues.update({
                    ...context.repo,
                    issue_number: issue.number,
                    body: updated_body_two,
                  });
                  console.log("just printing issue", issue)

              }
            }
            
          }
        }else if(issue.title.includes("Onboarding Pending Verification from Unverified App")){
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
  }
}

function check_mark_accounts_payable(issue){
  var bodysplit = issue.body.split('**')
  console.log("bodysplit",bodysplit)
  var financial_onboarding_checks_index = bodysplit.indexOf("Financial Onboarding");
  var eachcheck=bodysplit[financial_onboarding_checks_index+1].split("\r\n")
  console.log("eachcheck", eachcheck)
  for(let i=0;i<eachcheck.length;i++){
    if(eachcheck[i].includes("@accountspayable tagged to the issue and column updated")){
      var checkedoff = changeToChecked(eachcheck[i])
      eachcheck[i]=checkedoff
    }
  }
  //merge the financial onboarding list
  bodysplit[financial_onboarding_checks_index+1] = eachcheck.join("\r\n")
  //merge the entire body

  bodysplit = bodysplit.join("**")
  console.log("joined issue body",bodysplit)
  return bodysplit

}

function check_if_accouts_payable_is_tagged_check(issue){
  var bodysplit = issue.body.split('**')
  // console.log("bodysplit",bodysplit)
  var financial_onboarding_checks_index = bodysplit.indexOf("Financial Onboarding");
  var eachcheck=bodysplit[financial_onboarding_checks_index+1].split("\r\n")
  // console.log("eachcheck", eachcheck)
  for(let i=0;i<eachcheck.length;i++){
    if(eachcheck[i].includes("@accountspayable tagged to the issue and column updated")){
      var check=removeIgnoreTaskLitsText(eachcheck[i])
      if(areChecksCompleted(check)){
        return true
      }else{
        return false
      }
    }
  }
}

function removeIgnoreTaskLitsText(text) {
    return text.replace(
      /<!-- ignore-task-list-start -->[\s| ]*(- \[[x| ]\] .+[\s| ]*)+<!-- ignore-task-list-end -->/g,
      ''
    )
  }

function check_if_form_data_fetched(issue){
  var bodysplit = issue.body.split('**')
  // console.log("bodysplit",bodysplit)
  var financial_onboarding_checks_index = bodysplit.indexOf("Financial Onboarding");
  var eachcheck=bodysplit[financial_onboarding_checks_index+1].split("\r\n")
  // console.log("eachcheck", eachcheck)
  for(let i=0;i<eachcheck.length;i++){
    if(eachcheck[i].includes("Financial onboarding initial data fetched.")){
      var check=removeIgnoreTaskLitsText(eachcheck[i])
      if(areChecksCompleted(check)){
        return true
      }else{
        return false
      }
    }
  }
}
  

  function check_form_sent(issue){
    var bodysplit = issue.body.split('**')
    console.log("bodysplit",bodysplit)
    var financial_onboarding_checks_index = bodysplit.indexOf("Financial Onboarding");
    var eachcheck=bodysplit[financial_onboarding_checks_index+1].split("\r\n")
    console.log("eachcheck", eachcheck)
    for(let i=0;i<eachcheck.length;i++){
      if(eachcheck[i].includes("Financial onboarding initial form sent.")){
        var checkedoff = changeToChecked(eachcheck[i])
        eachcheck[i]=checkedoff
      }
    }
    //merge the financial onboarding list
    bodysplit[financial_onboarding_checks_index+1] = eachcheck.join("\r\n")
    //merge the entire body

    bodysplit = bodysplit.join("**")
    console.log("joined issue body",bodysplit)
    return bodysplit

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
    var newtext= text.replace("[ ]", "[x]")
    console.log("newtext",newtext)
    return newtext
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