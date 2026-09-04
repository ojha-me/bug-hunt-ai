from django.core.management.base import BaseCommand
from challenges.models import CodingProblem


class Command(BaseCommand):
    help = "Seed additional interview problems filling gaps (DP, linked lists, stack, heap, bit, backtracking)"

    def handle(self, *args, **options):
        for problem in PROBLEMS:
            obj, created = CodingProblem.objects.get_or_create(
                slug=problem["slug"],
                defaults={k: problem[k] for k in
                          ("title", "difficulty", "topics", "description", "examples",
                           "constraints", "starter_code", "test_cases")},
            )
            if created:
                self.stdout.write(f"Created problem: {obj.title}")
            else:
                for k in ("title", "difficulty", "topics", "description", "examples",
                          "constraints", "starter_code", "test_cases"):
                    setattr(obj, k, problem[k])
                obj.save()
                self.stdout.write(f"Updated problem: {obj.title}")


def _stdin_read_line(comment: str) -> str:
    return (
        "import sys\n\n"
        "def main():\n"
        f"    data = sys.stdin.read()\n"
        f"    # {comment}\n"
        "    print()\n\n"
        "if __name__ == '__main__':\n"
        "    main()"
    )


PROBLEMS = [
    # ==================================================================
    # EASY
    # ==================================================================
    {
        "slug": "reverse-linked-list",
        "title": "Reverse Linked List",
        "difficulty": "easy",
        "topics": ["Linked List", "Recursion"],
        "description": (
            "Given the values of a singly linked list, reverse the list and print the resulting values.\n\n"
            "**Input format**\n\nA single line: the list values, space-separated (may be empty).\n\n"
            "**Output format**\n\nThe reversed values, space-separated (print an empty line for an empty list)."
        ),
        "examples": [
            {"input": "1 2 3 4 5", "output": "5 4 3 2 1", "explanation": ""},
            {"input": "1 2", "output": "2 1", "explanation": ""},
        ],
        "constraints": ["0 <= number of nodes <= 5000", "-5000 <= node value <= 5000"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    vals = sys.stdin.read().split()\n"
            "    # TODO: reverse the list of values and print them space-separated\n"
            "    print(' '.join(vals))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 2 3 4 5", "expected_output": "5 4 3 2 1"},
            {"name": "example 2", "stdin": "1 2", "expected_output": "2 1"},
            {"name": "single", "stdin": "7", "expected_output": "7"},
            {"name": "empty", "stdin": "", "expected_output": ""},
        ],
    },
    {
        "slug": "single-number",
        "title": "Single Number",
        "difficulty": "easy",
        "topics": ["Bit Manipulation", "Arrays"],
        "description": (
            "Every element appears **twice** except for one, which appears once. Find that single element. "
            "Aim for O(n) time and O(1) extra space (hint: XOR).\n\n"
            "**Input format**\n\nA single line: the array (space-separated integers).\n\n"
            "**Output format**\n\nThe element that appears once (integer)."
        ),
        "examples": [
            {"input": "2 2 1", "output": "1", "explanation": ""},
            {"input": "4 1 2 1 2", "output": "4", "explanation": ""},
        ],
        "constraints": ["1 <= n < 3*10^4", "each element appears twice except one"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().split()))\n"
            "    # TODO: return the element that appears exactly once\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2 2 1", "expected_output": "1"},
            {"name": "example 2", "stdin": "4 1 2 1 2", "expected_output": "4"},
            {"name": "single", "stdin": "1", "expected_output": "1"},
            {"name": "negatives", "stdin": "-3 5 5", "expected_output": "-3"},
        ],
    },
    {
        "slug": "number-of-1-bits",
        "title": "Number of 1 Bits",
        "difficulty": "easy",
        "topics": ["Bit Manipulation"],
        "description": (
            "Given a non-negative integer, return the number of set bits (1s) in its binary representation "
            "(the Hamming weight).\n\n"
            "**Input format**\n\nA single line: one non-negative integer.\n\n"
            "**Output format**\n\nThe number of 1 bits (integer)."
        ),
        "examples": [
            {"input": "11", "output": "3", "explanation": "11 = 1011"},
            {"input": "128", "output": "1", "explanation": "128 = 10000000"},
        ],
        "constraints": ["0 <= n <= 2^31 - 1"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    n = int(sys.stdin.read().strip())\n"
            "    # TODO: count set bits\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "11", "expected_output": "3"},
            {"name": "example 2", "stdin": "128", "expected_output": "1"},
            {"name": "zero", "stdin": "0", "expected_output": "0"},
            {"name": "all ones byte", "stdin": "255", "expected_output": "8"},
        ],
    },
    {
        "slug": "meeting-rooms",
        "title": "Meeting Rooms",
        "difficulty": "easy",
        "topics": ["Intervals", "Sorting"],
        "description": (
            "Given a set of meeting time intervals, determine if a single person could attend **all** meetings "
            "(i.e. no two intervals overlap). Touching endpoints (e.g. [1,2] and [2,3]) do NOT overlap.\n\n"
            "**Input format**\n\nFirst line: `n`, the number of meetings.\nNext `n` lines: each `start end`.\n\n"
            "**Output format**\n\n`true` if all meetings can be attended, otherwise `false`."
        ),
        "examples": [
            {"input": "3\n0 30\n5 10\n15 20", "output": "false", "explanation": "0-30 overlaps 5-10"},
            {"input": "2\n7 10\n2 4", "output": "true", "explanation": ""},
        ],
        "constraints": ["0 <= n <= 10^4", "0 <= start < end <= 10^6"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    data = sys.stdin.read().split()\n"
            "    # First token is n, then 2*n integers as start/end pairs.\n"
            "    # TODO: print 'true' if no intervals overlap, else 'false'\n"
            "    print('true')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "overlap", "stdin": "3\n0 30\n5 10\n15 20", "expected_output": "false"},
            {"name": "no overlap", "stdin": "2\n7 10\n2 4", "expected_output": "true"},
            {"name": "touching", "stdin": "2\n1 2\n2 3", "expected_output": "true"},
            {"name": "empty", "stdin": "0", "expected_output": "true"},
        ],
    },
    {
        "slug": "last-stone-weight",
        "title": "Last Stone Weight",
        "difficulty": "easy",
        "topics": ["Heap", "Greedy"],
        "description": (
            "Each turn, smash the two heaviest stones together. If they are equal, both are destroyed; "
            "otherwise the heavier is replaced by the difference. Return the weight of the last remaining "
            "stone (0 if none remain).\n\n"
            "**Input format**\n\nA single line: stone weights (space-separated positive integers).\n\n"
            "**Output format**\n\nThe weight of the last stone (0 if none remain)."
        ),
        "examples": [
            {"input": "2 7 4 1 8 1", "output": "1", "explanation": ""},
            {"input": "1", "output": "1", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 30", "1 <= stone weight <= 1000"],
        "starter_code": (
            "import sys, heapq\n\n"
            "def main():\n"
            "    stones = list(map(int, sys.stdin.read().split()))\n"
            "    # TODO: repeatedly smash the two heaviest stones\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2 7 4 1 8 1", "expected_output": "1"},
            {"name": "single", "stdin": "1", "expected_output": "1"},
            {"name": "cancel out", "stdin": "2 2", "expected_output": "0"},
            {"name": "two", "stdin": "3 7", "expected_output": "4"},
        ],
    },
    # ==================================================================
    # MEDIUM
    # ==================================================================
    {
        "slug": "container-with-most-water",
        "title": "Container With Most Water",
        "difficulty": "medium",
        "topics": ["Two Pointers", "Greedy", "Arrays"],
        "description": (
            "Given `n` non-negative heights, each representing a vertical line, find two lines that together "
            "with the x-axis form a container holding the most water. Return that maximum area.\n\n"
            "**Input format**\n\nA single line: the heights (space-separated integers).\n\n"
            "**Output format**\n\nThe maximum area (integer)."
        ),
        "examples": [
            {"input": "1 8 6 2 5 4 8 3 7", "output": "49", "explanation": "lines at index 1 and 8"},
            {"input": "1 1", "output": "1", "explanation": ""},
        ],
        "constraints": ["2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    h = list(map(int, sys.stdin.read().split()))\n"
            "    # TODO: two-pointer max area\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 8 6 2 5 4 8 3 7", "expected_output": "49"},
            {"name": "example 2", "stdin": "1 1", "expected_output": "1"},
            {"name": "increasing", "stdin": "1 2 3 4 5", "expected_output": "6"},
            {"name": "peak", "stdin": "2 3 10 5 7 8 9", "expected_output": "36"},
        ],
    },
    {
        "slug": "house-robber",
        "title": "House Robber",
        "difficulty": "medium",
        "topics": ["Dynamic Programming"],
        "description": (
            "Houses in a row each hold some money, but you cannot rob two **adjacent** houses. Return the "
            "maximum amount you can rob.\n\n"
            "**Input format**\n\nA single line: money in each house (space-separated non-negative integers).\n\n"
            "**Output format**\n\nThe maximum total (integer)."
        ),
        "examples": [
            {"input": "1 2 3 1", "output": "4", "explanation": "rob house 1 and 3"},
            {"input": "2 7 9 3 1", "output": "12", "explanation": "rob 2 + 9 + 1"},
        ],
        "constraints": ["1 <= n <= 100", "0 <= money <= 400"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().split()))\n"
            "    # TODO: DP over non-adjacent choices\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 2 3 1", "expected_output": "4"},
            {"name": "example 2", "stdin": "2 7 9 3 1", "expected_output": "12"},
            {"name": "single", "stdin": "5", "expected_output": "5"},
            {"name": "two", "stdin": "2 1 1 2", "expected_output": "4"},
        ],
    },
    {
        "slug": "longest-increasing-subsequence",
        "title": "Longest Increasing Subsequence",
        "difficulty": "medium",
        "topics": ["Dynamic Programming", "Binary Search"],
        "description": (
            "Given an integer array, return the length of the longest **strictly increasing** subsequence.\n\n"
            "**Input format**\n\nA single line: the array (space-separated integers).\n\n"
            "**Output format**\n\nThe length of the longest increasing subsequence (integer)."
        ),
        "examples": [
            {"input": "10 9 2 5 3 7 101 18", "output": "4", "explanation": "2 3 7 18"},
            {"input": "0 1 0 3 2 3", "output": "4", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 2500", "-10^4 <= nums[i] <= 10^4"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().split()))\n"
            "    # TODO: O(n log n) patience sorting or O(n^2) DP\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "10 9 2 5 3 7 101 18", "expected_output": "4"},
            {"name": "example 2", "stdin": "0 1 0 3 2 3", "expected_output": "4"},
            {"name": "all equal", "stdin": "7 7 7 7", "expected_output": "1"},
            {"name": "single", "stdin": "4", "expected_output": "1"},
        ],
    },
    {
        "slug": "word-break",
        "title": "Word Break",
        "difficulty": "medium",
        "topics": ["Dynamic Programming", "Strings"],
        "description": (
            "Given a string `s` and a dictionary of words, determine if `s` can be segmented into a "
            "space-separated sequence of one or more dictionary words. Words may be reused.\n\n"
            "**Input format**\n\nFirst line: the string `s`.\nSecond line: the dictionary words, space-separated.\n\n"
            "**Output format**\n\n`true` or `false`."
        ),
        "examples": [
            {"input": "leetcode\nleet code", "output": "true", "explanation": "leet + code"},
            {"input": "catsandog\ncats dog sand and cat", "output": "false", "explanation": ""},
        ],
        "constraints": ["1 <= len(s) <= 300", "1 <= number of words <= 1000"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().split('\\n')\n"
            "    s = lines[0].strip()\n"
            "    words = set(lines[1].split()) if len(lines) > 1 else set()\n"
            "    # TODO: DP over prefixes\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "leetcode\nleet code", "expected_output": "true"},
            {"name": "reuse", "stdin": "applepenapple\napple pen", "expected_output": "true"},
            {"name": "example 3", "stdin": "catsandog\ncats dog sand and cat", "expected_output": "false"},
            {"name": "single word", "stdin": "cars\ncar ca rs", "expected_output": "true"},
        ],
    },
    {
        "slug": "longest-common-subsequence",
        "title": "Longest Common Subsequence",
        "difficulty": "medium",
        "topics": ["Dynamic Programming", "Strings"],
        "description": (
            "Given two strings, return the length of their longest common subsequence (a subsequence keeps "
            "relative order but need not be contiguous). Return 0 if there is none.\n\n"
            "**Input format**\n\nFirst line: string `a`.\nSecond line: string `b`.\n\n"
            "**Output format**\n\nThe length of the LCS (integer)."
        ),
        "examples": [
            {"input": "abcde\nace", "output": "3", "explanation": "ace"},
            {"input": "abc\ndef", "output": "0", "explanation": ""},
        ],
        "constraints": ["1 <= len(a), len(b) <= 1000"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().split('\\n')\n"
            "    a = lines[0] if len(lines) > 0 else ''\n"
            "    b = lines[1] if len(lines) > 1 else ''\n"
            "    # TODO: 2D DP\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "abcde\nace", "expected_output": "3"},
            {"name": "identical", "stdin": "abc\nabc", "expected_output": "3"},
            {"name": "none", "stdin": "abc\ndef", "expected_output": "0"},
            {"name": "interleaved", "stdin": "abcba\nabcbcba", "expected_output": "5"},
        ],
    },
    {
        "slug": "unique-paths",
        "title": "Unique Paths",
        "difficulty": "medium",
        "topics": ["Dynamic Programming", "Combinatorics"],
        "description": (
            "A robot starts at the top-left of an `m x n` grid and can only move right or down. Return the "
            "number of unique paths to the bottom-right corner.\n\n"
            "**Input format**\n\nA single line: two integers `m n`.\n\n"
            "**Output format**\n\nThe number of unique paths (integer)."
        ),
        "examples": [
            {"input": "3 7", "output": "28", "explanation": ""},
            {"input": "3 2", "output": "3", "explanation": ""},
        ],
        "constraints": ["1 <= m, n <= 100"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    m, n = map(int, sys.stdin.read().split())\n"
            "    # TODO: DP grid or combinatorics\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "3 7", "expected_output": "28"},
            {"name": "example 2", "stdin": "3 2", "expected_output": "3"},
            {"name": "single cell", "stdin": "1 1", "expected_output": "1"},
            {"name": "square", "stdin": "4 4", "expected_output": "20"},
        ],
    },
    {
        "slug": "jump-game",
        "title": "Jump Game",
        "difficulty": "medium",
        "topics": ["Greedy", "Dynamic Programming"],
        "description": (
            "You start at index 0. Each element is the maximum jump length from that position. Return whether "
            "you can reach the last index.\n\n"
            "**Input format**\n\nA single line: the array (space-separated non-negative integers).\n\n"
            "**Output format**\n\n`true` or `false`."
        ),
        "examples": [
            {"input": "2 3 1 1 4", "output": "true", "explanation": ""},
            {"input": "3 2 1 0 4", "output": "false", "explanation": "stuck at index 3"},
        ],
        "constraints": ["1 <= n <= 10^4", "0 <= nums[i] <= 10^5"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().split()))\n"
            "    # TODO: greedy furthest-reach\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2 3 1 1 4", "expected_output": "true"},
            {"name": "example 2", "stdin": "3 2 1 0 4", "expected_output": "false"},
            {"name": "single", "stdin": "0", "expected_output": "true"},
            {"name": "leading zero", "stdin": "0 1", "expected_output": "false"},
        ],
    },
    {
        "slug": "search-in-rotated-sorted-array",
        "title": "Search in Rotated Sorted Array",
        "difficulty": "medium",
        "topics": ["Binary Search", "Arrays"],
        "description": (
            "An ascending array of distinct integers was rotated at some unknown pivot. Given a target, return "
            "its index, or -1 if not present. Aim for O(log n).\n\n"
            "**Input format**\n\nFirst line: the array (space-separated integers).\nSecond line: the target.\n\n"
            "**Output format**\n\nThe index of the target, or -1."
        ),
        "examples": [
            {"input": "4 5 6 7 0 1 2\n0", "output": "4", "explanation": ""},
            {"input": "4 5 6 7 0 1 2\n3", "output": "-1", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 5000", "all values distinct"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().split('\\n')\n"
            "    nums = list(map(int, lines[0].split()))\n"
            "    target = int(lines[1])\n"
            "    # TODO: modified binary search\n"
            "    print(-1)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "found", "stdin": "4 5 6 7 0 1 2\n0", "expected_output": "4"},
            {"name": "missing", "stdin": "4 5 6 7 0 1 2\n3", "expected_output": "-1"},
            {"name": "single", "stdin": "1\n1", "expected_output": "0"},
            {"name": "first", "stdin": "5 1 3\n5", "expected_output": "0"},
        ],
    },
    {
        "slug": "koko-eating-bananas",
        "title": "Koko Eating Bananas",
        "difficulty": "medium",
        "topics": ["Binary Search"],
        "description": (
            "Koko eats bananas at speed `k` per hour. Each hour she picks one pile and eats up to `k` bananas "
            "from it (if the pile has fewer, she finishes it and stops for that hour). Return the minimum "
            "integer `k` such that she can eat all piles within `h` hours.\n\n"
            "**Input format**\n\nFirst line: the piles (space-separated integers).\nSecond line: `h`.\n\n"
            "**Output format**\n\nThe minimum eating speed (integer)."
        ),
        "examples": [
            {"input": "3 6 7 11\n8", "output": "4", "explanation": ""},
            {"input": "30 11 23 4 20\n5", "output": "30", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^4", "n <= h <= 10^9", "1 <= pile <= 10^9"],
        "starter_code": (
            "import sys, math\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().split('\\n')\n"
            "    piles = list(map(int, lines[0].split()))\n"
            "    h = int(lines[1])\n"
            "    # TODO: binary search on eating speed\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "3 6 7 11\n8", "expected_output": "4"},
            {"name": "tight", "stdin": "30 11 23 4 20\n5", "expected_output": "30"},
            {"name": "example 3", "stdin": "30 11 23 4 20\n6", "expected_output": "23"},
            {"name": "single pile", "stdin": "312884470\n968709470", "expected_output": "1"},
        ],
    },
    {
        "slug": "evaluate-reverse-polish-notation",
        "title": "Evaluate Reverse Polish Notation",
        "difficulty": "medium",
        "topics": ["Stack", "Math"],
        "description": (
            "Evaluate an arithmetic expression in Reverse Polish Notation. Valid operators are `+ - * /`. "
            "Division truncates toward zero.\n\n"
            "**Input format**\n\nA single line: the tokens, space-separated.\n\n"
            "**Output format**\n\nThe evaluated result (integer)."
        ),
        "examples": [
            {"input": "2 1 + 3 *", "output": "9", "explanation": "(2+1)*3"},
            {"input": "4 13 5 / +", "output": "6", "explanation": "4 + (13/5)"},
        ],
        "constraints": ["1 <= number of tokens <= 10^4", "division truncates toward zero"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    tokens = sys.stdin.read().split()\n"
            "    # TODO: evaluate with a stack; use int(a/b) for truncation toward zero\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2 1 + 3 *", "expected_output": "9"},
            {"name": "example 2", "stdin": "4 13 5 / +", "expected_output": "6"},
            {"name": "complex", "stdin": "10 6 9 3 + -11 * / * 17 + 5 +", "expected_output": "22"},
            {"name": "single", "stdin": "42", "expected_output": "42"},
        ],
    },
    {
        "slug": "daily-temperatures",
        "title": "Daily Temperatures",
        "difficulty": "medium",
        "topics": ["Stack", "Monotonic Stack", "Arrays"],
        "description": (
            "Given daily temperatures, for each day return how many days you must wait for a warmer "
            "temperature. If there is no future warmer day, use 0.\n\n"
            "**Input format**\n\nA single line: the temperatures (space-separated integers).\n\n"
            "**Output format**\n\nThe wait counts, space-separated."
        ),
        "examples": [
            {"input": "73 74 75 71 69 72 76 73", "output": "1 1 4 2 1 1 0 0", "explanation": ""},
            {"input": "30 40 50 60", "output": "1 1 1 0", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^5", "30 <= temp <= 100"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    temps = list(map(int, sys.stdin.read().split()))\n"
            "    # TODO: monotonic decreasing stack of indices\n"
            "    print(' '.join(['0'] * len(temps)))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "73 74 75 71 69 72 76 73", "expected_output": "1 1 4 2 1 1 0 0"},
            {"name": "example 2", "stdin": "30 40 50 60", "expected_output": "1 1 1 0"},
            {"name": "decreasing", "stdin": "30 60 90", "expected_output": "1 1 0"},
            {"name": "single", "stdin": "50", "expected_output": "0"},
        ],
    },
    {
        "slug": "word-search",
        "title": "Word Search",
        "difficulty": "medium",
        "topics": ["Backtracking", "Matrix", "DFS"],
        "description": (
            "Given a grid of letters and a word, return whether the word can be constructed from sequentially "
            "adjacent cells (horizontally or vertically). The same cell may not be used more than once.\n\n"
            "**Input format**\n\nFirst line: two integers `R C` (rows, columns).\nNext `R` lines: each row as a "
            "string of `C` uppercase letters.\nLast line: the word.\n\n"
            "**Output format**\n\n`true` or `false`."
        ),
        "examples": [
            {"input": "3 4\nABCE\nSFCS\nADEE\nABCCED", "output": "true", "explanation": ""},
            {"input": "3 4\nABCE\nSFCS\nADEE\nABCB", "output": "false", "explanation": ""},
        ],
        "constraints": ["1 <= R, C <= 6", "1 <= len(word) <= 15"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().split('\\n')\n"
            "    r, c = map(int, lines[0].split())\n"
            "    grid = [lines[1 + i] for i in range(r)]\n"
            "    word = lines[1 + r]\n"
            "    # TODO: DFS backtracking from each cell\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "found path", "stdin": "3 4\nABCE\nSFCS\nADEE\nABCCED", "expected_output": "true"},
            {"name": "found see", "stdin": "3 4\nABCE\nSFCS\nADEE\nSEE", "expected_output": "true"},
            {"name": "not found", "stdin": "3 4\nABCE\nSFCS\nADEE\nABCB", "expected_output": "false"},
            {"name": "single cell", "stdin": "1 1\nA\nA", "expected_output": "true"},
        ],
    },
    {
        "slug": "partition-equal-subset-sum",
        "title": "Partition Equal Subset Sum",
        "difficulty": "medium",
        "topics": ["Dynamic Programming"],
        "description": (
            "Given an array of positive integers, determine whether it can be partitioned into two subsets "
            "with equal sum.\n\n"
            "**Input format**\n\nA single line: the array (space-separated positive integers).\n\n"
            "**Output format**\n\n`true` or `false`."
        ),
        "examples": [
            {"input": "1 5 11 5", "output": "true", "explanation": "{1,5,5} and {11}"},
            {"input": "1 2 3 5", "output": "false", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 200", "1 <= nums[i] <= 100"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().split()))\n"
            "    # TODO: subset-sum DP to total/2\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 5 11 5", "expected_output": "true"},
            {"name": "example 2", "stdin": "1 2 3 5", "expected_output": "false"},
            {"name": "odd sum", "stdin": "1 2 5", "expected_output": "false"},
            {"name": "pair", "stdin": "3 3", "expected_output": "true"},
        ],
    },
    {
        "slug": "kth-largest-element-in-an-array",
        "title": "Kth Largest Element in an Array",
        "difficulty": "medium",
        "topics": ["Heap", "Sorting", "Quickselect"],
        "description": (
            "Return the `k`-th largest element in an array (the k-th largest in sorted order, not the k-th "
            "distinct element).\n\n"
            "**Input format**\n\nFirst line: the array (space-separated integers).\nSecond line: `k`.\n\n"
            "**Output format**\n\nThe k-th largest element (integer)."
        ),
        "examples": [
            {"input": "3 2 1 5 6 4\n2", "output": "5", "explanation": ""},
            {"input": "3 2 3 1 2 4 5 5 6\n4", "output": "4", "explanation": ""},
        ],
        "constraints": ["1 <= k <= n <= 10^5", "-10^4 <= nums[i] <= 10^4"],
        "starter_code": (
            "import sys, heapq\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().split('\\n')\n"
            "    nums = list(map(int, lines[0].split()))\n"
            "    k = int(lines[1])\n"
            "    # TODO: heap of size k or quickselect\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "3 2 1 5 6 4\n2", "expected_output": "5"},
            {"name": "example 2", "stdin": "3 2 3 1 2 4 5 5 6\n4", "expected_output": "4"},
            {"name": "largest", "stdin": "7 7 7\n1", "expected_output": "7"},
            {"name": "smallest", "stdin": "1 2 3\n3", "expected_output": "1"},
        ],
    },
    # ==================================================================
    # HARD
    # ==================================================================
    {
        "slug": "edit-distance",
        "title": "Edit Distance",
        "difficulty": "hard",
        "topics": ["Dynamic Programming", "Strings"],
        "description": (
            "Given two words, return the minimum number of operations (insert, delete, or replace a single "
            "character) required to convert the first into the second (Levenshtein distance).\n\n"
            "**Input format**\n\nFirst line: `word1`.\nSecond line: `word2`.\n\n"
            "**Output format**\n\nThe minimum number of operations (integer)."
        ),
        "examples": [
            {"input": "horse\nros", "output": "3", "explanation": "horse->rorse->rose->ros"},
            {"input": "intention\nexecution", "output": "5", "explanation": ""},
        ],
        "constraints": ["0 <= len(word1), len(word2) <= 500"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().split('\\n')\n"
            "    a = lines[0] if len(lines) > 0 else ''\n"
            "    b = lines[1] if len(lines) > 1 else ''\n"
            "    # TODO: 2D DP (Levenshtein)\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "horse\nros", "expected_output": "3"},
            {"name": "example 2", "stdin": "intention\nexecution", "expected_output": "5"},
            {"name": "insert one", "stdin": "a\nab", "expected_output": "1"},
            {"name": "identical", "stdin": "abc\nabc", "expected_output": "0"},
        ],
    },
]
