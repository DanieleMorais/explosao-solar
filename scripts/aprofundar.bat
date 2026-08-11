@echo off
cd /d "C:\Users\Administrator\Trabalho\Projetos\explosao-solar"
node scripts\enriquecer.js --piso 2000 --limite 6 --aplicar >> scripts\aprofundar-run.log 2>&1
node scripts\corrigir-forma.js --aplicar --limite 15 >> scripts\corrigir-run.log 2>&1
