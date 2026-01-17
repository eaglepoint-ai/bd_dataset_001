#include <iostream>
#include <fstream>
#include <sstream>
#include <cstdint>
#include <limits>
#include <string>
#include <cstdlib>

/* ───────────── Helpers ───────────── */

static constexpr int64_t POW2(int k) noexcept
{
    return static_cast<int64_t>(1) << k;
}

static int tests_run = 0;
static int tests_failed = 0;

void check(const char *name, bool condition)
{
    ++tests_run;
    if (condition)
    {
        std::cout << "[PASS] " << name << '\n';
    }
    else
    {
        ++tests_failed;
        std::cerr << "[FAIL] " << name << '\n';
    }
}

/* ───────────── Structural check ───────────── */

int count_occurrences(const std::string &str, const std::string &substr)
{
    int count = 0;
    size_t pos = 0;
    while ((pos = str.find(substr, pos)) != std::string::npos)
    {
        ++count;
        pos += substr.length();
    }
    return count;
}

void check_structure(const std::string &file_path)
{
    std::ifstream file(file_path);
    if (!file.is_open())
    {
        std::cerr << "[FAIL] Could not open " << file_path << " for structural check\n";
        std::exit(1);
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string contents = buffer.str();

    bool has_deque = contents.find("deque") != std::string::npos;
    bool has_interface = contents.find("class I") != std::string::npos || contents.find("struct I") != std::string::npos;
    int class_count = count_occurrences(contents, "class ");
    int struct_count = count_occurrences(contents, "struct ");
    
    bool is_clean = !has_deque && !has_interface && (class_count + struct_count) <= 1;

    if (has_deque)
        check(("Structural check: " + file_path + " (no deque)").c_str(), false);
    if (has_interface)
        check(("Structural check: " + file_path + " (no interface)").c_str(), false);
    if ((class_count + struct_count) > 1)
        check(("Structural check: " + file_path + " (max 1 class/struct)").c_str(), false);
    
    if (is_clean)
        check(("Structural check: " + file_path + " (clean)").c_str(), true);
}

/* ───────────── Test Runner ───────────── */

template<typename ValidateFunc>
void run_functional_tests(ValidateFunc validate, bool is_optimized)
{
    check("0 is invalid", validate(0) == false);
    check("-1 is invalid", validate(-1) == false);
    check("-8 is invalid", validate(-8) == false);

    check("1 is valid", validate(1) == true);
    check("2 is valid", validate(2) == true);
    check("4 is valid", validate(4) == true);
    check("2^30 is valid", validate(POW2(30)) == true);
    check("2^62 is valid", validate(POW2(62)) == true);

    check("INT64_MIN is invalid", validate(std::numeric_limits<int64_t>::min()) == false);

    check("3 is invalid", validate(3) == false);
    check("6 is invalid", validate(6) == false);
    check("7 is invalid", validate(7) == false);
}

#define main main_original
#include "../repository_before/main.cpp"
#undef main

namespace optimized {
#include "../repository_after/ScalarIntegrityService.hpp"
}

/* ───────────── Main Tests ───────────── */

int main(int argc, char *argv[])
{
    std::string mode = argc > 1 ? argv[1] : "";

    if (mode == "--interactive")
    {
        ScalarIntegrityService service;
        int64_t value;
        while (std::cin >> value)
        {
            std::cout << (service.verify_stochastic_harmony(value) ? "True" : "False") << '\n';
        }
        return 0;
    }

    if (mode == "test_original")
    {
        std::cout << "=== ScalarIntegrityService ORIGINAL ===\n";
        check_structure("./repository_before/main.cpp");
        
        ScalarIntegrityService service;
        auto validate = [&](int64_t n) { return service.verify_stochastic_harmony(n); };
        run_functional_tests(validate, false);
        
        std::cout << "\n";
        if (tests_failed > 0)
        {
            std::cout << tests_failed << " FAILED, " << (tests_run - tests_failed) << " PASSED (" << tests_run << " tests)\n";
            return 1;
        }
        std::cout << "ALL TESTS PASSED (" << tests_run << " tests)\n";
        return 0;
    }

    if (mode == "test_optimized")
    {
        std::cout << "=== ScalarIntegrityService OPTIMIZED ===\n";
        check_structure("./repository_after/ScalarIntegrityService.hpp");
        
        auto validate = [](int64_t n) { return optimized::ScalarIntegrityService::verify_stochastic_harmony(n); };
        run_functional_tests(validate, true);
        
        static_assert(optimized::ScalarIntegrityService::verify_stochastic_harmony(1024) == true, "Must be constexpr");
        static_assert(optimized::ScalarIntegrityService::verify_stochastic_harmony(7) == false, "Must be constexpr");
        check("constexpr validation", true);
        
        std::cout << "\n";
        if (tests_failed > 0)
        {
            std::cout << tests_failed << " FAILED, " << (tests_run - tests_failed) << " PASSED (" << tests_run << " tests)\n";
            return 1;
        }
        std::cout << "ALL TESTS PASSED (" << tests_run << " tests)\n";
        return 0;
    }

    std::cerr << "Usage: " << (argc > 0 ? argv[0] : "test") << " [test_original|test_optimized|--interactive]\n";
    return 1;
}


