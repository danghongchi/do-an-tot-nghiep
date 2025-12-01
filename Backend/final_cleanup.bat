@echo off
echo Final cleanup and migration...

echo.
echo Step 1: Backup old server.js
if exist server.js (
    copy server.js server_old_final.js
    echo Old server.js backed up as server_old_final.js
)

echo.
echo Step 2: Replace with new server structure
if exist server_new.js (
    move server_new.js server.js
    echo server_new.js moved to server.js
) else (
    echo server_new.js not found
)

echo.
echo Step 3: Verify all routes are present
echo Checking routes...
if exist routes\auth.js (
    echo ✓ routes/auth.js
) else (
    echo ✗ routes/auth.js missing
)

if exist routes\counselor.js (
    echo ✓ routes/counselor.js
) else (
    echo ✗ routes/counselor.js missing
)

if exist routes\admin.js (
    echo ✓ routes/admin.js
) else (
    echo ✗ routes/admin.js missing
)

if exist routes\appointment.js (
    echo ✓ routes/appointment.js
) else (
    echo ✗ routes/appointment.js missing
)

if exist routes\chat.js (
    echo ✓ routes/chat.js
) else (
    echo ✗ routes/chat.js missing
)

if exist routes\ai.js (
    echo ✓ routes/ai.js
) else (
    echo ✗ routes/ai.js missing
)

if exist routes\specialties.js (
    echo ✓ routes/specialties.js
) else (
    echo ✗ routes/specialties.js missing
)

if exist routes\counselorApplications.js (
    echo ✓ routes/counselorApplications.js
) else (
    echo ✗ routes/counselorApplications.js missing
)

if exist routes\patient.js (
    echo ✓ routes/patient.js
) else (
    echo ✗ routes/patient.js missing
)

echo.
echo Step 4: Verify controllers
if exist controllers\authController.js (
    echo ✓ controllers/authController.js
) else (
    echo ✗ controllers/authController.js missing
)

if exist controllers\counselorController.js (
    echo ✓ controllers/counselorController.js
) else (
    echo ✗ controllers/counselorController.js missing
)

if exist controllers\adminController.js (
    echo ✓ controllers/adminController.js
) else (
    echo ✗ controllers/adminController.js missing
)

if exist controllers\appointmentController.js (
    echo ✓ controllers/appointmentController.js
) else (
    echo ✗ controllers/appointmentController.js missing
)

if exist controllers\chatController.js (
    echo ✓ controllers/chatController.js
) else (
    echo ✗ controllers/chatController.js missing
)

if exist controllers\aiController.js (
    echo ✓ controllers/aiController.js
) else (
    echo ✗ controllers/aiController.js missing
)

echo.
echo Step 5: Verify services
if exist services\emailService.js (
    echo ✓ services/emailService.js
) else (
    echo ✗ services/emailService.js missing
)

if exist services\aiService.js (
    echo ✓ services/aiService.js
) else (
    echo ✗ services/aiService.js missing
)

if exist services\socketService.js (
    echo ✓ services/socketService.js
) else (
    echo ✗ services/socketService.js missing
)

echo.
echo Step 6: Verify config
if exist config\database.js (
    echo ✓ config/database.js
) else (
    echo ✗ config/database.js missing
)

if exist config\index.js (
    echo ✓ config/index.js
) else (
    echo ✗ config/index.js missing
)

if exist config\multer.js (
    echo ✓ config/multer.js
) else (
    echo ✗ config/multer.js missing
)

if exist config\socket.js (
    echo ✓ config/socket.js
) else (
    echo ✗ config/socket.js missing
)

echo.
echo Step 7: Verify middleware
if exist middleware\auth.js (
    echo ✓ middleware/auth.js
) else (
    echo ✗ middleware/auth.js missing
)

if exist middleware\errorHandler.js (
    echo ✓ middleware/errorHandler.js
) else (
    echo ✗ middleware/errorHandler.js missing
)

echo.
echo Step 8: Verify utils
if exist utils\helpers.js (
    echo ✓ utils/helpers.js
) else (
    echo ✗ utils/helpers.js missing
)

if exist utils\constants.js (
    echo ✓ utils/constants.js
) else (
    echo ✗ utils/constants.js missing
)

echo.
echo Migration completed!
echo.
echo All routes available:
echo - /api/auth/* (authentication)
echo - /api/counselors/* (counselor management)
echo - /api/admin/* (admin management)
echo - /api/appointments/* (appointment booking)
echo - /api/patient/* (patient specific)
echo - /api/* (anonymous chat)
echo - /api/ai/* (AI advisor)
echo - /api/specialties (public specialties)
echo - /api/counselor-applications (counselor applications)
echo - /api/health (health check)
echo.
echo To start the server:
echo   npm start
echo   or
echo   node server.js
echo.
echo To revert to old server:
echo   move server.js server_new.js
echo   move server_old_final.js server.js
echo.
pause












