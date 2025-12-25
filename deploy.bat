@echo off
echo 🚀 Starting deployment process...

echo 📦 Building React client...
cd client
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Client build failed!
    pause
    exit /b 1
)

echo ✅ Client build successful!
cd ..

echo 📦 Installing server dependencies for deployment...
cd server
call npm install --production

if %errorlevel% neq 0 (
    echo ❌ Server dependency installation failed!
    pause
    exit /b 1
)

echo ✅ Server dependencies installed!
cd ..

echo 📦 Preparing server deployment package...
if exist deploy rmdir /s /q deploy
mkdir deploy\server
xcopy server\* deploy\server\ /e /i /h /y
copy .env.production deploy\server\.env

echo Cleaning up development files from server package...
if exist deploy\server\logs rmdir /s /q deploy\server\logs
if exist deploy\server\.env.example del deploy\server\.env.example

echo 📦 Preparing client build for S3...
mkdir deploy\client-build
xcopy client\build\* deploy\client-build\ /e /i /h /y

echo ✅ Deployment packages ready!
echo.
echo 📁 Deployment structure:
echo    deploy\server\        - Ready for EC2 (includes node_modules)
echo    deploy\client-build\  - Ready for S3 upload
echo.
echo 📋 Next steps:
echo 1. Upload deploy\client-build\* to S3 bucket for aws.milan-pokhrel.com.np
echo 2. Configure CloudFront distribution
echo 3. Upload deploy\server\* to EC2 instance
echo 4. Set up RDS database and update DATABASE_URL in .env on EC2
echo 5. Start the server on EC2: npm start (no need to run npm install)
echo.
echo 🌐 Your app will be available at:
echo    Frontend: https://aws.milan-pokhrel.com.np
echo    Backend:  https://api.milan-pokhrel.com.np
echo.
echo 💡 Server package includes node_modules to save EC2 resources
echo 💡 Client build is optimized for S3 static hosting
echo.
pause