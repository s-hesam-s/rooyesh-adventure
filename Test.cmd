@echo off
pushd "%~dp0"
set "gameNode=%~dp0runtime\node.exe"
if not exist "%gameNode%" set "gameNode=node"
"%gameNode%" --test tests\adventure.test.mjs tests\server.test.mjs tests\first-person.test.mjs tests\realism-assets.test.mjs tests\river-geometry.test.mjs tests\road-surface.test.mjs tests\greenhouse.test.mjs tests\landscape.test.mjs tests\stations.test.mjs tests\pickup.test.mjs tests\river-water.test.mjs tests\campaign.test.mjs tests\mission-scenes.test.mjs tests\archive-interaction.test.mjs tests\archive-doors-guide.test.mjs tests\archive-review.test.mjs tests\archive-transition-appearance.test.mjs tests\calendar-environment.test.mjs tests\workshop-environment.test.mjs tests\canal-environment.test.mjs tests\postal-environment.test.mjs tests\atrium-environment.test.mjs tests\reception-environment.test.mjs tests\orchard-environment.test.mjs tests\environment-test.test.mjs tests\payment-environment.test.mjs tests\bank-environment.test.mjs tests\audit-environment.test.mjs tests\office-workflow.test.mjs
set "testExit=%errorlevel%"
popd
pause
exit /b %testExit%