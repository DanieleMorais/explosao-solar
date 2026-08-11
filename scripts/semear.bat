@echo off
cd /d "C:\Users\Administrator\Trabalho\Projetos\explosao-solar"
node scripts\traduzir.js >> scripts\traduzir-auto.log 2>&1
node scripts\semear.js --lote 12 --meta 100 >> scripts\semear-run.log 2>&1
