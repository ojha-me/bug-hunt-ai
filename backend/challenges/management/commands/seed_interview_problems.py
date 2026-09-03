from django.core.management.base import BaseCommand
from challenges.models import CodingProblem


class Command(BaseCommand):
    help = "Seed the classic interview coding canon (frequently-asked LeetCode patterns)"

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


PROBLEMS = [
    # ------------------------------------------------------------------
    # EASY
    # ------------------------------------------------------------------
    {
        "slug": "max-depth-binary-tree",
        "title": "Maximum Depth of Binary Tree",
        "difficulty": "easy",
        "topics": ["Trees", "DFS", "BFS"],
        "description": (
            "Given the root of a binary tree, return its **maximum depth** — the number of nodes along "
            "the longest path from the root down to the farthest leaf node.\n\n"
            "**Input format**\n\n"
            "A single line: the tree in level-order, space-separated, using `null` for missing children.\n\n"
            "**Output format**\n\n"
            "The maximum depth (integer)."
        ),
        "examples": [
            {"input": "3 9 20 null null 15 7", "output": "3", "explanation": "Longest path 3->20->15 (depth 3)"},
            {"input": "1 null 2", "output": "2", "explanation": ""},
        ],
        "constraints": ["1 <= number of nodes <= 10^4", "-100 <= node value <= 100"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    vals = sys.stdin.read().strip().split()\n"
            "    # TODO: build the tree (level order, 'null' = no child) and return its max depth.\n"
            "    # Count the number of levels; an empty string means 0 levels.\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "3 9 20 null null 15 7", "expected_output": "3"},
            {"name": "example 2", "stdin": "1 null 2", "expected_output": "2"},
            {"name": "single root", "stdin": "1", "expected_output": "1"},
            {"name": "skewed left", "stdin": "1 2 null 3 null 4 null", "expected_output": "4"},
        ],
    },
    {
        "slug": "invert-binary-tree",
        "title": "Invert Binary Tree",
        "difficulty": "easy",
        "topics": ["Trees", "Recursion"],
        "description": (
            "Given the root of a binary tree, invert it — swap every left and right child — and print the "
            "resulting tree in level-order, space-separated, with `null` for missing children.\n\n"
            "**Input format**\n\n"
            "A single line: the tree in level-order.\n\n"
            "**Output format**\n\n"
            "The inverted tree in level-order, space-separated."
        ),
        "examples": [
            {"input": "4 2 7 1 3 6 9", "output": "4 7 2 9 6 3 1", "explanation": "Mirror image of the tree"},
            {"input": "2 1 3", "output": "2 3 1", "explanation": ""},
        ],
        "constraints": ["1 <= number of nodes <= 10^4"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    vals = sys.stdin.read().strip().split()\n"
            "    # TODO: invert the tree, then print its level-order\n"
            "    print(' '.join(vals))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "4 2 7 1 3 6 9", "expected_output": "4 7 2 9 6 3 1"},
            {"name": "example 2", "stdin": "2 1 3", "expected_output": "2 3 1"},
            {"name": "single", "stdin": "1", "expected_output": "1"},
        ],
    },
    {
        "slug": "majority-element",
        "title": "Majority Element",
        "difficulty": "easy",
        "topics": ["Arrays", "Hash Map", "Boyer-Moore"],
        "description": (
            "Given an array of size `n`, return the **majority element** — the element that appears more "
            "than `n / 2` times. You may assume the majority element always exists.\n\n"
            "**Input format**\n\n"
            "A single line: the array (space-separated integers).\n\n"
            "**Output format**\n\n"
            "The majority element (integer)."
        ),
        "examples": [
            {"input": "3 2 3", "output": "3", "explanation": ""},
            {"input": "2 2 1 1 1 2 2", "output": "2", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^5", "-10^9 <= nums[i] <= 10^9"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().strip().split()))\n"
            "    # TODO: majority element (appears > n/2 times)\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "3 2 3", "expected_output": "3"},
            {"name": "example 2", "stdin": "2 2 1 1 1 2 2", "expected_output": "2"},
            {"name": "single", "stdin": "5", "expected_output": "5"},
        ],
    },
    {
        "slug": "merge-sorted-array",
        "title": "Merge Two Sorted Arrays",
        "difficulty": "easy",
        "topics": ["Arrays", "Two Pointers"],
        "description": (
            "Given two sorted arrays `a` and `b`, merge them into one sorted array.\n\n"
            "**Input format**\n\n"
            "First line: array `a` (space-separated integers, sorted ascending).\n"
            "Second line: array `b` (space-separated integers, sorted ascending).\n\n"
            "**Output format**\n\n"
            "The merged array, space-separated."
        ),
        "examples": [
            {"input": "1 2 3\n2 5 6", "output": "1 2 2 3 5 6", "explanation": ""},
            {"input": "0\n1", "output": "0 1", "explanation": ""},
        ],
        "constraints": ["0 <= len(a), len(b) <= 10^4", "both arrays sorted ascending"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().splitlines()\n"
            "    a = list(map(int, lines[0].split())) if lines and lines[0].strip() else []\n"
            "    b = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []\n"
            "    # TODO: merge a and b\n"
            "    print(' '.join(map(str, sorted(a + b))))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 2 3\n2 5 6", "expected_output": "1 2 2 3 5 6"},
            {"name": "example 2", "stdin": "0\n1", "expected_output": "0 1"},
            {"name": "empty a", "stdin": "\n1 2", "expected_output": "1 2"},
        ],
    },
    {
        "slug": "ransom-note",
        "title": "Ransom Note",
        "difficulty": "easy",
        "topics": ["Hash Map", "Strings"],
        "description": (
            "Given two strings `ransomNote` and `magazine`, print `true` if `ransomNote` can be constructed "
            "using only the letters from `magazine` (each letter used at most once), otherwise `false`.\n\n"
            "**Input format**\n\n"
            "First line: `ransomNote`.\n"
            "Second line: `magazine`.\n\n"
            "**Output format**\n\n"
            "`true` or `false`."
        ),
        "examples": [
            {"input": "aa\nab", "output": "false", "explanation": "magazine has only one 'a'"},
            {"input": "aa\naab", "output": "true", "explanation": ""},
        ],
        "constraints": ["1 <= len(s) <= 10^5", "lowercase English letters only"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().splitlines()\n"
            "    ransom = lines[0] if lines else ''\n"
            "    magazine = lines[1] if len(lines) > 1 else ''\n"
            "    # TODO: can we build ransom from magazine letters?\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "aa\nab", "expected_output": "false"},
            {"name": "example 2", "stdin": "aa\naab", "expected_output": "true"},
            {"name": "empty ransom", "stdin": "\nabc", "expected_output": "true"},
        ],
    },
    # ------------------------------------------------------------------
    # MEDIUM
    # ------------------------------------------------------------------
    {
        "slug": "product-except-self",
        "title": "Product of Array Except Self",
        "difficulty": "medium",
        "topics": ["Arrays", "Prefix Sum"],
        "description": (
            "Given an array of integers, return an array such that `answer[i]` equals the product of all "
            "elements except `nums[i]`. Do **not** use division, and solve in O(n) time.\n\n"
            "**Input format**\n\n"
            "A single line: the array (space-separated integers).\n\n"
            "**Output format**\n\n"
            "The answer array, space-separated."
        ),
        "examples": [
            {"input": "1 2 3 4", "output": "24 12 8 6", "explanation": "product of all except index i"},
            {"input": "-1 1 0 -3 3", "output": "0 0 9 0 0", "explanation": "any product with 0 is 0"},
        ],
        "constraints": ["2 <= n <= 10^5", "-30 <= nums[i] <= 30"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().strip().split()))\n"
            "    # TODO: prefix/suffix products without division\n"
            "    print('0')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 2 3 4", "expected_output": "24 12 8 6"},
            {"name": "example 2", "stdin": "-1 1 0 -3 3", "expected_output": "0 0 9 0 0"},
            {"name": "negatives", "stdin": "-1 -2 -3", "expected_output": "6 3 2"},
        ],
    },
    {
        "slug": "three-sum",
        "title": "3Sum",
        "difficulty": "medium",
        "topics": ["Arrays", "Two Pointers", "Sorting"],
        "description": (
            "Given an integer array, return all unique triplets `[a, b, c]` such that `a + b + c = 0`. "
            "Each triplet must be printed in ascending order (`a <= b <= c`), and the triplets themselves "
            "printed in ascending lexicographic order, one per line. Print nothing if there are none.\n\n"
            "**Input format**\n\n"
            "A single line: the array (space-separated integers).\n\n"
            "**Output format**\n\n"
            "One triplet per line as `a b c`, sorted lexicographically."
        ),
        "examples": [
            {"input": "-1 0 1 2 -1 -4", "output": "-1 -1 2\n-1 0 1", "explanation": "the two unique triplets"},
            {"input": "0 0 0", "output": "0 0 0", "explanation": "single triplet"},
            {"input": "1 2 3", "output": "", "explanation": "no triplet sums to 0"},
        ],
        "constraints": ["1 <= n <= 3*10^3", "-10^5 <= nums[i] <= 10^5"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    nums = list(map(int, sys.stdin.read().strip().split()))\n"
            "    # TODO: sort, then fix one element and two-pointer the rest.\n"
            "    # Print each unique triplet as 'a b c' (sorted), one per line.\n"
            "\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "-1 0 1 2 -1 -4", "expected_output": "-1 -1 2\n-1 0 1"},
            {"name": "example 2", "stdin": "0 0 0", "expected_output": "0 0 0"},
            {"name": "example 3", "stdin": "1 2 3", "expected_output": ""},
        ],
    },
    {
        "slug": "group-anagrams",
        "title": "Group Anagrams",
        "difficulty": "medium",
        "topics": ["Hash Map", "Strings", "Sorting"],
        "description": (
            "Given a list of words, group the anagrams together. Print each group on its own line with the "
            "words space-separated. Groups are printed in order of first appearance; words within a group "
            "are printed in ascending (sorted) order.\n\n"
            "**Input format**\n\n"
            "A single line: the words, space-separated.\n\n"
            "**Output format**\n\n"
            "One anagram group per line."
        ),
        "examples": [
            {"input": "eat tea tan ate nat bat", "output": "ate eat tea\nnat tan\nbat", "explanation": ""},
            {"input": "a", "output": "a", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^4", "1 <= len(word) <= 100", "lowercase letters only"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    words = sys.stdin.read().strip().split()\n"
            "    # TODO: group by sorted(word) as key\n"
            "    print(' '.join(sorted(words)))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "eat tea tan ate nat bat", "expected_output": "ate eat tea\nnat tan\nbat"},
            {"name": "example 2", "stdin": "a", "expected_output": "a"},
            {"name": "no anagrams", "stdin": "cat dog pig", "expected_output": "cat\ndog\npig"},
        ],
    },
    {
        "slug": "top-k-frequent",
        "title": "Top K Frequent Elements",
        "difficulty": "medium",
        "topics": ["Hash Map", "Heap", "Bucket Sort"],
        "description": (
            "Given an array and an integer `k`, print the `k` most frequent elements. Element order: "
            "descending by frequency; ties broken by ascending value.\n\n"
            "**Input format**\n\n"
            "First line: the array (space-separated integers).\n"
            "Second line: `k`.\n\n"
            "**Output format**\n\n"
            "The top `k` elements, space-separated."
        ),
        "examples": [
            {"input": "1 1 1 2 2 3\n2", "output": "1 2", "explanation": "1 appears 3x, 2 appears 2x"},
            {"input": "1\n1", "output": "1", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 10^5", "1 <= k <= number of distinct values"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    data = sys.stdin.read().strip().split()\n"
            "    if not data:\n"
            "        return\n"
            "    k = int(data[-1])\n"
            "    nums = list(map(int, data[:-1]))\n"
            "    # TODO: count frequencies, pick top k (heap or buckets)\n"
            "    print('')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 1 1 2 2 3\n2", "expected_output": "1 2"},
            {"name": "example 2", "stdin": "1\n1", "expected_output": "1"},
            {"name": "tie by value", "stdin": "3 1 3 2 1 2 4\n2", "expected_output": "1 2"},
        ],
    },
    {
        "slug": "number-of-islands",
        "title": "Number of Islands",
        "difficulty": "medium",
        "topics": ["Graph", "DFS", "BFS"],
        "description": (
            "Given an `r x c` grid of `'0'` (water) and `'1'` (land), count the number of islands. An island "
            "is a group of connected `'1'`s (connected horizontally or vertically).\n\n"
            "**Input format**\n\n"
            "First line: `r c`.\n"
            "Next `r` lines: each a string of `'0'`/`'1'` of length `c`.\n\n"
            "**Output format**\n\n"
            "The number of islands (integer)."
        ),
        "examples": [
            {"input": "4 5\n11000\n11000\n00100\n00011", "output": "3", "explanation": ""},
            {"input": "1 1\n1", "output": "1", "explanation": ""},
        ],
        "constraints": ["1 <= r, c <= 300"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().strip().splitlines()\n"
            "    r, c = map(int, lines[0].split())\n"
            "    grid = [list(lines[i]) for i in range(1, r + 1)]\n"
            "    # TODO: count connected components of '1'\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "4 5\n11000\n11000\n00100\n00011", "expected_output": "3"},
            {"name": "example 2", "stdin": "1 1\n1", "expected_output": "1"},
            {"name": "water only", "stdin": "2 2\n00\n00", "expected_output": "0"},
        ],
    },
    {
        "slug": "validate-bst",
        "title": "Validate Binary Search Tree",
        "difficulty": "medium",
        "topics": ["Trees", "DFS", "Inorder"],
        "description": (
            "Given the root of a binary tree, print `true` if it is a valid binary search tree (BST), "
            "otherwise `false`. A valid BST has, for every node, all nodes in the left subtree smaller "
            "and all nodes in the right subtree larger — using the strict rule (no duplicates allowed).\n\n"
            "**Input format**\n\n"
            "A single line: the tree in level-order, `null` for missing children.\n\n"
            "**Output format**\n\n"
            "`true` or `false`."
        ),
        "examples": [
            {"input": "2 1 3", "output": "true", "explanation": ""},
            {"input": "5 1 4 null null 3 6", "output": "false", "explanation": "right subtree contains 3 < 5"},
        ],
        "constraints": ["1 <= number of nodes <= 10^4", "-2^31 <= node value <= 2^31 - 1"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    vals = sys.stdin.read().strip().split()\n"
            "    # TODO: validate BST with (min, max) bounds per subtree\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2 1 3", "expected_output": "true"},
            {"name": "example 2", "stdin": "5 1 4 null null 3 6", "expected_output": "false"},
            {"name": "single", "stdin": "5", "expected_output": "true"},
        ],
    },
    {
        "slug": "rotate-image",
        "title": "Rotate Image",
        "difficulty": "medium",
        "topics": ["Matrix", "Arrays"],
        "description": (
            "Given an `n x n` matrix, rotate it 90 degrees **clockwise** in place and print the result.\n\n"
            "**Input format**\n\n"
            "First line: `n`.\n"
            "Next `n` lines: `n` space-separated integers each.\n\n"
            "**Output format**\n\n"
            "The rotated matrix, `n` lines."
        ),
        "examples": [
            {"input": "3\n1 2 3\n4 5 6\n7 8 9", "output": "7 4 1\n8 5 2\n9 6 3", "explanation": "clockwise rotation"},
            {"input": "2\n1 2\n3 4", "output": "3 1\n4 2", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 100", "-1000 <= matrix[i][j] <= 1000"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().strip().splitlines()\n"
            "    n = int(lines[0])\n"
            "    m = [list(map(int, lines[i].split())) for i in range(1, n + 1)]\n"
            "    # TODO: rotate clockwise (transpose then reverse rows)\n"
            "    for row in m:\n"
            "        print(' '.join(map(str, row)))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "3\n1 2 3\n4 5 6\n7 8 9", "expected_output": "7 4 1\n8 5 2\n9 6 3"},
            {"name": "example 2", "stdin": "2\n1 2\n3 4", "expected_output": "3 1\n4 2"},
        ],
    },
    {
        "slug": "lru-cache",
        "title": "LRU Cache",
        "difficulty": "medium",
        "topics": ["Design", "Hash Map", "Linked List"],
        "description": (
            "Design an LRU (least recently used) cache. It supports two operations:\n"
            "- `put k v`: insert key `k` with value `v` (or update if present). If the cache is full, evict "
            "the least recently used key first.\n"
            "- `get k`: return the value for `k` (which also marks it as most recently used), or `-1`.\n\n"
            "**Input format**\n\n"
            "First line: capacity `capacity`.\n"
            "Second line: number of operations `n`.\n"
            "Next `n` lines: each is `get k` or `put k v`.\n\n"
            "**Output format**\n\n"
            "One line per `get` operation: its result or `-1`."
        ),
        "examples": [
            {"input": "2\n7\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4",
             "output": "1\n-1\n-1\n3\n4",
             "explanation": "after put 1 1, 2 2 → get 1=1; put 3 evicts 2; get 2=-1; put 4 evicts 1; get 3=3, get 4=4"},
        ],
        "constraints": ["1 <= capacity <= 10^3", "1 <= n <= 10^4", "0 <= k, v <= 10^6"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().splitlines()\n"
            "    capacity = int(lines[0])\n"
            "    n = int(lines[1])\n"
            "    cache = {}  # TODO: use an ordered structure for LRU ordering\n"
            "    for i in range(2, 2 + n):\n"
            "        parts = lines[i].split()\n"
            "        if parts[0] == 'get':\n"
            "            k = parts[1]\n"
            "            print(cache.get(k, -1))\n"
            "        else:\n"
            "            k, v = parts[1], int(parts[2])\n"
            "            cache[k] = v\n"
            "            if len(cache) > capacity:\n"
            "                # TODO: evict the least recently used key\n"
            "                pass\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2\n7\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4",
             "expected_output": "1\n-1\n-1\n3\n4"},
            {"name": "capacity 1", "stdin": "1\n3\nput 1 1\nput 2 2\nget 1", "expected_output": "-1"},
            {"name": "update keeps recency", "stdin": "2\n4\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nget 1",
             "expected_output": "1\n-1\n1"},
        ],
    },
    {
        "slug": "course-schedule",
        "title": "Course Schedule",
        "difficulty": "medium",
        "topics": ["Graph", "Topological Sort", "DFS"],
        "description": (
            "There are `numCourses` courses labelled `0` to `numCourses-1`. You are given prerequisite pairs "
            "`a b` meaning course `a` cannot be taken until course `b` is completed first. Print `true` if "
            "you can finish all courses (no cycle in the dependency graph), otherwise `false`.\n\n"
            "**Input format**\n\n"
            "First line: `numCourses m` (m = number of prerequisite pairs).\n"
            "Next `m` lines: `a b`.\n\n"
            "**Output format**\n\n"
            "`true` or `false`."
        ),
        "examples": [
            {"input": "2 1\n1 0", "output": "true", "explanation": "take 0 then 1"},
            {"input": "2 2\n1 0\n0 1", "output": "false", "explanation": "cycle → impossible"},
        ],
        "constraints": ["1 <= numCourses <= 2000", "0 <= m <= numCourses^2"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().strip().splitlines()\n"
            "    n, m = map(int, lines[0].split())\n"
            "    prereqs = [tuple(map(int, line.split())) for line in lines[1:1 + m]]\n"
            "    # TODO: detect cycle via Kahn's algorithm (in-degree) or DFS colors\n"
            "    print('false')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "2 1\n1 0", "expected_output": "true"},
            {"name": "example 2", "stdin": "2 2\n1 0\n0 1", "expected_output": "false"},
            {"name": "chain", "stdin": "4 3\n1 0\n2 1\n3 2", "expected_output": "true"},
        ],
    },
    # ------------------------------------------------------------------
    # HARD
    # ------------------------------------------------------------------
    {
        "slug": "merge-k-sorted-lists",
        "title": "Merge K Sorted Lists",
        "difficulty": "hard",
        "topics": ["Heap", "Linked List", "Divide & Conquer"],
        "description": (
            "Given `k` sorted lists, merge them into one sorted list.\n\n"
            "**Input format**\n\n"
            "First line: `k`.\n"
            "Next `k` lines: each a space-separated sorted list (may be empty).\n\n"
            "**Output format**\n\n"
            "The merged sorted list, space-separated (empty line if empty)."
        ),
        "examples": [
            {"input": "3\n1 4 5\n1 3 4\n2 6", "output": "1 1 2 3 4 4 5 6", "explanation": ""},
            {"input": "2\n\n1 2", "output": "1 2", "explanation": "one list empty"},
        ],
        "constraints": ["1 <= k <= 10^4", "total elements across lists <= 10^5", "-10^4 <= value <= 10^4"],
        "starter_code": (
            "import sys, heapq\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().splitlines()\n"
            "    k = int(lines[0])\n"
            "    lists = [list(map(int, lines[i].split())) for i in range(1, k + 1)]\n"
            "    # TODO: min-heap over list heads, or pairwise merge\n"
            "    merged = []\n"
            "    print(' '.join(map(str, merged)))\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "3\n1 4 5\n1 3 4\n2 6", "expected_output": "1 1 2 3 4 4 5 6"},
            {"name": "example 2", "stdin": "2\n\n1 2", "expected_output": "1 2"},
            {"name": "equal values", "stdin": "2\n1 1 1\n1", "expected_output": "1 1 1 1"},
        ],
    },
    {
        "slug": "trapping-rain-water",
        "title": "Trapping Rain Water",
        "difficulty": "hard",
        "topics": ["Two Pointers", "Stack", "Arrays"],
        "description": (
            "Given `n` non-negative integers representing an elevation map (bar heights), compute how much "
            "water it can trap after raining.\n\n"
            "**Input format**\n\n"
            "A single line: the heights (space-separated integers).\n\n"
            "**Output format**\n\n"
            "The total trapped water (integer)."
        ),
        "examples": [
            {"input": "0 1 0 2 1 0 1 3 2 1 2 1", "output": "6", "explanation": ""},
            {"input": "4 2 0 3 2 5", "output": "9", "explanation": ""},
        ],
        "constraints": ["1 <= n <= 2*10^4", "0 <= height[i] <= 10^5"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    h = list(map(int, sys.stdin.read().strip().split()))\n"
            "    # TODO: two-pointer: at each cell, water = min(maxLeft, maxRight) - h\n"
            "    print(0)\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "0 1 0 2 1 0 1 3 2 1 2 1", "expected_output": "6"},
            {"name": "example 2", "stdin": "4 2 0 3 2 5", "expected_output": "9"},
            {"name": "flat", "stdin": "1 1 1", "expected_output": "0"},
        ],
    },
    {
        "slug": "sliding-window-maximum",
        "title": "Sliding Window Maximum",
        "difficulty": "hard",
        "topics": ["Sliding Window", "Monotonic Deque", "Heap"],
        "description": (
            "Given an array and a window size `k`, print the maximum element of each window of size `k`, "
            "scanning left to right.\n\n"
            "**Input format**\n\n"
            "First line: the array (space-separated integers).\n"
            "Second line: `k`.\n\n"
            "**Output format**\n\n"
            "The window maximums, space-separated."
        ),
        "examples": [
            {"input": "1 3 -1 -3 5 3 6 7\n3", "output": "3 3 5 5 6 7", "explanation": "one max per window"},
            {"input": "1\n1", "output": "1", "explanation": ""},
        ],
        "constraints": ["1 <= k <= n <= 10^5", "-10^4 <= value <= 10^4"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    data = sys.stdin.read().strip().split()\n"
            "    if not data:\n"
            "        return\n"
            "    k = int(data[-1])\n"
            "    nums = list(map(int, data[:-1]))\n"
            "    # TODO: monotonic deque storing indices, pop expired front\n"
            "    print('')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 3 -1 -3 5 3 6 7\n3", "expected_output": "3 3 5 5 6 7"},
            {"name": "example 2", "stdin": "1\n1", "expected_output": "1"},
            {"name": "decreasing", "stdin": "9 8 7 6 5\n2", "expected_output": "9 8 7 6"},
        ],
    },
    {
        "slug": "median-two-sorted-arrays",
        "title": "Median of Two Sorted Arrays",
        "difficulty": "hard",
        "topics": ["Binary Search", "Arrays", "Divide & Conquer"],
        "description": (
            "Given two sorted arrays, return the **median** of the two combined arrays in O(log(min(n, m))) "
            "time. Print the median formatted to **5 decimal places**.\n\n"
            "**Input format**\n\n"
            "First line: array `a` (space-separated integers, sorted ascending).\n"
            "Second line: array `b` (space-separated integers, sorted ascending).\n\n"
            "**Output format**\n\n"
            "The median as a float with 5 decimals."
        ),
        "examples": [
            {"input": "1 3\n2", "output": "2.00000", "explanation": "merged [1,2,3], median 2"},
            {"input": "1 2\n3 4", "output": "2.50000", "explanation": "merged [1,2,3,4], median (2+3)/2"},
        ],
        "constraints": ["0 <= n, m <= 10^3", "0 <= n + m <= 2000", "-10^6 <= value <= 10^6"],
        "starter_code": (
            "import sys\n\n"
            "def main():\n"
            "    lines = sys.stdin.read().splitlines()\n"
            "    a = list(map(int, lines[0].split())) if lines and lines[0].strip() else []\n"
            "    b = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []\n"
            "    # TODO: binary search the partition on the smaller array\n"
            "    m = 0.0\n"
            "    print(f'{m:.5f}')\n\n"
            "if __name__ == '__main__':\n"
            "    main()"
        ),
        "test_cases": [
            {"name": "example 1", "stdin": "1 3\n2", "expected_output": "2.00000"},
            {"name": "example 2", "stdin": "1 2\n3 4", "expected_output": "2.50000"},
            {"name": "empty array", "stdin": "\n1 2 3", "expected_output": "2.00000"},
        ],
    },
]