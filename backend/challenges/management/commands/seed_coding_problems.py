from django.core.management.base import BaseCommand
from challenges.models import CodingProblem


class Command(BaseCommand):
    help = 'Seed a curated library of coding problems (with test cases)'

    def handle(self, *args, **options):
        created_any = False
        for problem in PROBLEMS:
            obj, created = CodingProblem.objects.get_or_create(
                slug=problem["slug"],
                defaults={
                    "title": problem["title"],
                    "difficulty": problem["difficulty"],
                    "topics": problem["topics"],
                    "description": problem["description"],
                    "examples": problem["examples"],
                    "constraints": problem["constraints"],
                    "starter_code": problem["starter_code"],
                    "test_cases": problem["test_cases"],
                },
            )
            if created:
                created_any = True
                self.stdout.write(f"Created problem: {obj.title}")
            else:
                obj.title = problem["title"]
                obj.difficulty = problem["difficulty"]
                obj.topics = problem["topics"]
                obj.description = problem["description"]
                obj.examples = problem["examples"]
                obj.constraints = problem["constraints"]
                obj.starter_code = problem["starter_code"]
                obj.test_cases = problem["test_cases"]
                obj.save(update_fields=["title", "difficulty", "topics", "description",
                                        "examples", "constraints", "starter_code", "test_cases"])

        if not created_any:
            self.stdout.write("All problems already up to date.")


PROBLEMS = [
    # ------------------------------------------------------------------
    # EASY
    # ------------------------------------------------------------------
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "easy",
        "topics": ["Arrays", "Hash Map"],
        "description": (
            "Given an array of integers `nums` and an integer `target`, return the indices of the "
            "two numbers that add up to `target`.\n\n"
            "You may assume that exactly one solution exists, and you may not use the same element twice.\n\n"
            "**Input format**\n\n"
            "First line: the array (space-separated integers).\n"
            "Second line: the target integer.\n\n"
            "**Output format**\n\n"
            "Two space-separated indices (0-based), in any order."
        ),
        "examples": [
            {"input": "2 7 11 15\n9", "output": "0 1", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
            {"input": "3 2 4\n6", "output": "1 2", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"},
        ],
        "constraints": [
            "2 <= n <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Exactly one valid answer exists.",
        ],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    data = sys.stdin.read().strip().split()\n"
            "    if not data:\n"
            "        return\n"
            "    nums = list(map(int, data[:-1]))\n"
            "    target = int(data[-1])\n"
            "    # TODO: find indices of the two numbers that add up to target\n"
            "    result = []\n"
            "    print(' '.join(map(str, result)))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2 7 11 15\n9", "expected_output": "0 1"},
            {"name": "example 2", "stdin": "3 2 4\n6", "expected_output": "1 2"},
            {"name": "duplicate values", "stdin": "3 3\n6", "expected_output": "0 1"},
            {"name": "negative numbers", "stdin": "-1 -2 -3 -4\n-7", "expected_output": "0 3"},
        ],
    },
    {
        "slug": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "easy",
        "topics": ["Stack", "Strings"],
        "description": (
            "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, "
            "determine if the input string is valid.\n\n"
            "A string is valid if:\n"
            "- Open brackets are closed by the same type of bracket.\n"
            "- Open brackets are closed in the correct order.\n\n"
            "**Input format**\n\n"
            "A single line containing the string `s`.\n\n"
            "**Output format**\n\n"
            "`true` if valid, otherwise `false`."
        ),
        "examples": [
            {"input": "()[]{}", "output": "true", "explanation": "Every bracket matches in order"},
            {"input": "([)]", "output": "false", "explanation": "Brackets interleave incorrectly"},
        ],
        "constraints": [
            "0 <= len(s) <= 10^5",
            "s consists of parentheses, brackets and braces",
        ],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    s = sys.stdin.read().strip()\n"
            "    # TODO: validate the parenthesis order (use a stack)\n"
            "    print('true')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "simple", "stdin": "()", "expected_output": "true"},
            {"name": "all types", "stdin": "()[]{}", "expected_output": "true"},
            {"name": "mismatch", "stdin": "(]", "expected_output": "false"},
            {"name": "wrong nesting", "stdin": "([)]", "expected_output": "false"},
        ],
    },
    {
        "slug": "reverse-string",
        "title": "Reverse a String",
        "difficulty": "easy",
        "topics": ["Strings", "Two Pointers"],
        "description": (
            "Given a string `s`, reverse it in place and print the result.\n\n"
            "**Input format**\n\n"
            "A single line containing the string.\n\n"
            "**Output format**\n\n"
            "The reversed string."
        ),
        "examples": [
            {"input": "hello", "output": "olleh", "explanation": ""},
            {"input": "abc 123", "output": "321 cba", "explanation": "Spaces are preserved in position"},
        ],
        "constraints": [
            "1 <= len(s) <= 10^5",
            "s consists of printable ASCII characters",
        ],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    s = sys.stdin.read().strip()\n"
            "    # TODO: reverse the string\n"
            "    print(s)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "hello", "expected_output": "olleh"},
            {"name": "with space", "stdin": "abc 123", "expected_output": "321 cba"},
            {"name": "single char", "stdin": "a", "expected_output": "a"},
        ],
    },
    {
        "slug": "valid-palindrome",
        "title": "Valid Palindrome",
        "difficulty": "easy",
        "topics": ["Strings", "Two Pointers"],
        "description": (
            "A phrase is a palindrome if, after converting all uppercase letters to lowercase and "
            "**ignoring all non-alphanumeric characters**, it reads the same forward and backward.\n\n"
            "Given a string `s`, print `true` if it is a palindrome, otherwise `false`.\n\n"
            "**Input format**\n\n"
            "A single line containing the string.\n\n"
            "**Output format**\n\n"
            "`true` or `false`."
        ),
        "examples": [
            {"input": "A man a plan a canal Panama", "output": "true", "explanation": ""},
            {"input": "race a car", "output": "false", "explanation": ""},
        ],
        "constraints": [
            "1 <= len(s) <= 10^5",
            "s contains printable ASCII characters",
        ],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    s = sys.stdin.read().strip()\n"
            "    # TODO: check palindrome after normalizing (lowercase, alnum only)\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "A man a plan a canal Panama", "expected_output": "true"},
            {"name": "example 2", "stdin": "race a car", "expected_output": "false"},
            {"name": "word", "stdin": "racecar", "expected_output": "true"},
            {"name": "punctuation", "stdin": "level!", "expected_output": "true"},
        ],
    },
    {
        "slug": "fizzbuzz",
        "title": "FizzBuzz",
        "difficulty": "easy",
        "topics": ["Basics"],
        "description": (
            "Print the numbers from 1 to `n`, one per line, but:\n"
            "- print `Fizz` for multiples of 3\n"
            "- print `Buzz` for multiples of 5\n"
            "- print `FizzBuzz` for multiples of both\n\n"
            "**Input format**\n\n"
            "A single integer `n`.\n\n"
            "**Output format**\n\n"
            "`n` lines, one per number 1..n."
        ),
        "examples": [
            {"input": "5", "output": "1\n2\nFizz\n4\nBuzz", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^4"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    n = int(sys.stdin.read().strip())\n"
            "    # TODO: implement FizzBuzz for 1..n\n"
            "\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example", "stdin": "5", "expected_output": "1\n2\nFizz\n4\nBuzz"},
            {"name": "fizzbuzz edge", "stdin": "15",
             "expected_output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz"},
        ],
    },
    {
        "slug": "contains-duplicate",
        "title": "Contains Duplicate",
        "difficulty": "easy",
        "topics": ["Arrays", "Hash Set"],
        "description": (
            "Given an integer array, print `true` if any value appears more than once, otherwise `false`.\n\n"
            "**Input format**\n\n"
            "A single line: the array (space-separated integers).\n\n"
            "**Output format**\n\n"
            "`true` or `false`."
        ),
        "examples": [
            {"input": "1 2 3 1", "output": "true", "explanation": "1 appears twice"},
            {"input": "1 2 3 4", "output": "false", "explanation": "all distinct"},
        ],
        "constraints": ["1 <= n <= 10^5", "-10^9 <= nums[i] <= 10^9"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    data = sys.stdin.read().strip().split()\n"
            "    nums = list(map(int, data))\n"
            "    # TODO: detect duplicates\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "has duplicate", "stdin": "1 2 3 1", "expected_output": "true"},
            {"name": "all unique", "stdin": "1 2 3 4", "expected_output": "false"},
            {"name": "long duplicate", "stdin": "1 5 -2 4 5", "expected_output": "true"},
        ],
    },
    {
        "slug": "move-zeroes",
        "title": "Move Zeroes",
        "difficulty": "easy",
        "topics": ["Arrays", "Two Pointers"],
        "description": (
            "Given an integer array, move all zeroes to the end of it **while maintaining the relative "
            "order of the non-zero elements**.\n\n"
            "**Input format**\n\n"
            "A single line: the array (space-separated integers).\n\n"
            "**Output format**\n\n"
            "The transformed array, space-separated."
        ),
        "examples": [
            {"input": "0 1 0 3 12", "output": "1 3 12 0 0", "explanation": ""},
            {"input": "0", "output": "0", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^5", "0 <= nums[i] <= 10^9"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().strip().split()))\n"
            "    # TODO: move zeroes to the end in place\n"
            "    print(' '.join(map(str, nums)))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "0 1 0 3 12", "expected_output": "1 3 12 0 0"},
            {"name": "single zero", "stdin": "0", "expected_output": "0"},
            {"name": "leading zeroes", "stdin": "0 0 1", "expected_output": "1 0 0"},
        ],
    },
    {
        "slug": "first-non-repeating",
        "title": "First Non-Repeating Character",
        "difficulty": "easy",
        "topics": ["Strings", "Hash Map"],
        "description": (
            "Given a string `s`, return the **index** of the first non-repeating character (0-based). "
            "If none exists, print `-1`.\n\n"
            "**Input format**\n\n"
            "A single line containing the string.\n\n"
            "**Output format**\n\n"
            "The 0-based index, or `-1`."
        ),
        "examples": [
            {"input": "leetcode", "output": "0", "explanation": "l is the first non-repeating"},
            {"input": "loveleetcode", "output": "2", "explanation": "v is first non-repeating"},
            {"input": "aabb", "output": "-1", "explanation": "every character repeats"},
        ],
        "constraints": ["1 <= len(s) <= 10^5", "s consists of lowercase English letters"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    s = sys.stdin.read().strip()\n"
            "    # TODO: find index of first non-repeating character\n"
            "    print(-1)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "leetcode", "expected_output": "0"},
            {"name": "example 2", "stdin": "loveleetcode", "expected_output": "2"},
            {"name": "example 3", "stdin": "aabb", "expected_output": "-1"},
        ],
    },
    {
        "slug": "valid-anagram",
        "title": "Valid Anagram",
        "difficulty": "easy",
        "topics": ["Strings", "Hash Map"],
        "description": (
            "Two strings are anagrams if the second is a rearrangement of the letters of the first. "
            "Print `true` if `s` and `t` are anagrams, otherwise `false`.\n\n"
            "**Input format**\n\n"
            "First line: string `s`.\n"
            "Second line: string `t`.\n\n"
            "**Output format**\n\n"
            "`true` or `false`."
        ),
        "examples": [
            {"input": "anagram\nnagaram", "output": "true", "explanation": ""},
            {"input": "rat\ncar", "output": "false", "explanation": ""},
        ],
        "constraints": ["1 <= len(s), len(t) <= 5*10^4", "strings consist of lowercase English letters"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().splitlines()\n"
            "    s = lines[0] if lines else ''\n"
            "    t = lines[1] if len(lines) > 1 else ''\n"
            "    # TODO: check if t is an anagram of s\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "anagram\nnagaram", "expected_output": "true"},
            {"name": "example 2", "stdin": "rat\ncar", "expected_output": "false"},
            {"name": "same word", "stdin": "listen\nsilent", "expected_output": "true"},
        ],
    },
    # ------------------------------------------------------------------
    # MEDIUM
    # ------------------------------------------------------------------
    {
        "slug": "climbing-stairs",
        "title": "Climbing Stairs",
        "difficulty": "medium",
        "topics": ["Dynamic Programming"],
        "description": (
            "You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. "
            "Print the number of **distinct** ways you can reach the top.\n\n"
            "**Input format**\n\n"
            "A single integer `n`.\n\n"
            "**Output format**\n\n"
            "The number of distinct ways."
        ),
        "examples": [
            {"input": "2", "output": "2", "explanation": "1+1 or 2"},
            {"input": "3", "output": "3", "explanation": "1+1+1, 1+2, 2+1"},
        ],
        "constraints": ["1 <= n <= 45"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    n = int(sys.stdin.read().strip())\n"
            "    # TODO: count distinct ways to climb n stairs\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2", "expected_output": "2"},
            {"name": "example 2", "stdin": "3", "expected_output": "3"},
            {"name": "fib bigger", "stdin": "5", "expected_output": "8"},
        ],
    },
    {
        "slug": "binary-search",
        "title": "Binary Search",
        "difficulty": "medium",
        "topics": ["Binary Search"],
        "description": (
            "Given a **sorted** array and a target value, return the index of the target, or `-1` if it "
            "is not present. Implement O(log n) binary search.\n\n"
            "**Input format**\n\n"
            "First line: the sorted array (space-separated integers).\n"
            "Second line: the target integer.\n\n"
            "**Output format**\n\n"
            "The 0-based index, or `-1`."
        ),
        "examples": [
            {"input": "1 3 5 7 9\n5", "output": "2", "explanation": ""},
            {"input": "1 2 3 4 5\n6", "output": "-1", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^4", "array is sorted ascending", "values fit in a signed 32-bit integer"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    data = sys.stdin.read().strip().split()\n"
            "    if not data:\n"
            "        return\n"
            "    nums = list(map(int, data[:-1]))\n"
            "    target = int(data[-1])\n"
            "    # TODO: binary search for target\n"
            "    print(-1)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 3 5 7 9\n5", "expected_output": "2"},
            {"name": "example 2", "stdin": "1 2 3 4 5\n6", "expected_output": "-1"},
            {"name": "last element", "stdin": "2 4 6 8 10\n10", "expected_output": "4"},
        ],
    },
    {
        "slug": "max-subarray",
        "title": "Maximum Subarray",
        "difficulty": "medium",
        "topics": ["Arrays", "Dynamic Programming"],
        "description": (
            "Given an integer array, find the contiguous subarray with the largest sum and print that sum "
            "(Kadane's algorithm).\n\n"
            "**Input format**\n\n"
            "A single line: the array (space-separated integers).\n\n"
            "**Output format**\n\n"
            "The maximum subarray sum."
        ),
        "examples": [
            {"input": "-2 1 -3 4 -1 2 1 -5 4", "output": "6", "explanation": "[4,-1,2,1] has the largest sum 6"},
            {"input": "1", "output": "1", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^5", "-10^4 <= nums[i] <= 10^4"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().strip().split()))\n"
            "    # TODO: Kadane's algorithm for max subarray sum\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6"},
            {"name": "single", "stdin": "1", "expected_output": "1"},
            {"name": "all negative", "stdin": "-1 -2 -3", "expected_output": "-1"},
        ],
    },
    {
        "slug": "best-time-to-buy",
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "medium",
        "topics": ["Arrays", "Greedy"],
        "description": (
            "Given an array of prices where `prices[i]` is the price on day `i`, print the maximum profit "
            "you can achieve by choosing one day to buy and a **later** day to sell. Return `0` if no "
            "profit is possible.\n\n"
            "**Input format**\n\n"
            "A single line: the prices (space-separated integers).\n\n"
            "**Output format**\n\n"
            "The maximum profit."
        ),
        "examples": [
            {"input": "7 1 5 3 6 4", "output": "5", "explanation": "Buy on day 2 (1), sell day 5 (6)"},
            {"input": "7 6 4 3 1", "output": "0", "explanation": "prices only fall"},
        ],
        "constraints": ["1 <= n <= 10^5", "0 <= prices[i] <= 10^4"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    prices = list(map(int, sys.stdin.read().strip().split()))\n"
            "    # TODO: track min-so-far and max profit\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "7 1 5 3 6 4", "expected_output": "5"},
            {"name": "example 2", "stdin": "7 6 4 3 1", "expected_output": "0"},
            {"name": "two days", "stdin": "1 2", "expected_output": "1"},
        ],
    },
    {
        "slug": "longest-substring",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "medium",
        "topics": ["Strings", "Sliding Window"],
        "description": (
            "Given a string `s`, print the length of the longest substring that contains no repeating "
            "characters.\n\n"
            "**Input format**\n\n"
            "A single line containing the string.\n\n"
            "**Output format**\n\n"
            "The length of the longest substring without repeating characters."
        ),
        "examples": [
            {"input": "abcabcbb", "output": "3", "explanation": "\"abc\""},
            {"input": "bbbbb", "output": "1", "explanation": "\"b\""},
            {"input": "pwwkew", "output": "3", "explanation": "\"wke\""},
        ],
        "constraints": ["0 <= len(s) <= 10^5", "s consists of English letters, digits and symbols"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    s = sys.stdin.read().strip()\n"
            "    # TODO: sliding window over s\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "abcabcbb", "expected_output": "3"},
            {"name": "example 2", "stdin": "bbbbb", "expected_output": "1"},
            {"name": "example 3", "stdin": "pwwkew", "expected_output": "3"},
        ],
    },
    {
        "slug": "merge-intervals",
        "title": "Merge Intervals",
        "difficulty": "medium",
        "topics": ["Arrays", "Sorting"],
        "description": (
            "Given an array of intervals where each interval is `[start, end]`, merge all overlapping "
            "intervals and print the non-overlapping intervals that cover all inputs.\n\n"
            "**Input format**\n\n"
            "First line: the number of intervals `n`.\n"
            "Next `n` lines: `start end` for each interval.\n\n"
            "**Output format**\n\n"
            "One merged interval per line, formatted as `start end`."
        ),
        "examples": [
            {"input": "4\n1 3\n2 6\n8 10\n15 18", "output": "1 6\n8 10\n15 18", "explanation": "1-3 and 2-6 overlap into 1-6"},
            {"input": "2\n1 4\n4 5", "output": "1 5", "explanation": "touching intervals merge"},
        ],
        "constraints": ["1 <= n <= 10^4", "0 <= start <= end <= 10^4"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().strip().splitlines()\n"
            "    if not lines:\n"
            "        return\n"
            "    n = int(lines[0])\n"
            "    intervals = [tuple(map(int, line.split())) for line in lines[1:1 + n]]\n"
            "    # TODO: sort by start, merge overlapping intervals\n"
            "    print('1 6')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "4\n1 3\n2 6\n8 10\n15 18", "expected_output": "1 6\n8 10\n15 18"},
            {"name": "example 2", "stdin": "2\n1 4\n4 5", "expected_output": "1 5"},
        ],
    },
    {
        "slug": "coin-change",
        "title": "Coin Change",
        "difficulty": "medium",
        "topics": ["Dynamic Programming"],
        "description": (
            "Given a set of coin denominations and an amount, print the **fewest number of coins** needed "
            "to make that amount, or `-1` if the amount cannot be made up.\n\n"
            "**Input format**\n\n"
            "First line: the amount `amount`.\n"
            "Second line: the coin denominations (space-separated integers).\n\n"
            "**Output format**\n\n"
            "The fewest number of coins, or `-1`."
        ),
        "examples": [
            {"input": "11\n1 2 5", "output": "3", "explanation": "5 + 5 + 1 = 11"},
            {"input": "3\n2", "output": "-1", "explanation": "cannot make 3 from coins of value 2"},
        ],
        "constraints": ["1 <= amount <= 10^4", "1 <= coins[i] <= 10^4", "1 <= len(coins) <= 12"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().strip().splitlines()\n"
            "    amount = int(lines[0])\n"
            "    coins = list(map(int, lines[1].split()))\n"
            "    # TODO: fewest coins to make amount (DP)\n"
            "    print(-1)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "11\n1 2 5", "expected_output": "3"},
            {"name": "example 2", "stdin": "3\n2", "expected_output": "-1"},
            {"name": "single coin", "stdin": "2\n1 2", "expected_output": "1"},
        ],
    },
]