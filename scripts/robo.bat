@echo off
cd /d "C:\Users\Administrator\Trabalho\Projetos\explosao-solar"
node scripts\robo-noticias.js --max 5 >> scripts\robo-run.log 2>&1
