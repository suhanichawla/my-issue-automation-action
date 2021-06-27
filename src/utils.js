export function hasLabel(issue, labelname){
    let hasLabelName = issue.labels.some(function(el) {
        return el.name === labelname
    });
    return hasLabelName
}

export function areBasicChecksCompleted(text){
    var basic_checks_index = text.indexOf("Basic Checks");
    var basic_checks=removeIgnoreTaskLitsText(text[basic_checks_index - 1])
    return areChecksCompleted(basic_checks)
}

export function areWebhookChecksCompleted(text){
    var webhook_checks_index = text.indexOf("WebHook Check");
    var webhook_checks=removeIgnoreTaskLitsText(text[webhook_checks_index - 1])
    return areChecksCompleted(webhook_checks)
}

export function markFinancialOnboardingTaskAsCompleted(text, taskName){
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

export function removeIgnoreTaskLitsText(text) {
    return text.replace(
        /<!-- ignore-task-list-start -->[\s| ]*(- \[[x| ]\] .+[\s| ]*)+<!-- ignore-task-list-end -->/g,
        ''
    )
}
  
export function checkIfTaskCompleted(text, taskName){
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
  
export function areChecksCompleted(body){
    const uncompletedTasks = body.match(/(- \[[ ]\].+)/g)
    if(uncompletedTasks == null){
        return true
    }else{
        return false
    }
}
  
export function changeToChecked(text){
    const isInComplete = text.match(/(- \[[ ]\].+)/g)
    if(isInComplete){
        var updated_check_item= text.replace("[ ]", "[x]")
        return updated_check_item
    }
}