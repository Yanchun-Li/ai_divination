# Development startup script - Start both frontend and backend
# Usage: .\dev.ps1

Write-Host "Starting AI Divination dev environment..." -ForegroundColor Cyan

# Start backend (new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Backend: http://localhost:8000' -ForegroundColor Green; uv run uvicorn app.main:app --reload --port 8000"

# Wait 1 second for backend to start first
Start-Sleep -Seconds 1

# Start frontend (new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web; Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "Started 2 terminal windows:" -ForegroundColor Yellow
Write-Host "  - Backend: http://localhost:8000" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop" -ForegroundColor Gray
