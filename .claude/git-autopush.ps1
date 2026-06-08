$projectDir = "C:\Users\97254\Desktop\דונה - ערכת התחלה\תוצרים מוגמרים\CRM\CRM הלל מאן"
Set-Location $projectDir

git add .

$diff = git diff --cached --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "auto: claude session $timestamp"
    git push origin main
    Write-Host "Pushed to GitHub"
} else {
    Write-Host "Nothing to push"
}
