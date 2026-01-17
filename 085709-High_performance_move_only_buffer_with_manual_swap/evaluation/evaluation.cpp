#include <cstdlib>
#include <fstream>
#include <iostream>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <sstream>
#include <string>
#include <array>
#include <random>
#include <vector>

static std::string exec_cmd(const char* cmd) {
    std::array<char, 128> buffer{};
    std::string result;
    FILE* pipe = popen(cmd, "r");
    if (!pipe) return "unknown";
    while (fgets(buffer.data(), buffer.size(), pipe) != nullptr) {
        result += buffer.data();
    }
    pclose(pipe);
    if (!result.empty() && result.back() == '\n') {
        result.pop_back();
    }
    return result;
}

static std::string get_uuid() {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(0, 15);
    static std::uniform_int_distribution<> dis2(8, 11);

    std::stringstream ss;
    ss << std::hex;
    for (int i = 0; i < 8; i++) ss << dis(gen);
    ss << "-";
    for (int i = 0; i < 4; i++) ss << dis(gen);
    ss << "-4"; // UUID version 4
    for (int i = 0; i < 3; i++) ss << dis(gen);
    ss << "-";
    ss << dis2(gen); // UUID variant
    for (int i = 0; i < 3; i++) ss << dis(gen);
    ss << "-";
    for (int i = 0; i < 12; i++) ss << dis(gen);
    return ss.str();
}

int main() {
    using steady = std::chrono::steady_clock;
    using system = std::chrono::system_clock;

    auto start_steady = steady::now();
    auto start_system = system::now();

    // Generate run_id early
    std::string run_id = get_uuid();

    int build_status = std::system("cd tests && make clean && make");
    int test_status = 1;

    if (build_status == 0) {
        test_status = std::system("cd tests && ./test_fastbuffer");
    }

    auto end_steady = steady::now();
    auto end_system = system::now();

    double duration =
        std::chrono::duration_cast<std::chrono::milliseconds>(
            end_steady - start_steady).count() / 1000.0;

    bool passed = (build_status == 0 && test_status == 0);

    // ---- timestamps ----
    std::time_t start_tt = system::to_time_t(start_system);
    std::tm start_tm = *std::localtime(&start_tt);
    
    std::time_t end_tt = system::to_time_t(end_system);
    std::tm end_tm = *std::localtime(&end_tt);

    std::ostringstream date_dir, time_dir;
    date_dir << std::put_time(&start_tm, "%Y-%m-%d");
    time_dir << std::put_time(&start_tm, "%H-%M-%S");

    std::string base_path =
        "evaluation/report/" + date_dir.str() + "/" + time_dir.str();
    std::system(("mkdir -p " + base_path).c_str());

    // ---- environment detection ----
    std::string kernel = exec_cmd("uname -s");
    std::string arch   = exec_cmd("uname -m");
    std::string platform = kernel + "-" + arch;
    std::string node_version = exec_cmd("node -v");
    if (node_version.empty()) node_version = "unknown";

    // ---- summary ----
    int totalTests = 1; // High-level binary pass/fail
    int passedTests = passed ? 1 : 0;
    int failedTests = passed ? 0 : 1;

    std::ofstream report(base_path + "/report.json");

    report << "{\n";
    report << "  \"run_id\": \"" << run_id << "\",\n";
    report << "  \"started_at\": \"" << std::put_time(&start_tm, "%Y-%m-%dT%H:%M:%S") << ".000Z\",\n";
    report << "  \"finished_at\": \"" << std::put_time(&end_tm, "%Y-%m-%dT%H:%M:%S") << ".000Z\",\n";
    report << "  \"duration_seconds\": " << duration << ",\n";

    report << "  \"environment\": {\n";
    report << "    \"node_version\": \"" << node_version << "\",\n";
    report << "    \"platform\": \"" << platform << "\"\n";
    report << "  },\n";

    report << "  \"after\": {\n";
    report << "    \"tests\": {\n";
    report << "      \"passed\": " << (passed ? "true" : "false") << ",\n";
    report << "      \"return_code\": " << (passed ? 0 : 1) << ",\n";
    
    report << "      \"summary\": {\n";
    report << "        \"numTotalTests\": " << totalTests << ",\n";
    report << "        \"numPassedTests\": " << passedTests << ",\n";
    report << "        \"numFailedTests\": " << failedTests << ",\n";
    report << "        \"numTotalTestSuites\": 1,\n";
    report << "        \"numPassedTestSuites\": " << (passed ? 1 : 0) << ",\n";
    report << "        \"numFailedTestSuites\": " << (passed ? 0 : 1) << "\n";
    report << "      },\n";

    report << "      \"summary_matrix\": [["
           << passedTests << ", "
           << failedTests << "]],\n";
           
    // Mocking empty tests array as we don't parse individual test names yet
    report << "      \"tests\": [],\n";
    report << "      \"raw_output\": \"\"\n";
    
    report << "    },\n";
    report << "    \"metrics\": {}\n";
    report << "  },\n";

    report << "  \"comparison\": {\n";
    report << "    \"passed_gate\": " << (passed ? "true" : "false") << ",\n";
    report << "    \"improvement_summary\": \"" << (passed ? "After implementation passed correctness tests" : "Tests failed") << "\"\n";
    report << "  },\n";

    report << "  \"success\": " << (passed ? "true" : "false") << ",\n";
    report << "  \"error\": " << (passed ? "null" : "\"Test or build failure\"") << "\n";
    report << "}\n";

    report.close();

    std::cout << "Evaluation completed. Success: "
              << (passed ? "true" : "false") << "\n";
    std::cout << "Report written to: " << base_path << "/report.json\n";

    return passed ? 0 : 1;
}
