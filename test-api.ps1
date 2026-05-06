$base = "http://localhost:3001"
$pass = 0
$fail = 0

function Test-Endpoint {
    param($label, $method, $url, $body = $null)
    try {
        $params = @{ Uri = $url; Method = $method; ContentType = "application/json" }
        if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 5) }
        $r = Invoke-RestMethod @params
        Write-Host "  PASS  $label" -ForegroundColor Green
        $script:pass++
        return $r
    } catch {
        Write-Host "  FAIL  $label - $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++
        return $null
    }
}

Write-Host "`n=== FlowGen API Test Suite ===" -ForegroundColor Cyan

# 1. Health
Write-Host "`n[1] Health"
Test-Endpoint "GET /api/health" "GET" "$base/api/health" | Out-Null

# 2. Tasks - list
Write-Host "`n[2] Tasks"
$tasks = Test-Endpoint "GET /api/tasks" "GET" "$base/api/tasks"
Write-Host "      count: $($tasks.count)"

# 3. Tasks - get by id
Test-Endpoint "GET /api/tasks/task-001-telegram-slack" "GET" "$base/api/tasks/task-001-telegram-slack" | Out-Null

# 4. Tasks - create
$newTask = @{ name = "Test Gorevi"; description = "API test icin olusturuldu"; status = "waiting_approval" }
$created = Test-Endpoint "POST /api/tasks (create)" "POST" "$base/api/tasks" $newTask
$newId = $created.data.id

# 5. Approve
Write-Host "`n[3] Approve"
$approved = Test-Endpoint "POST /api/tasks/task-002-mail-summary/approve" "POST" "$base/api/tasks/task-002-mail-summary/approve"
if ($approved) { Write-Host "      task.status: $($approved.task.status)  |  run.status: $($approved.run.status)" }

# 6. Test endpoint
Write-Host "`n[4] Test-Task"
$testResult = Test-Endpoint "POST /api/tasks/task-001-telegram-slack/test" "POST" "$base/api/tasks/task-001-telegram-slack/test"
if ($testResult) {
    Write-Host "      overall: $($testResult.status)"
    $testResult.checks | ForEach-Object { Write-Host "        [$($_.result.ToUpper())] $($_.name)" }
}

# 7. Runs - list
Write-Host "`n[5] Runs"
$runs = Test-Endpoint "GET /api/runs" "GET" "$base/api/runs"
Write-Host "      count: $($runs.count)"

# 8. Runs - create (n8n style)
$n8nRun = @{ taskId = "task-001-telegram-slack"; status = "success"; summary = "n8n webhook testi basarili." }
$newRun = Test-Endpoint "POST /api/runs (n8n callback)" "POST" "$base/api/runs" $n8nRun
if ($newRun) { Write-Host "      runId: $($newRun.runId)  |  source: $($newRun.data.source)  |  triggeredBy: $($newRun.data.triggeredBy)" }

# 9. Runs - get by id
if ($newRun) {
    Test-Endpoint "GET /api/runs/$($newRun.runId)" "GET" "$base/api/runs/$($newRun.runId)" | Out-Null
}

# 10. 404 handling
Write-Host "`n[6] Error Handling"
Test-Endpoint "GET /api/tasks/nonexistent (expect 404)" "GET" "$base/api/tasks/nonexistent-id" | Out-Null

# 11. Cleanup - delete created task
if ($newId) {
    Test-Endpoint "DELETE /api/tasks/$newId (cleanup)" "DELETE" "$base/api/tasks/$newId" | Out-Null
}

Write-Host "`n=============================" -ForegroundColor Cyan
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "=============================" -ForegroundColor Cyan
