# Generate a secure JWT secret
function Generate-JWTSecret {
    # Generate a 64-character random string using cryptographically secure methods
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    return $secret
}

# Main deployment helper script
Write-Host "🚀 Render Deployment Helper" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate JWT Secret
Write-Host "Step 1: Generating JWT Secret..." -ForegroundColor Green
$jwtSecret = Generate-JWTSecret
Write-Host "✅ JWT Secret generated:" -ForegroundColor Green
Write-Host "   $jwtSecret" -ForegroundColor Yellow
Write-Host ""

# Step 2: Show environment variables needed
Write-Host "Step 2: Environment Variables Needed" -ForegroundColor Green
Write-Host ""
Write-Host "📋 BACKEND Environment Variables:" -ForegroundColor Cyan
Write-Host "   DATABASE_URL=postgresql://user:password@host:5432/dbname" -ForegroundColor Yellow
Write-Host "   JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
Write-Host "   CORS_ORIGIN=https://your-frontend.onrender.com" -ForegroundColor Yellow
Write-Host "   NODE_ENV=production" -ForegroundColor Yellow
Write-Host "   PORT=3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 FRONTEND Environment Variables:" -ForegroundColor Cyan
Write-Host "   VITE_API_BASE_URL=https://your-backend.onrender.com/api" -ForegroundColor Yellow
Write-Host ""

# Step 3: Verify builds
Write-Host "Step 3: Verifying builds..." -ForegroundColor Green
Write-Host ""

$backendBuildSuccess = $false
$frontendBuildSuccess = $false

try {
    Write-Host "  Testing backend build..." -ForegroundColor Cyan
    Push-Location "backend"
    $output = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Backend build successful" -ForegroundColor Green
        $backendBuildSuccess = $true
    } else {
        Write-Host "  ❌ Backend build failed" -ForegroundColor Red
    }
    Pop-Location
} catch {
    Write-Host "  ❌ Error testing backend: $_" -ForegroundColor Red
}

try {
    Write-Host "  Testing frontend build..." -ForegroundColor Cyan
    Push-Location "frontend"
    $output = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Frontend build successful" -ForegroundColor Green
        $frontendBuildSuccess = $true
    } else {
        Write-Host "  ❌ Frontend build failed" -ForegroundColor Red
    }
    Pop-Location
} catch {
    Write-Host "  ❌ Error testing frontend: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Deployment Instructions" -ForegroundColor Green
Write-Host ""

if ($backendBuildSuccess -and $frontendBuildSuccess) {
    Write-Host "✅ All builds verified successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps to deploy on Render:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Push your code to GitHub (main branch)" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m 'Prepare for Render deployment'" -ForegroundColor Gray
    Write-Host "   git push origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Go to https://dashboard.render.com/" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Deploy Backend (Web Service):" -ForegroundColor Cyan
    Write-Host "   a) Click 'New +' → 'Web Service'" -ForegroundColor White
    Write-Host "   b) Connect your GitHub repository" -ForegroundColor White
    Write-Host "   c) Root Directory: backend" -ForegroundColor White
    Write-Host "   d) Build Command: npm install --legacy-peer-deps && npx prisma generate && npx prisma migrate deploy" -ForegroundColor White
    Write-Host "   e) Start Command: npm start" -ForegroundColor White
    Write-Host "   f) Add these environment variables:" -ForegroundColor White
    Write-Host "      - DATABASE_URL (from your PostgreSQL)" -ForegroundColor Gray
    Write-Host "      - JWT_SECRET=$jwtSecret" -ForegroundColor Gray
    Write-Host "      - NODE_ENV=production" -ForegroundColor Gray
    Write-Host "   g) Click 'Create Web Service' and wait for deployment" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Deploy Frontend (Static Site):" -ForegroundColor Cyan
    Write-Host "   a) Click 'New +' → 'Static Site'" -ForegroundColor White
    Write-Host "   b) Connect your GitHub repository" -ForegroundColor White
    Write-Host "   c) Root Directory: frontend" -ForegroundColor White
    Write-Host "   d) Build Command: npm install && npm run build" -ForegroundColor White
    Write-Host "   e) Publish Directory: dist" -ForegroundColor White
    Write-Host "   f) Add environment variable:" -ForegroundColor White
    Write-Host "      - VITE_API_BASE_URL=<your-backend-url>/api" -ForegroundColor Gray
    Write-Host "   g) Click 'Create Static Site' and wait for deployment" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Update Backend CORS:" -ForegroundColor Cyan
    Write-Host "   a) Go to backend service settings" -ForegroundColor White
    Write-Host "   b) Add CORS_ORIGIN=<your-frontend-url>" -ForegroundColor White
    Write-Host "   c) Render will auto-redeploy" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some builds failed. Please fix the errors above before deploying." -ForegroundColor Red
}

Write-Host ""
Write-Host "📚 For more details, see DEPLOYMENT_CHECKLIST.md" -ForegroundColor Cyan
Write-Host ""
