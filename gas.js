/**
 * メインプログラム
 * GASではこの関数を呼び出して下さい。
 */
function BacklogPolice() {
    let response = fetchBacklogIssues();
    //console.log(response.length);
    postChatwork(JSON.parse(response));
}
  
let backlogNamespace = 'XXXXX';//Backlogのドメインを入れて下さい。
let backlogUrl = 'https://' + backlogNamespace + '.backlog.jp/';

/**
 * Backlogから本日を含めて、期限切れになっている課題を検索する
 */
function fetchBacklogIssues() {
    let baseUrl = backlogUrl + 'api/v2/issues';
    let apiKey = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'//BacklogのAPIキーを入れて下さい（個人設定／APIから確認できます。）
    // 取得対象のプロジェクトIDのリストを指定
    let projectIds = [XXXXX];//対象のプロジェクトIDを入れて下さい（プロジェクト設定を開くとURLパラメータから確認できます。[project.id=XXXXX]）
    let statusIds = [0, 1, 2, 3];
    let sysdate = new Date();
    sysdate.setDate(sysdate.getDate());
    let params = {
        'apiKey': apiKey,
        'dueDateUntil': formatDate(sysdate)
    };
    for (let i = 0; i < projectIds.length; i++) {
        params['projectId[' + i + ']'] = projectIds[i];
    }
    for (let i = 0; i < statusIds.length; i++) {
        params['statusId[' + i + ']'] = statusIds[i];
    }  
    let paramString = '';
    for (let key in params) {
        if (0 < paramString.length) {
            paramString += '&';
        }
        paramString += key + '=' + params[key];
    }
    //  paramString += '&sort=assignee&dueDate&order=true';//期限日順
    paramString += '&sort=assignee';//担当者順

    return UrlFetchApp.fetch(baseUrl + '?' + paramString);
}

/**
 * Chatworkにメッセージを送信します。
 * @param {*} issues 
 */
function postChatwork(issues) {
    if (issues.length <= 0) {
        return;
    }
    //console.log(issues.length);
    let token = 'XXXXXXXXXXXXXXXXXXXXXXXXX'; // ここにトークンを入力してください
    let roomId = 'XXXXXXXXXX'; // ここに投稿したい部屋のIDを入力してください
    let subject = 'Backlogタスクの期限が本日までもしくは期限切れになっています！速やかにタスクを処理するか、期限日を調整してください。'//この辺はご自由に
    let body  = '[info][title]' + subject + '[/title]' + createPostMessage(issues) + '[/info]';
    let payload = {
        'body': body
    }
    let headers = {
        'X-ChatWorkToken': token
    }
    let options = {
        'method' : 'POST',
        'payload' : payload,
        'headers' : headers
    }
    let url = 'https://api.chatwork.com/v2/rooms/' + roomId + '/messages';
    UrlFetchApp.fetch(url, options);
}

/**
 * Chatworkに送信するメッセージを生成します
 * @param {*} issues 
 */
function createPostMessage(issues) {
    let message = '';
    for (let i = 0; i < issues.length; i++) {
        let issue = issues[i];
        message += formatDate(new Date(issue.dueDate)) + ', ';
        message += issue.assignee.name + ', ';
        message += '[' + issue.status.name + '], ';
        message += issue.summary+ ', ';
        message += backlogUrl + 'view/' + issue.issueKey   + '\n[hr]\n';
    }
    return message;
}

/**
 * 日付フォーマット
 * @param {*} date 
 */
function formatDate(date) {
    let format = 'YYYY-MM-DD';
    format = format.replace(/YYYY/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
    return format;
}