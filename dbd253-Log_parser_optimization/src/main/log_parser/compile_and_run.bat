@echo off
echo Compiling Evaluation...
javac evaluation/Evaluation.java
if %errorlevel% neq 0 (
    echo Compilation failed!
    exit /b %errorlevel%
)
echo Running Evaluation...
java -cp evaluation Evaluation
