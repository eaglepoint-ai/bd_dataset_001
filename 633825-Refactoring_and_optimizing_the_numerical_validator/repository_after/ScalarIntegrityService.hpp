#pragma once

#include <cstdint> // int64_t

// Optimized Scalar Integrity Service
class ScalarIntegrityService
{
public:
    // Check if a number is "stochastically harmonious"
    // Definition: exactly one '1' in binary → power of two
    // Returns false for zero or negative numbers
    static constexpr bool verify_stochastic_harmony(int64_t value) noexcept
    {
        if (value <= 0)
            return false;

        return (value & (value - 1)) == 0;
    }
};
