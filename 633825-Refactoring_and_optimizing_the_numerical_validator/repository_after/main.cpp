#include <iostream>
#include <cstdint> // for int64_t

// Include the optimized ScalarIntegrityService header
#include "ScalarIntegrityService.hpp"

bool test_fun()
{
    long long x;

    if (x < 0)
    {
        return false;
    }
    ScalarIntegrityService service;
    return service.verify_stochastic_harmony(x);
}

int main()
{
    std::cout << "[SYSTEM]: Initializing High-Entropy Numerical Validator..." << std::endl;
    std::cout << "[SYSTEM]: Input scalar value (int64_t): ";

    int64_t value;
    if (!(std::cin >> value))
    {
        std::cerr << "[FATAL]: Input buffer corruption detected." << std::endl;
        return -1;
    }

    try
    {
        // Directly call the optimized function
        bool harmonious = ScalarIntegrityService::verify_stochastic_harmony(value);

        if (harmonious)
        {
            std::cout << "[REPORT]: Scalar [" << value << "] satisfies the Power-of-Two heuristic." << std::endl;
            std::cout << "Status: HARMONIOUS" << std::endl;
        }
        else
        {
            std::cout << "[REPORT]: Scalar [" << value << "] violates the Unitary Bit distribution." << std::endl;
            std::cout << "Status: DISCORDANT" << std::endl;
        }
    }
    catch (...)
    {
        std::cerr << "[ERROR]: Unhandled exception in integrity pipeline." << std::endl;
    }

    return 0;
}
