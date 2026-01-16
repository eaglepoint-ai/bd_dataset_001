#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <ctime>
#include <iomanip>
#include <cstdlib>
#include <vector>
#include <sys/stat.h>
#include <cstring>

#ifdef _WIN32
#include <direct.h>
#include <windows.h>
#define mkdir(path, mode) _mkdir(path)
#define popen _popen
#define pclose _pclose
#define WEXITSTATUS(x) (x)
#else
#include <unistd.h>
#include <sys/utsname.h>
#include <sys/wait.h>
#endif

struct TestCase {
    std::string name;
    std::string outcome;
};

struct TestResult {
    bool success;
    int exit_code;
    std::vector<TestCase> tests;
    int total;
    int passed;
    int failed;
    std::string stdout_output;
};

struct Environment {
    std::string cpp_version;
    std::string platform;
    std::string os;
    std::string os_release;
    std::string architecture;
    std::string hostname;
};

std::string generate_run_id() {
    std::srand(std::time(nullptr));
    std::stringstream ss;
    ss << std::hex << std::setfill('0') << std::setw(8) << (std::rand() & 0xFFFFFFFF);
    return ss.str();
}

std::string get_timestamp() {
    std::time_t now = std::time(nullptr);
    char buf[100];
    std::strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S", std::localtime(&now));
    return std::string(buf);
}

std::string get_date_str() {
    std::time_t now = std::time(nullptr);
    char buf[20];
    std::strftime(buf, sizeof(buf), "%Y-%m-%d", std::localtime(&now));
    return std::string(buf);
}

std::string get_time_str() {
    std::time_t now = std::time(nullptr);
    char buf[20];
    std::strftime(buf, sizeof(buf), "%H-%M-%S", std::localtime(&now));
    return std::string(buf);
}

std::string get_hostname() {
#ifdef _WIN32
    char buffer[256];
    DWORD size = sizeof(buffer);
    if (GetComputerNameA(buffer, &size)) {
        return std::string(buffer);
    }
    return "unknown";
#else
    char buffer[256];
    if (gethostname(buffer, sizeof(buffer)) == 0) {
        return std::string(buffer);
    }
    return "unknown";
#endif
}

Environment get_environment() {
    Environment env;
    env.cpp_version = std::to_string(__cplusplus);
    env.hostname = get_hostname();
    
#ifdef _WIN32
    env.platform = "Windows";
    env.os = "Windows";
    env.os_release = "unknown";
    env.architecture = "x86_64";
#else
    struct utsname uts;
    if (uname(&uts) == 0) {
        env.platform = std::string(uts.sysname) + "-" + uts.release + "-" + uts.machine;
        env.os = uts.sysname;
        env.os_release = uts.release;
        env.architecture = uts.machine;
    } else {
        env.platform = "Linux";
        env.os = "Linux";
        env.os_release = "unknown";
        env.architecture = "unknown";
    }
#endif
    
    return env;
}

void create_directories(const std::string &path) {
    size_t pos = 0;
    while ((pos = path.find('/', pos)) != std::string::npos) {
        std::string subdir = path.substr(0, pos);
        if (!subdir.empty()) {
            mkdir(subdir.c_str(), 0755);
        }
        pos++;
    }
    mkdir(path.c_str(), 0755);
}

std::string escape_json(const std::string &str) {
    std::string result;
    for (char c : str) {
        if (c == '"') result += "\\\"";
        else if (c == '\\') result += "\\\\";
        else if (c == '\n') result += "\\n";
        else if (c == '\r') result += "\\r";
        else if (c == '\t') result += "\\t";
        else result += c;
    }
    return result;
}

TestResult run_test(const std::string &test_name, const std::string &label) {
    std::cout << "\nRUNNING TESTS: " << label << "\n";
    std::cout.flush();

    TestResult result;
    result.exit_code = -1;
    result.success = false;
    result.total = 0;
    result.passed = 0;
    result.failed = 0;
    result.stdout_output = "";

#ifdef _WIN32
    std::string test_exe = "test.exe";
#else
    std::string test_exe = "./test";
#endif

    // Check if test executable exists
    std::ifstream test_check(test_exe);
    if (!test_check.good()) {
        std::cerr << "ERROR: Test executable not found: " << test_exe << "\n";
        result.stdout_output = "ERROR: Test executable not found";
        return result;
    }
    test_check.close();

    // Run test and capture output directly
    std::string cmd = test_exe + " " + test_name;
    std::cout << "Executing: " << cmd << "\n";
    std::cout.flush();
    
    FILE* pipe = popen(cmd.c_str(), "r");
    if (!pipe) {
        std::cerr << "ERROR: Failed to execute test command\n";
        result.stdout_output = "ERROR: Failed to execute test";
        return result;
    }

    char buffer[256];
    std::string output;
    while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
        std::string line(buffer);
        // Remove trailing newline if present
        if (!line.empty() && line[line.length()-1] == '\n') {
            line.erase(line.length()-1);
        }
        
        std::cout << line << "\n";
        output += line + "\n";
        
        if (line.find("[PASS]") != std::string::npos) {
            TestCase tc;
            size_t pos = line.find("] ");
            if (pos != std::string::npos) {
                tc.name = line.substr(pos + 2);
                tc.outcome = "passed";
                result.tests.push_back(tc);
                result.passed++;
                result.total++;
            }
        } else if (line.find("[FAIL]") != std::string::npos) {
            TestCase tc;
            size_t pos = line.find("] ");
            if (pos != std::string::npos) {
                tc.name = line.substr(pos + 2);
                tc.outcome = "failed";
                result.tests.push_back(tc);
                result.failed++;
                result.total++;
            }
        }
    }
    
    int exit_code = pclose(pipe);
    result.exit_code = WEXITSTATUS(exit_code);
    result.success = (result.exit_code == 0);
    result.stdout_output = output;
    
    std::cout << "Exit code: " << result.exit_code << "\n";
    std::cout << "Parsed " << result.total << " tests (" << result.passed << " passed, " << result.failed << " failed)\n";
    std::cout.flush();

    return result;
}

void save_report(const std::string &run_id, const std::string &started_at, const std::string &finished_at,
                 double duration, bool success, const Environment &env, 
                 const TestResult &before, const TestResult &after, const std::string &output_path) {
    std::ofstream file(output_path);
    if (!file.is_open()) {
        std::cerr << "ERROR: Failed to open output file: " << output_path << "\n";
        std::cerr << "Check if directory exists and has write permissions\n";
        return;
    }

    file << "{\n";
    file << "  \"run_id\": \"" << run_id << "\",\n";
    file << "  \"started_at\": \"" << started_at << "\",\n";
    file << "  \"finished_at\": \"" << finished_at << "\",\n";
    file << "  \"duration_seconds\": " << std::fixed << std::setprecision(6) << duration << ",\n";
    file << "  \"success\": " << (success ? "true" : "false") << ",\n";
    file << "  \"error\": null,\n";
    
    file << "  \"environment\": {\n";
    file << "    \"cpp_version\": \"" << env.cpp_version << "\",\n";
    file << "    \"platform\": \"" << escape_json(env.platform) << "\",\n";
    file << "    \"os\": \"" << env.os << "\",\n";
    file << "    \"os_release\": \"" << env.os_release << "\",\n";
    file << "    \"architecture\": \"" << env.architecture << "\",\n";
    file << "    \"hostname\": \"" << env.hostname << "\",\n";
    file << "    \"git_commit\": \"unknown\",\n";
    file << "    \"git_branch\": \"unknown\"\n";
    file << "  },\n";
    
    file << "  \"results\": {\n";
    
    file << "    \"before\": {\n";
    file << "      \"success\": " << (before.success ? "true" : "false") << ",\n";
    file << "      \"exit_code\": " << before.exit_code << ",\n";
    file << "      \"tests\": [\n";
    for (size_t i = 0; i < before.tests.size(); i++) {
        file << "        {\n";
        file << "          \"name\": \"" << escape_json(before.tests[i].name) << "\",\n";
        file << "          \"outcome\": \"" << before.tests[i].outcome << "\"\n";
        file << "        }" << (i < before.tests.size() - 1 ? "," : "") << "\n";
    }
    file << "      ],\n";
    file << "      \"summary\": {\n";
    file << "        \"total\": " << before.total << ",\n";
    file << "        \"passed\": " << before.passed << ",\n";
    file << "        \"failed\": " << before.failed << "\n";
    file << "      },\n";
    file << "      \"stdout\": \"" << escape_json(before.stdout_output.substr(0, 3000)) << "\"\n";
    file << "    },\n";
    
    file << "    \"after\": {\n";
    file << "      \"success\": " << (after.success ? "true" : "false") << ",\n";
    file << "      \"exit_code\": " << after.exit_code << ",\n";
    file << "      \"tests\": [\n";
    for (size_t i = 0; i < after.tests.size(); i++) {
        file << "        {\n";
        file << "          \"name\": \"" << escape_json(after.tests[i].name) << "\",\n";
        file << "          \"outcome\": \"" << after.tests[i].outcome << "\"\n";
        file << "        }" << (i < after.tests.size() - 1 ? "," : "") << "\n";
    }
    file << "      ],\n";
    file << "      \"summary\": {\n";
    file << "        \"total\": " << after.total << ",\n";
    file << "        \"passed\": " << after.passed << ",\n";
    file << "        \"failed\": " << after.failed << "\n";
    file << "      },\n";
    file << "      \"stdout\": \"" << escape_json(after.stdout_output.substr(0, 3000)) << "\"\n";
    file << "    },\n";
    
    file << "    \"comparison\": {\n";
    file << "      \"before_tests_passed\": " << (before.success ? "true" : "false") << ",\n";
    file << "      \"after_tests_passed\": " << (after.success ? "true" : "false") << ",\n";
    file << "      \"before_total\": " << before.total << ",\n";
    file << "      \"before_passed\": " << before.passed << ",\n";
    file << "      \"before_failed\": " << before.failed << ",\n";
    file << "      \"after_total\": " << after.total << ",\n";
    file << "      \"after_passed\": " << after.passed << ",\n";
    file << "      \"after_failed\": " << after.failed << "\n";
    file << "    }\n";
    file << "  }\n";
    file << "}\n";

    file.flush();
    if (file.fail()) {
        std::cerr << "ERROR: Failed to write to file: " << output_path << "\n";
    }
    file.close();
    
    if (file.fail()) {
        std::cerr << "ERROR: Failed to close file: " << output_path << "\n";
    } else {
        std::cout << "Report successfully written and closed\n";
    }
}

int main(int argc, char *argv[]) {
    std::string output_path;
    
    if (argc > 2 && std::string(argv[1]) == "--output") {
        output_path = argv[2];
    } else {
        std::string date_str = get_date_str();
        std::string time_str = get_time_str();
        std::string dir = "evaluation/" + date_str + "/" + time_str;
        create_directories(dir);
        output_path = dir + "/report.json";
    }

    std::cout << "MECHANICAL REFACTOR EVALUATION\n";

    std::string run_id = generate_run_id();
    std::string started_at = get_timestamp();
    Environment env = get_environment();
    
    std::cout << "Run ID: " << run_id << "\n";
    std::cout << "Output path: " << output_path << "\n";

    std::time_t start_time = std::time(nullptr);

    TestResult before, after;
    bool compile_success = true;
    
    // Initialize with default values
    before.exit_code = -1;
    before.success = false;
    before.total = 0;
    before.passed = 0;
    before.failed = 0;
    
    after.exit_code = -1;
    after.success = false;
    after.total = 0;
    after.passed = 0;
    after.failed = 0;
    
    std::cout << "\nCompiling tests...\n";
#ifdef _WIN32
    int compile_result = std::system("g++ -std=c++17 -o test.exe ./tests/main.cpp");
#else
    int compile_result = std::system("g++ -std=c++17 -o test ./tests/main.cpp");
#endif
    if (compile_result != 0) {
        std::cerr << "Failed to compile tests\n";
        compile_success = false;
    } else {
        before = run_test("test_original", "BEFORE (repository_before)");
        after = run_test("test_optimized", "AFTER (repository_after)");
    }

    std::time_t end_time = std::time(nullptr);
    double duration = std::difftime(end_time, start_time);
    std::string finished_at = get_timestamp();
    bool success = compile_success && after.success;

    std::cout << "\nEVALUATION SUMMARY\n";
    std::cout << "Before: " << (before.success ? "PASSED" : "FAILED") << " (" << before.passed << "/" << before.total << ")\n";
    std::cout << "After: " << (after.success ? "PASSED" : "FAILED") << " (" << after.passed << "/" << after.total << ")\n";

    save_report(run_id, started_at, finished_at, duration, success, env, before, after, output_path);
    
    std::cout << "\nReport saved to: " << output_path << "\n";
    std::cout << "Duration: " << std::fixed << std::setprecision(2) << duration << "s\n";
    std::cout << "Success: " << (success ? "YES" : "NO") << "\n";

    return success ? 0 : 1;
}
