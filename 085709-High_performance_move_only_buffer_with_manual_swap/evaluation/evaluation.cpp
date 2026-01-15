#include <cstdlib>
#include <fstream>
#include <iostream>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <sstream>
#include <string>
#include <array>

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

int main() {
    using steady = std::chrono::steady_clock;
    using system = std::chrono::system_clock;

    auto start_steady = steady::now();
    auto start_system = system::now();

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

    std::ostringstream date_dir, time_dir, run_id;
    date_dir << std::put_time(&start_tm, "%Y-%m-%d");
    time_dir << std::put_time(&start_tm, "%H-%M-%S");
    run_id   << std::put_time(&start_tm, "%Y%m%d-%H%M%S");

    std::string base_path =
        "evaluation/report/" + date_dir.str() + "/" + time_dir.str();
    std::system(("mkdir -p " + base_path).c_str());

    // ---- environment detection ----
    std::string kernel = exec_cmd("uname -s");
    std::string arch   = exec_cmd("uname -m");
    std::string platform = kernel + "-" + arch;

    std::string compiler = std::string("g++ ") + __VERSION__;

    // ---- summary ----
    int totalTests = 1;
    int passedTests = passed ? 1 : 0;
    int failedTests = passed ? 0 : 1;

    std::ofstream report(base_path + "/report.json");

    report << "{\n";
    report << "  \"run_id\": \"" << run_id.str() << "\",\n";
    report << "  \"started_at\": \"" << std::put_time(&start_tm, "%Y-%m-%dT%H:%M:%S") << "\",\n";

    std::time_t end_tt = system::to_time_t(end_system);
    std::tm end_tm = *std::localtime(&end_tt);
    report << "  \"finished_at\": \"" << std::put_time(&end_tm, "%Y-%m-%dT%H:%M:%S") << "\",\n";

    report << "  \"duration_seconds\": " << duration << ",\n";

    report << "  \"environment\": {\n";
    report << "    \"platform\": \"" << platform << "\",\n";
    report << "    \"compiler\": \"" << compiler << "\",\n";
    report << "    \"cpp_standard\": \"c++20\"\n";
    report << "  },\n";

    report << "  \"summary\": {\n";
    report << "    \"totalTests\": " << totalTests << ",\n";
    report << "    \"passedTests\": " << passedTests << ",\n";
    report << "    \"failedTests\": " << failedTests << ",\n";
    report << "    \"totalTestSuites\": 1,\n";
    report << "    \"passedTestSuites\": " << (passed ? 1 : 0) << ",\n";
    report << "    \"failedTestSuites\": " << (passed ? 0 : 1) << "\n";
    report << "  },\n";

    report << "  \"summary_matrix\": [["
           << passedTests << ", "
           << failedTests << "]],\n";

    report << "  \"after\": {\n";
    report << "    \"tests\": {\n";
    report << "      \"passed\": " << (passed ? "true" : "false") << ",\n";
    report << "      \"return_code\": " << (passed ? 0 : 1) << "\n";
    report << "    }\n";
    report << "  },\n";

    report << "  \"error\": " << (passed ? "null" : "\"Test or build failure\"") << ",\n";
    report << "  \"success\": " << (passed ? "true" : "false") << "\n";
    report << "}\n";

    report.close();

    std::cout << "Evaluation completed. Success: "
              << (passed ? "true" : "false") << "\n";

    return passed ? 0 : 1;
}
