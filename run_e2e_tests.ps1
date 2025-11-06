<#
run_e2e_tests.ps1

PowerShell script to run quick E2E checks and save outputs to ./screenshots/

Usage (from backend folder):
  powershell -ExecutionPolicy Bypass -File .\run_e2e_tests.ps1 -ImagePath "C:\path\to\sample.jpg"

This script performs:
  - create screenshots folder
  - backend health check -> screenshots/backend_health.json
  - model health check -> screenshots/model_health.json
  - text predict (via backend) -> screenshots/predict_text_response.json
  - image predict (via model) -> screenshots/predict_image_response.json (uses curl.exe)
  - login (seed user) -> screenshots/login_response.json
  - create disposal -> screenshots/create_disposal_response.json
  - request pickup -> screenshots/request_pickup_response.json
  - final listing of saved artifacts
#>

param(
    [string]$BackendUrl = 'http://localhost:5000',
    [string]$ModelUrl = 'http://localhost:8000',
    [string]$ImagePath = "$PSScriptRoot\sample_image.jpg"
)

Set-StrictMode -Version Latest

function Save-Json {
    param($Object, $Path)
    try {
        $Object | ConvertTo-Json -Depth 8 | Out-File -FilePath $Path -Encoding utf8
        Write-Host "Saved: $Path"
    } catch {
        Write-Warning "Failed to save $Path : $_"
    }
}

Push-Location $PSScriptRoot
New-Item -ItemType Directory -Path .\screenshots -Force | Out-Null

Write-Host "1) Backend health check -> $BackendUrl/api/health"
try {
    $backendHealth = Invoke-RestMethod -Uri "$BackendUrl/api/health" -Method GET -ErrorAction Stop
    Save-Json $backendHealth '.\screenshots\backend_health.json'
} catch {
    Write-Warning "Backend health check failed: $_"
    "$_" | Out-File -FilePath .\screenshots\backend_health_error.txt -Encoding utf8
}

Write-Host "2) Model health check -> $ModelUrl/api/health"
try {
    $modelHealth = Invoke-RestMethod -Uri "$ModelUrl/api/health" -Method GET -ErrorAction Stop
    Save-Json $modelHealth '.\screenshots\model_health.json'
} catch {
    Write-Warning "Model health check failed: $_"
    "$_" | Out-File -FilePath .\screenshots\model_health_error.txt -Encoding utf8
}

Write-Host "3) Text prediction (via backend)"
$textBody = @{ generic_name = 'Paracetamol'; brand_name = 'Panadol'; dosage_form = 'tablet'; packaging_type = 'box' } | ConvertTo-Json
try {
    $predictText = Invoke-RestMethod -Uri "$BackendUrl/api/medicines/predict/text" -Method POST -ContentType 'application/json' -Body $textBody -ErrorAction Stop
    Save-Json $predictText '.\screenshots\predict_text_response.json'
} catch {
    Write-Warning "Text predict (backend) failed: $_"
    "$_" | Out-File -FilePath .\screenshots\predict_text_error.txt -Encoding utf8
}

Write-Host "4) Image prediction (model endpoint)"
if (Test-Path $ImagePath) {
    try {
        # Use curl.exe for multipart file upload and save output to file
        $outPath = '.\screenshots\predict_image_response.json'
        & curl.exe -s -S -F "image=@$ImagePath" "$ModelUrl/api/predict/image" -o $outPath
        if (Test-Path $outPath) { Write-Host "Saved image predict response -> $outPath" } else { Write-Warning "Image predict did not produce output" }
    } catch {
        Write-Warning "Image predict failed: $_"
        "$_" | Out-File -FilePath .\screenshots\predict_image_error.txt -Encoding utf8
    }
} else {
    Write-Warning "Image file not found: $ImagePath — skipping image predict. Place an image at that path or pass -ImagePath to the script."
}

Write-Host "5) Login (seed user)"
try {
    $loginBody = @{ email = 'jean.baptiste@email.com'; password = 'password123' } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -ContentType 'application/json' -Body $loginBody -ErrorAction Stop
    Save-Json $auth '.\screenshots\login_response.json'
    $token = $auth.data.token
    if (-not $token) { Write-Warning 'No token returned from login'; }
} catch {
    Write-Warning "Login failed: $_"
    "$_" | Out-File -FilePath .\screenshots\login_error.txt -Encoding utf8
}

if ($token) {
    $headers = @{ Authorization = "Bearer $token" }

    Write-Host "6) Create disposal"
    $createBody = @{ genericName = 'Paracetamol'; brandName = 'Panadol'; dosageForm = 'tablet'; packagingType = 'box'; predictedCategory = 'Analgesic'; riskLevel = 'LOW' } | ConvertTo-Json
    try {
        $create = Invoke-RestMethod -Uri "$BackendUrl/api/disposals" -Method POST -Headers $headers -ContentType 'application/json' -Body $createBody -ErrorAction Stop
        Save-Json $create '.\screenshots\create_disposal_response.json'
    } catch {
        Write-Warning "Create disposal failed: $_"
        "$_" | Out-File -FilePath .\screenshots\create_disposal_error.txt -Encoding utf8
    }

    if ($create -and $create.data.id) {
        $disposalId = $create.data.id
        Write-Host "7) Request pickup for disposal id $disposalId"
        $requestBody = @{ preferredTime = (Get-Date).ToString('o'); reason = 'Unsafe medication' } | ConvertTo-Json
        try {
            $req = Invoke-RestMethod -Uri "$BackendUrl/api/disposals/$disposalId/request-pickup" -Method POST -Headers $headers -ContentType 'application/json' -Body $requestBody -ErrorAction Stop
            Save-Json $req '.\screenshots\request_pickup_response.json'
        } catch {
            Write-Warning "Request pickup failed: $_"
            "$_" | Out-File -FilePath .\screenshots\request_pickup_error.txt -Encoding utf8
        }
    } else {
        Write-Warning "No disposal id available to request pickup"
    }
} else {
    Write-Warning "No auth token — skipping create disposal and pickup steps"
}

Write-Host "
Run complete. Saved artifacts in .\screenshots\"
Get-ChildItem -Path .\screenshots | Format-Table Name,Length

Pop-Location
