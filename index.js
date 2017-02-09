var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var GitHub = require('github-api');

// basic auth
var gh = new GitHub({
   token: process.env.GITHUB_API_TOKEN
});

app.set('port', (process.env.PORT || 5000));

//support parsing of application/json type post data
app.use(bodyParser.json());

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

app.post('/pull_req', receive_pull_request);


function receive_pull_request(request, response) {
    console.log('Received pull request: \n' + request.body);
    response.send();
    extractedPrDetails = extractRelevantDetails(request);
    if (isPullRequestToCheck(extractedPrDetails) &&
        !isValidPullRequestTitle(extractedPrDetails)) {
        commentOnPullRequest(extractedPrDetails.repo, extractedPrDetails.id,
                             'Hi @' + extractedPrDetails.username +
                             ', ' + process.env.MESSAGE_TO_USER_TITLE);
        console.log('Message to user: ' + process.env.MESSAGE_TO_USER_TITLE);
        console.log('Check Failed!');

    }
}

function extractRelevantDetails(received_json) {
    repo = received_json.body.pull_request.base.repo.full_name;
    action = received_json.body.action;
    title = received_json.body.pull_request.title;
    body = received_json.body.pull_request.body;
    username = received_json.body.pull_request.user.login;
    id = received_json.body.pull_request.number;
    console.log('Received PR ' + id + ' "' + title + '" from: ' + username +
                '\n Description: "' + body + '"');
    return {repo : repo, id : id, title : title, body : body,
            username : username, action : action};
}

function isPullRequestToCheck(prDetails) {
    return prDetails.action == 'opened' || prDetails.action == 'edited' ||
           prDetails.action == 'reopened' || prDetails.action == 'review_requested';
}

function isValidPullRequest(prDetails) {
    return isValidPullRequestTitle(prDetails.title) && isValidPullRequestBody(prDetails.body);
}

function isValidPullRequestTitle(prTitle) {
    titleTest = new RegExp(process.env.REGEX_PULL_REQ_TITLE);
    console.log('Regex for title: ' + process.env.REGEX_PULL_REQ_TITLE);
    return titleTest.test(prTitle);
}

function isValidPullRequestBody(prBody) {
    bodyTest = new RegExp(process.env.REGEX_PULL_REQ_BODY);
    console.log('Regex for body: ' + process.env.REGEX_PULL_REQ_BODY);
    return bodyTest.test(prBody);
}

function commentOnPullRequest(repo, id, comment) {
    repoNameSplit = repo.split('/');
    issueObj = gh.getIssues(repoNameSplit[0], repoNameSplit[1]);
    issueObj.createIssueComment(id, comment);
}
