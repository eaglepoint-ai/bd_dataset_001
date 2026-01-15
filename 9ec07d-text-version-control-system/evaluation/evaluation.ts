import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';

// Helper to check if port is open
function checkPortHelper(port: number, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
        const start = Date.now();
        
        const check = () => {
            const socket = new net.Socket();
            socket.setTimeout(500);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                retry();
            });
            
            socket.on('error', () => {
                socket.destroy();
                retry();
            });
            
            socket.connect(port, 'localhost');
        };

        const retry = () => {
            if (Date.now() - start < timeoutMs) {
                setTimeout(check, 500);
            } else {
                resolve(false);
            }
        };

        check();
    });
}

async function runEvaluator() {
    const REPO_DIR = path.resolve(__dirname, '../repository_after');
    const REPORT_FILE = path.join(__dirname, 'report.json');

    console.log("Starting Evaluation...");
    
    // 1. Start Server
    console.log("Launching Next.js server...");
    const server = spawn('npm', ['run', 'dev'], { 
        cwd: REPO_DIR,
        stdio: 'ignore', // Ignore output to clean logs
        shell: true 
    });

    // Ensure we kill the server on exit
    const cleanup = () => {
        console.log("Stopping server...");
        // This is a rough kill, might leave orphan if not careful, but okay for container
        if (process.platform === 'win32') {
             exec(`taskkill /pid ${server.pid} /T /F`);
        } else {
             server.kill('SIGTERM'); 
             // If shell=true on linux, we might need to kill the process group, 
             // but 'node:alpine' usually handles pid 1 or plain kill reasonably well for dev.
             // Actually, since we spawned with shell=true, server.pid is the shell.
             try {
                 process.kill(-server.pid!, 'SIGTERM');
             } catch(e) {
                 server.kill();
             }
        }
    };
    
    process.on('SIGINT', cleanup);
    process.on('exit', cleanup);

    // 2. Wait for Port 3000
    const ready = await checkPortHelper(3000, 60000); // 60s timeout
    if (!ready) {
        console.error("Server failed to start on port 3000.");
        cleanup();
        process.exit(1);
    }
    console.log("Server is up!");

    // 3. Run Jest
    console.log("Running Tests...");
    // We run jest and ask for json output
    exec('npm test -- --json --outputFile=../evaluation/test-results.json', { cwd: REPO_DIR }, (error, stdout, stderr) => {
        
        const resultsPath = path.join(__dirname, 'test-results.json');
        
        let score = 0;
        let requirements: any[] = [];
        let success = false;

        if (fs.existsSync(resultsPath)) {
            try {
                const raw = fs.readFileSync(resultsPath, 'utf8');
                const json = JSON.parse(raw);
                success = json.success;
                
                json.testResults.forEach((suite: any) => {
                    suite.assertionResults.forEach((res: any) => {
                        const passed = res.status === 'passed';
                        if (passed) score += 12.5;
                        requirements.push({
                            title: res.title,
                            status: passed ? 'pass' : 'fail',
                            duration: res.duration
                        });
                    });
                });
            } catch (e) {
                console.error("Error parsing test results", e);
            }
        } else {
            console.error("No test-results.json found. Tests probably crashed.");
            if (stderr) console.error(stderr);
        }

        // 4. Generate Report
        const report = {
            run_id: new Date().getTime().toString(),
            score: Math.min(100, Math.round(score)),
            success: score === 100,
            requirements,
            environment: { node: process.version },
            timestamp: new Date().toISOString()
        };

        // Create date structure for reports like the python one did
        // evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const reportDir = path.join(__dirname, 'reports', dateStr, timeStr);
        
        fs.mkdirSync(reportDir, { recursive: true });
        fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2));
        fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2)); // Save to latest as well

        console.log(`Evaluation Complete. Score: ${report.score}`);
        console.log(`Report written to ${path.join(reportDir, 'report.json')}`);
        
        cleanup();
        process.exit(0);
    });
}

runEvaluator();
