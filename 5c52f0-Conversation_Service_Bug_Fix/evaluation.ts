import { spawn } from "child_process";

type RepoName = "repository_before" | "repository_after";

async function runTests(repoName: RepoName): Promise<boolean> {
    console.log(`Running tests for ${repoName}...`);

    const command = "docker";
    const args = [
        "compose",
        "run",
        "--rm",
        "-e",
        `TARGET_REPO=${repoName}`,
        "app",
        "sh",
        "-c",
        `cd ${repoName} && npm install && npx prisma generate --schema=../repository_after/prisma/schema.prisma && cd .. && npx jest -i`,
    ];

    return new Promise((resolve) => {
        const process = spawn(command, args, { stdio: "inherit", shell: true });

        process.on("close", (code) => {
            if (code === 0) {
                console.log(`Tests PASSED for ${repoName}`);
                resolve(true);
            } else {
                console.log(`Tests FAILED for ${repoName}`);
                resolve(false);
            }
        });

        process.on("error", (err) => {
            console.error(`Error running tests: ${err}`);
            resolve(false);
        });
    });
}

async function main() {
    console.log("Starting evaluation...");

    // Test repository_before (Expected to FAIL)
    console.log("\n---------------------------------------------------");
    console.log("Evaluating repository_before (Some test - Should Fail)");
    console.log("---------------------------------------------------");
    const beforePassed = await runTests("repository_before");

    // Test repository_after (Expected to PASS)
    console.log("\n---------------------------------------------------");
    console.log("Evaluating repository_after (Fixed - Should Pass)");
    console.log("---------------------------------------------------");
    const afterPassed = await runTests("repository_after");

    if (!beforePassed && afterPassed) {
        console.log(
            "\nSUCCESS: repository_before failed and repository_after passed."
        );
        process.exit(0);
    } else {
        console.log("\nFAILURE: criteria not met.");
        if (beforePassed) {
            console.log("- repository_before UNEXPECTEDLY PASSED");
        }
        if (!afterPassed) {
            console.log("- repository_after FAILED");
        }
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
