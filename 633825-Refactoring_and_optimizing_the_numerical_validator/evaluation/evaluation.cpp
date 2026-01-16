#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <ctime>
#include <iomanip>
#include <cstdlib>
#include <vector>
#include <sys/stat.h>

#ifdef _WIN32
#include <direct.h>
#define mkdir(path, mode) _mkdir(path)
#endif

struct TestResult {
    std::string name;
    bool passed;
    int total;
    int failed;
};

struct EvaluationReport {
    std::string run_id;
    std::string started_at;
    std::string finished_at;
    double duration_seconds;
    bool success;
    TestResult before;
    TestResult after;
};

std::string generate_run_id() {
    std::srand(std::time(nullptr));
    std::stringstream ss;
    ss << std::hex << (std::rand() % 0xFFFFFF);
    return ss.str().substr(0, 8);
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

TestResult run_test(const std::string &test_name, const std::string &label) {
    std::cout << "\nRUNNING TESTS: " << label << "\n";

    std::string output_file = "test_output_" + test_name + ".txt";
#ifdef _WIN32
    std::string cmd = "test.exe " + test_name + " > " + output_file + " 2>&1";
#else
    std::string cmd = "./test " + test_name + " > " + output_file + " 2>&1";
#endif
    int exit_code = std::system(cmd.c_str());
    
    TestResult result;
    result.name = label;
    result.total = 0;
    result.failed = 0;
    result.passed = (exit_code == 0);

    std::ifstream file(output_file);
    if (file.is_open()) {
        std::string line;
        std::string output;
        while (std::getline(file, line)) {
            std::cout << line << "\n";
            output += line + "\n";
        }
        file.close();

        size_t pos = output.find(" tests)");
        if (pos != std::string::npos) {
            size_t start = output.rfind('(', pos);
            if (start != std::string::npos) {
                std::string count_str = output.substr(start + 1, pos - start - 1);
                result.total = std::atoi(count_str.c_str());
            }
        }

        pos = output.find(" FAILED,");
        if (pos != std::string::npos) {
            size_t start = output.rfind('\n', pos);
            if (start == std::string::npos) start = 0;
            std::string failed_str = output.substr(start, pos - start);
            result.failed = std::atoi(failed_str.c_str());
        }

        std::remove(output_file.c_str());
    }

    return result;
}

void save_report(const EvaluationReport &report, const std::string &output_path) {
    std::ofstream file(output_path);
    if (!file.is_open()) {
        std::cerr << "Failed to open output file: " << output_path << "\n";
        return;
    }

    file << "{\n";
    file << "  \"run_id\": \"" << report.run_id << "\",\n";
    file << "  \"started_at\": \"" << report.started_at << "\",\n";
    file << "  \"finished_at\": \"" << report.finished_at << "\",\n";
    file << "  \"duration_seconds\": " << std::fixed << std::setprecision(6) << report.duration_seconds << ",\n";
    file << "  \"success\": " << (report.success ? "true" : "false") << ",\n";
    file << "  \"results\": {\n";
    file << "    \"before\": {\n";
    file << "      \"success\": " << (report.before.passed ? "true" : "false") << ",\n";
    file << "      \"summary\": {\n";
    file << "        \"total\": " << report.before.total << ",\n";
    file << "        \"passed\": " << (report.before.total - report.before.failed) << ",\n";
    file << "        \"failed\": " << report.before.failed << "\n";
    file << "      }\n";
    file << "    },\n";
    file << "    \"after\": {\n";
    file << "      \"success\": " << (report.after.passed ? "true" : "false") << ",\n";
    file << "      \"summary\": {\n";
    file << "        \"total\": " << report.after.total << ",\n";
    file << "        \"passed\": " << (report.after.total - report.after.failed) << ",\n";
    file << "        \"failed\": " << report.after.failed << "\n";
    file << "      }\n";
    file << "    }\n";
    file << "  }\n";
    file << "}\n";

    file.close();
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

    EvaluationReport report;
    report.run_id = generate_run_id();
    report.started_at = get_timestamp();
    
    std::cout << "Run ID: " << report.run_id << "\n";

    std::time_t start_time = std::time(nullptr);

    std::cout << "\nCompiling tests...\n";
#ifdef _WIN32
    int compile_result = std::system("g++ -std=c++17 -o test.exe ./tests/main.cpp");
#else
    int compile_result = std::system("g++ -std=c++17 -o test ./tests/main.cpp");
#endif
    if (compile_result != 0) {
        std::cerr << "Failed to compile tests\n";
        return 1;
    }

    report.before = run_test("test_original", "BEFORE (repository_before)");
    report.after = run_test("test_optimized", "AFTER (repository_after)");

    std::time_t end_time = std::time(nullptr);
    report.duration_seconds = std::difftime(end_time, start_time);
    report.finished_at = get_timestamp();
    report.success = report.after.passed;

    std::cout << "\nEVALUATION SUMMARY\n";
    std::cout << "Before: " << (report.before.passed ? "PASSED" : "FAILED") << " (" << (report.before.total - report.before.failed) << "/" << report.before.total << ")\n";
    std::cout << "After: " << (report.after.passed ? "PASSED" : "FAILED") << " (" << (report.after.total - report.after.failed) << "/" << report.after.total << ")\n";

    save_report(report, output_path);
    std::cout << "\nReport saved to: " << output_path << "\n";
    std::cout << "Duration: " << std::fixed << std::setprecision(2) << report.duration_seconds << "s\n";
    std::cout << "Success: " << (report.success ? "YES" : "NO") << "\n";

    return report.success ? 0 : 1;
}
