@echo off
cd /d "C:\Users\Administrator\Trabalho\Projetos\explosao-solar"
node scripts\robo-tendencias.js --max 5 >> scripts\tendencias-run.log 2>&1
