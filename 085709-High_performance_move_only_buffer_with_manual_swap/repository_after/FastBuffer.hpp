#ifndef FASTBUFFER_HPP
#define FASTBUFFER_HPP

#include <cstddef>

class FastBuffer {
private:
    int* data_;
    std::size_t size_;

public:
    // Default constructor: owns no memory
    FastBuffer() noexcept
        : data_(nullptr), size_(0) {}

    // Size constructor: owns exactly one buffer
    explicit FastBuffer(std::size_t size)
        : data_(size ? new int[size] : nullptr),
          size_(size) {}

    // Copy semantics disabled
    FastBuffer(const FastBuffer&) = delete;
    FastBuffer& operator=(const FastBuffer&) = delete;

    // Move constructor (constant time)
    FastBuffer(FastBuffer&& other) noexcept
        : data_(other.data_),
          size_(other.size_) {
        other.data_ = nullptr;
        other.size_ = 0;
    }

    // Move assignment (self-move safe, no conditionals)
    FastBuffer& operator=(FastBuffer&& other) noexcept {
        // Release current ownership
        delete[] data_;

        // Transfer ownership
        data_ = other.data_;
        size_ = other.size_;

        // Leave source valid
        other.data_ = nullptr;
        other.size_ = 0;

        return *this;
    }

    // Destructor
    ~FastBuffer() noexcept {
        delete[] data_;
    }

    // Manual rvalue cast helper (demonstrates native syntax)
    static FastBuffer&& move(FastBuffer& obj) noexcept {
        return static_cast<FastBuffer&&>(obj);
    }

    // Accessors
    int* data() noexcept { return data_; }
    const int* data() const noexcept { return data_; }
    std::size_t size() const noexcept { return size_; }
};

#endif // FASTBUFFER_HPP
