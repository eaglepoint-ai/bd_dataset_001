import sys
import heapq
from collections import Counter

class Letter:
    def __init__(self, letter: str, freq: int):
        self.letter: str = letter
        self.freq: int = freq
        self.bitstring: str = ""

    def __repr__(self) -> str:
        return f"{self.letter}:{self.freq}"

    def __lt__(self, other):
        return self.freq < other.freq


class TreeNode:
    def __init__(self, freq: int, left, right):
        self.freq: int = freq
        self.left = left
        self.right = right

    def __lt__(self, other):
        return self.freq < other.freq


def generate_codes(node, prefix="", codes=None):
    if codes is None:
        codes = {}
    if isinstance(node, Letter):
        codes[node.letter] = prefix or "0"
    else:
        generate_codes(node.left, prefix + "0", codes)
        generate_codes(node.right, prefix + "1", codes)
    return codes


def main():
    if len(sys.argv) != 2:
        print("Usage: python huffman.py <filename>")
        sys.exit(1)

    try:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            text = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    if not text:
        print("Error: File is empty.")
        sys.exit(1)

    freq = Counter(text)
    heap = [Letter(char, count) for char, count in freq.items()]
    heapq.heapify(heap)

    if len(heap) == 1:
        single = heap[0]
        codes = {single.letter: "0"}
    else:
        while len(heap) > 1:
            left = heapq.heappop(heap)
            right = heapq.heappop(heap)
            node = TreeNode(left.freq + right.freq, left, right)
            heapq.heappush(heap, node)
        root = heap[0]
        codes = generate_codes(root)

    encoded = "".join(codes[ch] for ch in text)
    original_bits = len(text) * 8
    encoded_bits = len(encoded)
    ratio = original_bits / encoded_bits if encoded_bits else 0

    print("\nCharacter | Frequency | Huffman Code")
    print("-" * 40)
    for char in sorted(freq):
        printable = repr(char)[1:-1] if char.isspace() else char
        print(f"{printable:^9} | {freq[char]:^9} | {codes[char]}")

    print("\nOriginal bits:", original_bits)
    print("Encoded bits :", encoded_bits)
    print(f"Compression ratio: {ratio:.2f}")


if __name__ == "__main__":
    main()