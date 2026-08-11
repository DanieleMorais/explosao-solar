@echo off
cd /d "C:\Users\Administrator\Trabalho\Projetos\explosao-solar"
node scripts\backfill-noticias.js --tema colombia --meta 50 >> scripts\colombia-run.log 2>&1
