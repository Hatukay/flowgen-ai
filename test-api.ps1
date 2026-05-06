$base = "http://localhost:3001"
$pass = 0
$fail = 0

function Test-Endpoint {
    param($label, $method, $url, $body = $null, $expectFail = $false)
    try {
        $params = @{ Uri = $url; Method = $method; ContentType = "application/json" }
        if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 20) }
        $r = Invoke-RestMethod @params
        if ($expectFail) {
            Write-Host "  FAIL  $label - expected failure but got success" -ForegroundColor Red
            $script:fail++
            return $null
        }
        Write-Host "  PASS  $label" -ForegroundColor Green
        $script:pass++
        return $r
    } catch {
        if ($expectFail) {
            Write-Host "  PASS  $label (failed as expected)" -ForegroundColor Green
            $script:pass++
            return $null
        }
        Write-Host "  FAIL  $label - $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++
        return $null
    }
}

Write-Host "`n=== AI FlowOps API Test Suite ===" -ForegroundColor Cyan

Test-Endpoint "GET /api/health" "GET" "$base/api/health" | Out-Null

$tasks = Test-Endpoint "GET /api/tasks" "GET" "$base/api/tasks"
if ($tasks) { Write-Host "      tasks: $($tasks.count)" }

$chat = Test-Endpoint "POST /api/chat" "POST" "$base/api/chat" @{
    message = "Telegramdan gelen sikayet mesajlarini Discord destek kanalina gonder."
}
$taskId = $chat.task.id
if ($chat) { Write-Host "      task: $taskId | status: $($chat.task.status)" }

$approved = Test-Endpoint "POST /api/tasks/:id/approve" "POST" "$base/api/tasks/$taskId/approve"
if ($approved) { Write-Host "      approved: $($approved.task.status)" }

$testResult = Test-Endpoint "POST /api/test-task/:id" "POST" "$base/api/test-task/$taskId"
if ($testResult) {
    Write-Host "      task test: $($testResult.status)"
}

$telegramEvent = @{
    event = @{
        eventId = "telegram_demo_1"
        platform = "telegram"
        eventType = "message.created"
        direction = "inbound"
        conversationId = "demo_chat"
        senderId = "demo_user"
        senderName = "Demo User"
        text = "Kargom 3 gundur gelmedi, destek istiyorum."
        subject = $null
        timestamp = "2026-05-06T13:00:00Z"
        raw = @{}
    }
}
$decision = Test-Endpoint "POST /api/agent/evaluate-event telegram" "POST" "$base/api/agent/evaluate-event" $telegramEvent
if ($decision) {
    Write-Host "      matched: $($decision.matched) | action: $($decision.action.platform)"
}

$badEvent = @{ event = @{ platform = "teams"; text = "" } }
Test-Endpoint "POST /api/agent/evaluate-event invalid" "POST" "$base/api/agent/evaluate-event" $badEvent $true | Out-Null

$run = Test-Endpoint "POST /api/runs" "POST" "$base/api/runs" @{
    taskId = $taskId
    eventId = "telegram_demo_1"
    status = "success"
    platform = "telegram"
    actionPlatform = "discord"
    confidence = 0.91
    summary = "Discord mesaji gonderildi."
    reason = "n8n action basarili."
    details = @{}
}
if ($run) { Write-Host "      runId: $($run.runId)" }

$runs = Test-Endpoint "GET /api/runs" "GET" "$base/api/runs"
if ($runs) { Write-Host "      runs: $($runs.count)" }

Write-Host "`n=============================" -ForegroundColor Cyan
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "=============================" -ForegroundColor Cyan

if ($fail -gt 0) { exit 1 }
