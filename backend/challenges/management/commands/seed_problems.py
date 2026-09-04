"""
Canonical coding-problem seed (LeetCode-style function mode).

Each function problem carries a reference solution; at seed time we run it
through the same node<->array serialization the judge uses to COMPUTE every
`expected`, and assert it against the known example outputs. So test cases are
correct by construction. `lru-cache` is a design problem and stays stdio.

This supersedes seed_coding_problems / seed_interview_problems(_ext).
"""
import copy
import json
import heapq
import bisect
from collections import Counter, defaultdict, deque
from django.core.management.base import BaseCommand
from challenges.models import CodingProblem
from challenges.solutions import SOLUTIONS


# --------------------------- node helpers ---------------------------
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val; self.next = next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right


def build_list(arr):
    head = None
    for v in reversed(arr or []):
        head = ListNode(v, head)
    return head


def list_to_arr(node):
    out = []
    while node:
        out.append(node.val); node = node.next
    return out


def build_tree(arr):
    if not arr:
        return None
    it = iter(arr); root = TreeNode(next(it)); q = deque([root])
    while q:
        node = q.popleft()
        try: lv = next(it)
        except StopIteration: break
        if lv is not None:
            node.left = TreeNode(lv); q.append(node.left)
        try: rv = next(it)
        except StopIteration: break
        if rv is not None:
            node.right = TreeNode(rv); q.append(node.right)
    return root


def tree_to_arr(root):
    if not root:
        return []
    out = []; q = deque([root])
    while q:
        node = q.popleft()
        if node is None:
            out.append(None); continue
        out.append(node.val); q.append(node.left); q.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out


def _convert(v, t):
    if t == 'listnode': return build_list(v)
    if t == 'listnode[]': return [build_list(x) for x in v]
    if t == 'tree': return build_tree(v)
    return v


def run_ref(ref, args, param_types, return_type):
    # Deep-copy so in-place references (arg0 problems) never mutate the stored args.
    work = copy.deepcopy(args)
    conv = [_convert(work[i], param_types[i] if i < len(param_types) else 'json') for i in range(len(work))]
    res = ref(*conv)
    if return_type == 'listnode': return list_to_arr(res)
    if return_type == 'tree': return tree_to_arr(res)
    if return_type == 'arg0': return conv[0]
    return res


def canonical(value, mode):
    if mode == 'unordered' and isinstance(value, list):
        return sorted(value, key=lambda x: json.dumps(x, sort_keys=True))
    if mode == 'unordered_nested' and isinstance(value, list):
        inner = [sorted(x, key=lambda y: json.dumps(y, sort_keys=True)) if isinstance(x, list) else x for x in value]
        return sorted(inner, key=lambda x: json.dumps(x, sort_keys=True))
    return value


def make_starter(sig, node=None):
    header = "from typing import List, Optional\n\n"
    cm = ""
    if node == 'listnode':
        cm = ("# Definition for singly-linked list.\n"
              "# class ListNode:\n#     def __init__(self, val=0, next=None):\n"
              "#         self.val = val\n#         self.next = next\n")
    elif node == 'tree':
        cm = ("# Definition for a binary tree node.\n"
              "# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n"
              "#         self.val = val\n#         self.left = left\n#         self.right = right\n")
    return f"{header}{cm}class Solution:\n    def {sig}:\n        "


# --------------------------- reference solutions ---------------------------
def r_contains_duplicate(nums): return len(set(nums)) != len(nums)

def r_first_uniq(s):
    c = Counter(s)
    for i, ch in enumerate(s):
        if c[ch] == 1: return i
    return -1

def r_fizzbuzz(n):
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0: out.append("FizzBuzz")
        elif i % 3 == 0: out.append("Fizz")
        elif i % 5 == 0: out.append("Buzz")
        else: out.append(str(i))
    return out

def r_invert_tree(root):
    if root:
        root.left, root.right = r_invert_tree(root.right), r_invert_tree(root.left)
    return root

def r_last_stone(stones):
    h = [-x for x in stones]; heapq.heapify(h)
    while len(h) > 1:
        a = -heapq.heappop(h); b = -heapq.heappop(h)
        if a != b: heapq.heappush(h, -(a - b))
    return -h[0] if h else 0

def r_majority(nums):
    count = cand = 0
    for x in nums:
        if count == 0: cand = x
        count += 1 if x == cand else -1
    return cand

def r_max_depth(root):
    return 0 if not root else 1 + max(r_max_depth(root.left), r_max_depth(root.right))

def r_can_attend(intervals):
    for i in range(1, len(sorted(intervals))):
        pass
    iv = sorted(intervals)
    return all(iv[i][0] >= iv[i-1][1] for i in range(1, len(iv)))

def r_merge_sorted(a, b):
    i = j = 0; out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]: out.append(a[i]); i += 1
        else: out.append(b[j]); j += 1
    out.extend(a[i:]); out.extend(b[j:])
    return out

def r_move_zeroes(nums):
    z = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[z], nums[i] = nums[i], nums[z]; z += 1
    return None

def r_hamming(n): return bin(n).count('1')

def r_ransom(note, mag):
    c = Counter(mag)
    for ch in note:
        if c[ch] <= 0: return False
        c[ch] -= 1
    return True

def r_reverse_list(head):
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
    return prev

def r_reverse_string(s): return s[::-1]

def r_single(nums):
    x = 0
    for v in nums: x ^= v
    return x

def r_two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen: return [seen[target - x], i]
        seen[x] = i
    return []

def r_is_anagram(s, t): return Counter(s) == Counter(t)

def r_is_palindrome(s):
    f = [c.lower() for c in s if c.isalnum()]
    return f == f[::-1]

def r_is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}; st = []
    for ch in s:
        if ch in '([{': st.append(ch)
        elif not st or st.pop() != pairs.get(ch, None): return False
    return not st

def r_min_distance(a, b):
    dp = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev = dp[0]; dp[0] = i
        for j in range(1, len(b) + 1):
            cur = dp[j]
            dp[j] = prev if a[i-1] == b[j-1] else 1 + min(prev, dp[j], dp[j-1])
            prev = cur
    return dp[len(b)]

def r_median(a, b):
    m = sorted(a + b); n = len(m)
    if n % 2: return float(m[n // 2])
    return (m[n // 2 - 1] + m[n // 2]) / 2.0

def r_merge_k(lists):
    h = []
    for i, node in enumerate(lists):
        if node: heapq.heappush(h, (node.val, i, node))
    dummy = tail = ListNode()
    while h:
        val, i, node = heapq.heappop(h)
        tail.next = node; tail = node
        if node.next: heapq.heappush(h, (node.next.val, i, node.next))
    return dummy.next

def r_max_sliding(nums, k):
    dq = deque(); out = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x: dq.pop()
        dq.append(i)
        if dq[0] <= i - k: dq.popleft()
        if i >= k - 1: out.append(nums[dq[0]])
    return out

def r_trap(height):
    l, r = 0, len(height) - 1; lm = rm = res = 0
    while l < r:
        if height[l] < height[r]:
            lm = max(lm, height[l]); res += lm - height[l]; l += 1
        else:
            rm = max(rm, height[r]); res += rm - height[r]; r -= 1
    return res

def r_three_sum(nums):
    nums = sorted(nums); res = []
    for i in range(len(nums)):
        if i and nums[i] == nums[i-1]: continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0: l += 1
            elif s > 0: r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                l += 1; r -= 1
                while l < r and nums[l] == nums[l-1]: l += 1
                while l < r and nums[r] == nums[r+1]: r -= 1
    return res

def r_max_profit(prices):
    lo = float('inf'); best = 0
    for p in prices:
        lo = min(lo, p); best = max(best, p - lo)
    return best

def r_binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1

def r_climb(n):
    a, b = 1, 1
    for _ in range(n): a, b = b, a + b
    return a

def r_coin_change(coins, amount):
    dp = [0] + [float('inf')] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a: dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1

def r_max_area(height):
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]: l += 1
        else: r -= 1
    return best

def r_can_finish(n, prereq):
    graph = defaultdict(list); indeg = [0] * n
    for a, b in prereq:
        graph[b].append(a); indeg[a] += 1
    q = deque(i for i in range(n) if indeg[i] == 0); seen = 0
    while q:
        node = q.popleft(); seen += 1
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0: q.append(nxt)
    return seen == n

def r_daily_temps(temps):
    res = [0] * len(temps); st = []
    for i, x in enumerate(temps):
        while st and temps[st[-1]] < x:
            j = st.pop(); res[j] = i - j
        st.append(i)
    return res

def r_eval_rpn(tokens):
    st = []
    for tok in tokens:
        if tok in ('+', '-', '*', '/'):
            b = st.pop(); a = st.pop()
            st.append(a + b if tok == '+' else a - b if tok == '-'
                      else a * b if tok == '*' else int(a / b))
        else:
            st.append(int(tok))
    return st[0]

def r_group_anagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        groups[''.join(sorted(s))].append(s)
    return list(groups.values())

def r_rob(nums):
    prev = cur = 0
    for x in nums: prev, cur = cur, max(cur, prev + x)
    return cur

def r_can_jump(nums):
    reach = 0
    for i, x in enumerate(nums):
        if i > reach: return False
        reach = max(reach, i + x)
    return True

def r_koko(piles, h):
    import math as _m
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum(_m.ceil(p / mid) for p in piles) <= h: hi = mid
        else: lo = mid + 1
    return lo

def r_kth_largest(nums, k): return sorted(nums, reverse=True)[k - 1]

def r_lcs(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) - 1, -1, -1):
        for j in range(len(b) - 1, -1, -1):
            dp[i][j] = dp[i+1][j+1] + 1 if a[i] == b[j] else max(dp[i+1][j], dp[i][j+1])
    return dp[0][0]

def r_lis(nums):
    tails = []
    for x in nums:
        i = bisect.bisect_left(tails, x)
        if i == len(tails): tails.append(x)
        else: tails[i] = x
    return len(tails)

def r_longest_substring(s):
    seen = {}; start = best = 0
    for i, ch in enumerate(s):
        if ch in seen and seen[ch] >= start: start = seen[ch] + 1
        seen[ch] = i; best = max(best, i - start + 1)
    return best

def r_max_subarray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x); best = max(best, cur)
    return best

def r_merge_intervals(intervals):
    out = []
    for s, e in sorted(intervals):
        if out and s <= out[-1][1]: out[-1][1] = max(out[-1][1], e)
        else: out.append([s, e])
    return out

def r_num_islands(grid):
    if not grid: return 0
    R, C = len(grid), len(grid[0])
    def sink(i, j):
        if 0 <= i < R and 0 <= j < C and grid[i][j] == '1':
            grid[i][j] = '0'
            sink(i+1, j); sink(i-1, j); sink(i, j+1); sink(i, j-1)
    count = 0
    for i in range(R):
        for j in range(C):
            if grid[i][j] == '1': count += 1; sink(i, j)
    return count

def r_can_partition(nums):
    tot = sum(nums)
    if tot % 2: return False
    target = tot // 2; dp = {0}
    for x in nums: dp |= {x + v for v in dp if x + v <= target}
    return target in dp

def r_product_except_self(nums):
    n = len(nums); res = [1] * n
    pre = 1
    for i in range(n): res[i] = pre; pre *= nums[i]
    suf = 1
    for i in range(n - 1, -1, -1): res[i] *= suf; suf *= nums[i]
    return res

def r_rotate(matrix):
    matrix.reverse()
    for i in range(len(matrix)):
        for j in range(i):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    return None

def r_search_rotated(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]: hi = mid - 1
            else: lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]: lo = mid + 1
            else: hi = mid - 1
    return -1

def r_top_k(nums, k): return [x for x, _ in Counter(nums).most_common(k)]

def r_unique_paths(m, n):
    import math as _m
    return _m.comb(m + n - 2, m - 1)

def r_is_valid_bst(root):
    def ok(node, lo, hi):
        if not node: return True
        if not (lo < node.val < hi): return False
        return ok(node.left, lo, node.val) and ok(node.right, node.val, hi)
    return ok(root, float('-inf'), float('inf'))

def r_word_break(s, wordDict):
    words = set(wordDict); dp = [True] + [False] * len(s)
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words: dp[i] = True; break
    return dp[len(s)]

def r_exist(board, word):
    R, C = len(board), len(board[0])
    def dfs(i, j, k):
        if k == len(word): return True
        if i < 0 or j < 0 or i >= R or j >= C or board[i][j] != word[k]: return False
        tmp = board[i][j]; board[i][j] = '#'
        found = dfs(i+1, j, k+1) or dfs(i-1, j, k+1) or dfs(i, j+1, k+1) or dfs(i, j-1, k+1)
        board[i][j] = tmp
        return found
    return any(dfs(i, j, 0) for i in range(R) for j in range(C))


# --------------------------- LRU (stdio design problem) ---------------------------
def _lru_stdio(stdin):
    from collections import OrderedDict
    lines = [ln for ln in stdin.split('\n') if ln.strip()]
    cap = int(lines[0]); cache = OrderedDict(); out = []
    for ln in lines[1:]:
        parts = ln.split()
        if parts[0] == 'put':
            k, v = int(parts[1]), int(parts[2])
            if k in cache: cache.move_to_end(k)
            cache[k] = v
            if len(cache) > cap: cache.popitem(last=False)
        elif parts[0] == 'get':
            k = int(parts[1])
            if k in cache:
                cache.move_to_end(k); out.append(str(cache[k]))
            else:
                out.append('-1')
    return '\n'.join(out)


LRU_PROBLEM = {
    "slug": "lru-cache",
    "title": "LRU Cache",
    "difficulty": "medium",
    "topics": ["Design", "Hash Map", "Linked List"],
    "mode": "stdio",
    "description": (
        "Design a Least Recently Used (LRU) cache with a fixed capacity supporting `get` and `put` in O(1). "
        "`get(key)` returns the value or -1; `put(key, value)` inserts/updates and evicts the least recently "
        "used key when over capacity. This is a **design** problem, so it uses stdin/stdout.\n\n"
        "**Input**\n\nFirst line: capacity. Then one operation per line: `put KEY VALUE` or `get KEY`.\n\n"
        "**Output**\n\nOne line per `get`: the returned value (or -1)."
    ),
    "constraints": ["1 <= capacity <= 3000", "operations <= 10^4"],
    "starter_code": (
        "import sys\n\n"
        "class LRUCache:\n"
        "    def __init__(self, capacity: int):\n"
        "        pass\n\n"
        "    def get(self, key: int) -> int:\n"
        "        pass\n\n"
        "    def put(self, key: int, value: int) -> None:\n"
        "        pass\n\n"
        "def main():\n"
        "    data = sys.stdin.read().split('\\n')\n"
        "    lines = [l for l in data if l.strip()]\n"
        "    cache = LRUCache(int(lines[0]))\n"
        "    out = []\n"
        "    for ln in lines[1:]:\n"
        "        p = ln.split()\n"
        "        if p[0] == 'put': cache.put(int(p[1]), int(p[2]))\n"
        "        elif p[0] == 'get': out.append(str(cache.get(int(p[1]))))\n"
        "    print('\\n'.join(out))\n\n"
        "if __name__ == '__main__':\n"
        "    main()"
    ),
    "stdin_cases": [
        {"name": "example", "stdin": "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4"},
        {"name": "update", "stdin": "2\nput 2 1\nput 2 2\nget 2\nput 1 1\nput 4 1\nget 2"},
        {"name": "capacity one", "stdin": "1\nput 1 1\nget 1\nput 2 2\nget 1\nget 2"},
    ],
}


# --------------------------- problem catalog ---------------------------
# Each: slug,title,difficulty,topics,sig,node?,entry,param_types,return_type,compare,reference,cases,description
P = lambda **kw: kw

PROBLEMS = [
    P(slug="two-sum", title="Two Sum", difficulty="easy", topics=["Arrays", "Hash Map"],
      entry="twoSum", sig="twoSum(self, nums: List[int], target: int) -> List[int]",
      reference=r_two_sum,
      description="Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one solution exists; you may not use the same element twice.",
      cases=[{"args": [[2,7,11,15], 9], "expected": [0,1]},
             {"args": [[3,2,4], 6], "expected": [1,2]},
             {"args": [[3,3], 6], "expected": [0,1]}]),
    P(slug="contains-duplicate", title="Contains Duplicate", difficulty="easy", topics=["Arrays", "Hash Set"],
      entry="containsDuplicate", sig="containsDuplicate(self, nums: List[int]) -> bool",
      reference=r_contains_duplicate,
      description="Return `true` if any value appears at least twice in `nums`, and `false` if every element is distinct.",
      cases=[{"args": [[1,2,3,1]], "expected": True},
             {"args": [[1,2,3,4]], "expected": False},
             {"args": [[1,1,1,3,3,4,3,2,4,2]], "expected": True}]),
    P(slug="first-non-repeating", title="First Unique Character", difficulty="easy", topics=["Strings", "Hash Map"],
      entry="firstUniqChar", sig="firstUniqChar(self, s: str) -> int",
      reference=r_first_uniq,
      description="Given a string `s`, return the index of the first non-repeating character. If none exists, return -1.",
      cases=[{"args": ["leetcode"], "expected": 0},
             {"args": ["loveleetcode"], "expected": 2},
             {"args": ["aabb"], "expected": -1}]),
    P(slug="fizzbuzz", title="Fizz Buzz", difficulty="easy", topics=["Math", "Simulation"],
      entry="fizzBuzz", sig="fizzBuzz(self, n: int) -> List[str]",
      reference=r_fizzbuzz,
      description="Return a list of strings 1..n where multiples of 3 are \"Fizz\", multiples of 5 are \"Buzz\", multiples of both are \"FizzBuzz\", otherwise the number as a string.",
      cases=[{"args": [3], "expected": ["1","2","Fizz"]},
             {"args": [5], "expected": ["1","2","Fizz","4","Buzz"]},
             {"args": [15], "expected": ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]}]),
    P(slug="invert-binary-tree", title="Invert Binary Tree", difficulty="easy", topics=["Trees", "DFS"],
      entry="invertTree", sig="invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]", node="tree",
      param_types=["tree"], return_type="tree", reference=r_invert_tree,
      description="Invert a binary tree (mirror it) and return the new root. The tree is given in level-order with `null` for missing children.",
      cases=[{"args": [[4,2,7,1,3,6,9]], "expected": [4,7,2,9,6,3,1]},
             {"args": [[2,1,3]], "expected": [2,3,1]},
             {"args": [[]], "expected": []}]),
    P(slug="last-stone-weight", title="Last Stone Weight", difficulty="easy", topics=["Heap", "Greedy"],
      entry="lastStoneWeight", sig="lastStoneWeight(self, stones: List[int]) -> int",
      reference=r_last_stone,
      description="Repeatedly smash the two heaviest stones; if equal both are destroyed, else the heavier becomes their difference. Return the weight of the last remaining stone (0 if none).",
      cases=[{"args": [[2,7,4,1,8,1]], "expected": 1},
             {"args": [[1]], "expected": 1},
             {"args": [[2,2]], "expected": 0}]),
    P(slug="majority-element", title="Majority Element", difficulty="easy", topics=["Arrays", "Boyer-Moore"],
      entry="majorityElement", sig="majorityElement(self, nums: List[int]) -> int",
      reference=r_majority,
      description="Return the element that appears more than ⌊n/2⌋ times. You may assume it always exists.",
      cases=[{"args": [[3,2,3]], "expected": 3},
             {"args": [[2,2,1,1,1,2,2]], "expected": 2},
             {"args": [[5]], "expected": 5}]),
    P(slug="max-depth-binary-tree", title="Maximum Depth of Binary Tree", difficulty="easy", topics=["Trees", "DFS", "BFS"],
      entry="maxDepth", sig="maxDepth(self, root: Optional[TreeNode]) -> int", node="tree",
      param_types=["tree"], reference=r_max_depth,
      description="Return the maximum depth (number of nodes along the longest root-to-leaf path). The tree is given in level-order with `null` for missing children.",
      cases=[{"args": [[3,9,20,None,None,15,7]], "expected": 3},
             {"args": [[1,None,2]], "expected": 2},
             {"args": [[]], "expected": 0}]),
    P(slug="meeting-rooms", title="Meeting Rooms", difficulty="easy", topics=["Intervals", "Sorting"],
      entry="canAttendMeetings", sig="canAttendMeetings(self, intervals: List[List[int]]) -> bool",
      reference=r_can_attend,
      description="Given meeting time intervals `[start, end]`, return whether a person could attend all of them (no overlaps). Touching endpoints do not overlap.",
      cases=[{"args": [[[0,30],[5,10],[15,20]]], "expected": False},
             {"args": [[[7,10],[2,4]]], "expected": True},
             {"args": [[[1,2],[2,3]]], "expected": True}]),
    P(slug="merge-sorted-array", title="Merge Two Sorted Arrays", difficulty="easy", topics=["Arrays", "Two Pointers"],
      entry="mergeSortedArrays", sig="mergeSortedArrays(self, a: List[int], b: List[int]) -> List[int]",
      reference=r_merge_sorted,
      description="Given two ascending-sorted arrays, merge them into one ascending-sorted array and return it.",
      cases=[{"args": [[1,2,3],[2,5,6]], "expected": [1,2,2,3,5,6]},
             {"args": [[],[1]], "expected": [1]},
             {"args": [[0],[]], "expected": [0]}]),
    P(slug="move-zeroes", title="Move Zeroes", difficulty="easy", topics=["Arrays", "Two Pointers"],
      entry="moveZeroes", sig="moveZeroes(self, nums: List[int]) -> None",
      return_type="arg0", reference=r_move_zeroes,
      description="Move all 0's to the end of `nums` in place while keeping the relative order of the non-zero elements. Modify `nums` directly (return nothing).",
      cases=[{"args": [[0,1,0,3,12]], "expected": [1,3,12,0,0]},
             {"args": [[0]], "expected": [0]},
             {"args": [[1,2,3]], "expected": [1,2,3]}]),
    P(slug="number-of-1-bits", title="Number of 1 Bits", difficulty="easy", topics=["Bit Manipulation"],
      entry="hammingWeight", sig="hammingWeight(self, n: int) -> int",
      reference=r_hamming,
      description="Return the number of set bits (1s) in the binary representation of the non-negative integer `n`.",
      cases=[{"args": [11], "expected": 3},
             {"args": [128], "expected": 1},
             {"args": [0], "expected": 0}]),
    P(slug="ransom-note", title="Ransom Note", difficulty="easy", topics=["Strings", "Hash Map"],
      entry="canConstruct", sig="canConstruct(self, ransomNote: str, magazine: str) -> bool",
      reference=r_ransom,
      description="Return whether `ransomNote` can be built using the letters of `magazine` (each letter used at most as many times as it appears).",
      cases=[{"args": ["a","b"], "expected": False},
             {"args": ["aa","aab"], "expected": True},
             {"args": ["aa","ab"], "expected": False}]),
    P(slug="reverse-linked-list", title="Reverse Linked List", difficulty="easy", topics=["Linked List"],
      entry="reverseList", sig="reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]", node="listnode",
      param_types=["listnode"], return_type="listnode", reference=r_reverse_list,
      description="Reverse a singly linked list and return the new head. The list is given as an array of values.",
      cases=[{"args": [[1,2,3,4,5]], "expected": [5,4,3,2,1]},
             {"args": [[1,2]], "expected": [2,1]},
             {"args": [[]], "expected": []}]),
    P(slug="reverse-string", title="Reverse String", difficulty="easy", topics=["Strings", "Two Pointers"],
      entry="reverseString", sig="reverseString(self, s: str) -> str",
      reference=r_reverse_string,
      description="Return the input string reversed.",
      cases=[{"args": ["hello"], "expected": "olleh"},
             {"args": ["Dinesh"], "expected": "hseniD"},
             {"args": [""], "expected": ""}]),
    P(slug="single-number", title="Single Number", difficulty="easy", topics=["Bit Manipulation", "Arrays"],
      entry="singleNumber", sig="singleNumber(self, nums: List[int]) -> int",
      reference=r_single,
      description="Every element appears twice except one. Find the element that appears only once, in O(n) time and O(1) space.",
      cases=[{"args": [[2,2,1]], "expected": 1},
             {"args": [[4,1,2,1,2]], "expected": 4},
             {"args": [[1]], "expected": 1}]),
    P(slug="valid-anagram", title="Valid Anagram", difficulty="easy", topics=["Strings", "Hash Map"],
      entry="isAnagram", sig="isAnagram(self, s: str, t: str) -> bool",
      reference=r_is_anagram,
      description="Return whether `t` is an anagram of `s` (same characters with the same frequencies).",
      cases=[{"args": ["anagram","nagaram"], "expected": True},
             {"args": ["rat","car"], "expected": False},
             {"args": ["a","ab"], "expected": False}]),
    P(slug="valid-palindrome", title="Valid Palindrome", difficulty="easy", topics=["Strings", "Two Pointers"],
      entry="isPalindrome", sig="isPalindrome(self, s: str) -> bool",
      reference=r_is_palindrome,
      description="Return whether `s` is a palindrome, considering only alphanumeric characters and ignoring case.",
      cases=[{"args": ["A man, a plan, a canal: Panama"], "expected": True},
             {"args": ["race a car"], "expected": False},
             {"args": [" "], "expected": True}]),
    P(slug="valid-parentheses", title="Valid Parentheses", difficulty="easy", topics=["Stack", "Strings"],
      entry="isValid", sig="isValid(self, s: str) -> bool",
      reference=r_is_valid,
      description="Given a string of just `()[]{}`, return whether every bracket is closed by the same type in the correct order.",
      cases=[{"args": ["()"], "expected": True},
             {"args": ["()[]{}"], "expected": True},
             {"args": ["(]"], "expected": False},
             {"args": ["([)]"], "expected": False},
             {"args": ["{[]}"], "expected": True}]),

    # -------- MEDIUM --------
    P(slug="three-sum", title="3Sum", difficulty="medium", topics=["Arrays", "Two Pointers"],
      entry="threeSum", sig="threeSum(self, nums: List[int]) -> List[List[int]]",
      compare="unordered_nested", reference=r_three_sum,
      description="Return all unique triplets `[a, b, c]` such that a + b + c = 0. The triplets may be returned in any order.",
      cases=[{"args": [[-1,0,1,2,-1,-4]], "expected": [[-1,-1,2],[-1,0,1]]},
             {"args": [[0,1,1]], "expected": []},
             {"args": [[0,0,0]], "expected": [[0,0,0]]}]),
    P(slug="best-time-to-buy", title="Best Time to Buy and Sell Stock", difficulty="medium", topics=["Arrays", "Greedy"],
      entry="maxProfit", sig="maxProfit(self, prices: List[int]) -> int",
      reference=r_max_profit,
      description="Given daily prices, return the maximum profit from one buy and one later sell (0 if no profit is possible).",
      cases=[{"args": [[7,1,5,3,6,4]], "expected": 5},
             {"args": [[7,6,4,3,1]], "expected": 0},
             {"args": [[1]], "expected": 0}]),
    P(slug="binary-search", title="Binary Search", difficulty="medium", topics=["Binary Search"],
      entry="search", sig="search(self, nums: List[int], target: int) -> int",
      reference=r_binary_search,
      description="Given an ascending-sorted array of distinct integers, return the index of `target`, or -1. Aim for O(log n).",
      cases=[{"args": [[-1,0,3,5,9,12], 9], "expected": 4},
             {"args": [[-1,0,3,5,9,12], 2], "expected": -1},
             {"args": [[5], 5], "expected": 0}]),
    P(slug="climbing-stairs", title="Climbing Stairs", difficulty="medium", topics=["Dynamic Programming"],
      entry="climbStairs", sig="climbStairs(self, n: int) -> int",
      reference=r_climb,
      description="You climb 1 or 2 steps at a time. Return the number of distinct ways to reach the top of `n` stairs.",
      cases=[{"args": [2], "expected": 2},
             {"args": [3], "expected": 3},
             {"args": [5], "expected": 8}]),
    P(slug="coin-change", title="Coin Change", difficulty="medium", topics=["Dynamic Programming"],
      entry="coinChange", sig="coinChange(self, coins: List[int], amount: int) -> int",
      reference=r_coin_change,
      description="Return the fewest coins needed to make `amount` from the given coin denominations (unlimited supply), or -1 if impossible.",
      cases=[{"args": [[1,2,5], 11], "expected": 3},
             {"args": [[2], 3], "expected": -1},
             {"args": [[1], 0], "expected": 0}]),
    P(slug="container-with-most-water", title="Container With Most Water", difficulty="medium", topics=["Two Pointers", "Greedy"],
      entry="maxArea", sig="maxArea(self, height: List[int]) -> int",
      reference=r_max_area,
      description="Given vertical line heights, return the maximum water area between two lines and the x-axis.",
      cases=[{"args": [[1,8,6,2,5,4,8,3,7]], "expected": 49},
             {"args": [[1,1]], "expected": 1},
             {"args": [[1,2,3,4,5]], "expected": 6}]),
    P(slug="course-schedule", title="Course Schedule", difficulty="medium", topics=["Graph", "Topological Sort"],
      entry="canFinish", sig="canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool",
      reference=r_can_finish,
      description="Given `numCourses` and prerequisites `[a, b]` (b must be taken before a), return whether all courses can be finished (no cycle).",
      cases=[{"args": [2, [[1,0]]], "expected": True},
             {"args": [2, [[1,0],[0,1]]], "expected": False},
             {"args": [3, [[1,0],[2,1]]], "expected": True}]),
    P(slug="daily-temperatures", title="Daily Temperatures", difficulty="medium", topics=["Stack", "Monotonic Stack"],
      entry="dailyTemperatures", sig="dailyTemperatures(self, temperatures: List[int]) -> List[int]",
      reference=r_daily_temps,
      description="For each day, return how many days until a warmer temperature (0 if none).",
      cases=[{"args": [[73,74,75,71,69,72,76,73]], "expected": [1,1,4,2,1,1,0,0]},
             {"args": [[30,40,50,60]], "expected": [1,1,1,0]},
             {"args": [[30,60,90]], "expected": [1,1,0]}]),
    P(slug="evaluate-reverse-polish-notation", title="Evaluate Reverse Polish Notation", difficulty="medium", topics=["Stack", "Math"],
      entry="evalRPN", sig="evalRPN(self, tokens: List[str]) -> int",
      reference=r_eval_rpn,
      description="Evaluate an arithmetic expression in Reverse Polish Notation. Operators are `+ - * /`; division truncates toward zero.",
      cases=[{"args": [["2","1","+","3","*"]], "expected": 9},
             {"args": [["4","13","5","/","+"]], "expected": 6},
             {"args": [["10","6","9","3","+","-11","*","/","*","17","+","5","+"]], "expected": 22}]),
    P(slug="group-anagrams", title="Group Anagrams", difficulty="medium", topics=["Strings", "Hash Map"],
      entry="groupAnagrams", sig="groupAnagrams(self, strs: List[str]) -> List[List[str]]",
      compare="unordered_nested", reference=r_group_anagrams,
      description="Group the strings that are anagrams of each other. Return the groups in any order.",
      cases=[{"args": [["eat","tea","tan","ate","nat","bat"]], "expected": [["eat","tea","ate"],["tan","nat"],["bat"]]},
             {"args": [[""]], "expected": [[""]]},
             {"args": [["a"]], "expected": [["a"]]}]),
    P(slug="house-robber", title="House Robber", difficulty="medium", topics=["Dynamic Programming"],
      entry="rob", sig="rob(self, nums: List[int]) -> int",
      reference=r_rob,
      description="You cannot rob two adjacent houses. Return the maximum money you can rob.",
      cases=[{"args": [[1,2,3,1]], "expected": 4},
             {"args": [[2,7,9,3,1]], "expected": 12},
             {"args": [[5]], "expected": 5}]),
    P(slug="jump-game", title="Jump Game", difficulty="medium", topics=["Greedy", "Dynamic Programming"],
      entry="canJump", sig="canJump(self, nums: List[int]) -> bool",
      reference=r_can_jump,
      description="Each value is the maximum jump length from that index. Return whether you can reach the last index from index 0.",
      cases=[{"args": [[2,3,1,1,4]], "expected": True},
             {"args": [[3,2,1,0,4]], "expected": False},
             {"args": [[0]], "expected": True}]),
    P(slug="koko-eating-bananas", title="Koko Eating Bananas", difficulty="medium", topics=["Binary Search"],
      entry="minEatingSpeed", sig="minEatingSpeed(self, piles: List[int], h: int) -> int",
      reference=r_koko,
      description="Koko eats up to `k` bananas/hour from one pile each hour. Return the minimum integer `k` to finish all piles within `h` hours.",
      cases=[{"args": [[3,6,7,11], 8], "expected": 4},
             {"args": [[30,11,23,4,20], 5], "expected": 30},
             {"args": [[30,11,23,4,20], 6], "expected": 23}]),
    P(slug="kth-largest-element-in-an-array", title="Kth Largest Element in an Array", difficulty="medium", topics=["Heap", "Sorting"],
      entry="findKthLargest", sig="findKthLargest(self, nums: List[int], k: int) -> int",
      reference=r_kth_largest,
      description="Return the k-th largest element (in sorted order, not the k-th distinct element).",
      cases=[{"args": [[3,2,1,5,6,4], 2], "expected": 5},
             {"args": [[3,2,3,1,2,4,5,5,6], 4], "expected": 4},
             {"args": [[1], 1], "expected": 1}]),
    P(slug="longest-common-subsequence", title="Longest Common Subsequence", difficulty="medium", topics=["Dynamic Programming", "Strings"],
      entry="longestCommonSubsequence", sig="longestCommonSubsequence(self, text1: str, text2: str) -> int",
      reference=r_lcs,
      description="Return the length of the longest common subsequence of two strings (0 if none).",
      cases=[{"args": ["abcde","ace"], "expected": 3},
             {"args": ["abc","abc"], "expected": 3},
             {"args": ["abc","def"], "expected": 0}]),
    P(slug="longest-increasing-subsequence", title="Longest Increasing Subsequence", difficulty="medium", topics=["Dynamic Programming", "Binary Search"],
      entry="lengthOfLIS", sig="lengthOfLIS(self, nums: List[int]) -> int",
      reference=r_lis,
      description="Return the length of the longest strictly increasing subsequence.",
      cases=[{"args": [[10,9,2,5,3,7,101,18]], "expected": 4},
             {"args": [[0,1,0,3,2,3]], "expected": 4},
             {"args": [[7,7,7,7]], "expected": 1}]),
    P(slug="longest-substring", title="Longest Substring Without Repeating Characters", difficulty="medium", topics=["Sliding Window", "Strings"],
      entry="lengthOfLongestSubstring", sig="lengthOfLongestSubstring(self, s: str) -> int",
      reference=r_longest_substring,
      description="Return the length of the longest substring without repeating characters.",
      cases=[{"args": ["abcabcbb"], "expected": 3},
             {"args": ["bbbbb"], "expected": 1},
             {"args": ["pwwkew"], "expected": 3},
             {"args": [""], "expected": 0}]),
    P(slug="max-subarray", title="Maximum Subarray", difficulty="medium", topics=["Dynamic Programming", "Greedy"],
      entry="maxSubArray", sig="maxSubArray(self, nums: List[int]) -> int",
      reference=r_max_subarray,
      description="Return the largest sum of any contiguous subarray (Kadane's algorithm).",
      cases=[{"args": [[-2,1,-3,4,-1,2,1,-5,4]], "expected": 6},
             {"args": [[1]], "expected": 1},
             {"args": [[5,4,-1,7,8]], "expected": 23}]),
    P(slug="merge-intervals", title="Merge Intervals", difficulty="medium", topics=["Intervals", "Sorting"],
      entry="merge", sig="merge(self, intervals: List[List[int]]) -> List[List[int]]",
      reference=r_merge_intervals,
      description="Merge all overlapping intervals and return them sorted by start.",
      cases=[{"args": [[[1,3],[2,6],[8,10],[15,18]]], "expected": [[1,6],[8,10],[15,18]]},
             {"args": [[[1,4],[4,5]]], "expected": [[1,5]]},
             {"args": [[[1,4]]], "expected": [[1,4]]}]),
    P(slug="number-of-islands", title="Number of Islands", difficulty="medium", topics=["Graph", "DFS", "Matrix"],
      entry="numIslands", sig="numIslands(self, grid: List[List[str]]) -> int",
      reference=r_num_islands,
      description="Given a grid of '1' (land) and '0' (water), return the number of islands (connected groups of land, 4-directionally).",
      cases=[{"args": [[["1","1","0"],["1","0","0"],["0","0","1"]]], "expected": 2},
             {"args": [[["1","1","1"],["1","1","1"]]], "expected": 1},
             {"args": [[["0"]]], "expected": 0}]),
    P(slug="partition-equal-subset-sum", title="Partition Equal Subset Sum", difficulty="medium", topics=["Dynamic Programming"],
      entry="canPartition", sig="canPartition(self, nums: List[int]) -> bool",
      reference=r_can_partition,
      description="Return whether the array can be split into two subsets with equal sum.",
      cases=[{"args": [[1,5,11,5]], "expected": True},
             {"args": [[1,2,3,5]], "expected": False},
             {"args": [[3,3]], "expected": True}]),
    P(slug="product-except-self", title="Product of Array Except Self", difficulty="medium", topics=["Arrays", "Prefix Sum"],
      entry="productExceptSelf", sig="productExceptSelf(self, nums: List[int]) -> List[int]",
      reference=r_product_except_self,
      description="Return an array where each element is the product of all other elements. Do it without division.",
      cases=[{"args": [[1,2,3,4]], "expected": [24,12,8,6]},
             {"args": [[-1,1,0,-3,3]], "expected": [0,0,9,0,0]}]),
    P(slug="rotate-image", title="Rotate Image", difficulty="medium", topics=["Matrix", "Arrays"],
      entry="rotate", sig="rotate(self, matrix: List[List[int]]) -> None",
      return_type="arg0", reference=r_rotate,
      description="Rotate the `n x n` matrix 90 degrees clockwise **in place** (modify `matrix` directly; return nothing).",
      cases=[{"args": [[[1,2,3],[4,5,6],[7,8,9]]], "expected": [[7,4,1],[8,5,2],[9,6,3]]},
             {"args": [[[1,2],[3,4]]], "expected": [[3,1],[4,2]]}]),
    P(slug="search-in-rotated-sorted-array", title="Search in Rotated Sorted Array", difficulty="medium", topics=["Binary Search", "Arrays"],
      entry="search", sig="search(self, nums: List[int], target: int) -> int",
      reference=r_search_rotated,
      description="A sorted array of distinct integers was rotated. Return the index of `target`, or -1, in O(log n).",
      cases=[{"args": [[4,5,6,7,0,1,2], 0], "expected": 4},
             {"args": [[4,5,6,7,0,1,2], 3], "expected": -1},
             {"args": [[1], 1], "expected": 0}]),
    P(slug="top-k-frequent", title="Top K Frequent Elements", difficulty="medium", topics=["Heap", "Hash Map"],
      entry="topKFrequent", sig="topKFrequent(self, nums: List[int], k: int) -> List[int]",
      compare="unordered", reference=r_top_k,
      description="Return the `k` most frequent elements, in any order.",
      cases=[{"args": [[1,1,1,2,2,3], 2], "expected": [1,2]},
             {"args": [[1], 1], "expected": [1]},
             {"args": [[4,4,4,5,5,6], 2], "expected": [4,5]}]),
    P(slug="unique-paths", title="Unique Paths", difficulty="medium", topics=["Dynamic Programming", "Combinatorics"],
      entry="uniquePaths", sig="uniquePaths(self, m: int, n: int) -> int",
      reference=r_unique_paths,
      description="A robot moves only right or down on an `m x n` grid. Return the number of unique paths from top-left to bottom-right.",
      cases=[{"args": [3,7], "expected": 28},
             {"args": [3,2], "expected": 3},
             {"args": [1,1], "expected": 1}]),
    P(slug="validate-bst", title="Validate Binary Search Tree", difficulty="medium", topics=["Trees", "DFS"],
      entry="isValidBST", sig="isValidBST(self, root: Optional[TreeNode]) -> bool", node="tree",
      param_types=["tree"], reference=r_is_valid_bst,
      description="Return whether the binary tree is a valid BST (every left subtree < node < every right subtree). Given in level-order with `null`.",
      cases=[{"args": [[2,1,3]], "expected": True},
             {"args": [[5,1,4,None,None,3,6]], "expected": False},
             {"args": [[2,2,2]], "expected": False}]),
    P(slug="word-break", title="Word Break", difficulty="medium", topics=["Dynamic Programming", "Strings"],
      entry="wordBreak", sig="wordBreak(self, s: str, wordDict: List[str]) -> bool",
      reference=r_word_break,
      description="Return whether `s` can be segmented into a space-separated sequence of one or more dictionary words (words may be reused).",
      cases=[{"args": ["leetcode", ["leet","code"]], "expected": True},
             {"args": ["applepenapple", ["apple","pen"]], "expected": True},
             {"args": ["catsandog", ["cats","dog","sand","and","cat"]], "expected": False}]),
    P(slug="word-search", title="Word Search", difficulty="medium", topics=["Backtracking", "Matrix", "DFS"],
      entry="exist", sig="exist(self, board: List[List[str]], word: str) -> bool",
      reference=r_exist,
      description="Return whether `word` can be built from sequentially adjacent (horizontal/vertical) cells, using each cell at most once.",
      cases=[{"args": [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"], "expected": True},
             {"args": [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "SEE"], "expected": True},
             {"args": [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCB"], "expected": False}]),
    P(slug="rotate-image-dummy", _skip=True),  # placeholder guard (removed below)

    # -------- HARD --------
    P(slug="edit-distance", title="Edit Distance", difficulty="hard", topics=["Dynamic Programming", "Strings"],
      entry="minDistance", sig="minDistance(self, word1: str, word2: str) -> int",
      reference=r_min_distance,
      description="Return the minimum number of insert/delete/replace operations to convert `word1` into `word2` (Levenshtein distance).",
      cases=[{"args": ["horse","ros"], "expected": 3},
             {"args": ["intention","execution"], "expected": 5},
             {"args": ["","a"], "expected": 1}]),
    P(slug="median-two-sorted-arrays", title="Median of Two Sorted Arrays", difficulty="hard", topics=["Binary Search", "Arrays"],
      entry="findMedianSortedArrays", sig="findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float",
      reference=r_median,
      description="Return the median of the two sorted arrays as a float.",
      cases=[{"args": [[1,3],[2]], "expected": 2.0},
             {"args": [[1,2],[3,4]], "expected": 2.5},
             {"args": [[],[1]], "expected": 1.0}]),
    P(slug="merge-k-sorted-lists", title="Merge K Sorted Lists", difficulty="hard", topics=["Heap", "Linked List"],
      entry="mergeKLists", sig="mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]", node="listnode",
      param_types=["listnode[]"], return_type="listnode", reference=r_merge_k,
      description="Merge `k` sorted linked lists (given as an array of arrays) into one sorted list and return it as an array.",
      cases=[{"args": [[[1,4,5],[1,3,4],[2,6]]], "expected": [1,1,2,3,4,4,5,6]},
             {"args": [[]], "expected": []},
             {"args": [[[]]], "expected": []}]),
    P(slug="sliding-window-maximum", title="Sliding Window Maximum", difficulty="hard", topics=["Deque", "Sliding Window"],
      entry="maxSlidingWindow", sig="maxSlidingWindow(self, nums: List[int], k: int) -> List[int]",
      reference=r_max_sliding,
      description="Return the maximum of each contiguous window of size `k` as it slides across `nums`.",
      cases=[{"args": [[1,3,-1,-3,5,3,6,7], 3], "expected": [3,3,5,5,6,7]},
             {"args": [[1], 1], "expected": [1]},
             {"args": [[9,8,7,6], 2], "expected": [9,8,7]}]),
    P(slug="trapping-rain-water", title="Trapping Rain Water", difficulty="hard", topics=["Two Pointers", "Stack"],
      entry="trap", sig="trap(self, height: List[int]) -> int",
      reference=r_trap,
      description="Given elevation heights, return how many units of rain water can be trapped.",
      cases=[{"args": [[0,1,0,2,1,0,1,3,2,1,2,1]], "expected": 6},
             {"args": [[4,2,0,3,2,5]], "expected": 9},
             {"args": [[1,2,3]], "expected": 0}]),
]

# drop the placeholder guard
PROBLEMS = [p for p in PROBLEMS if not p.get("_skip")]


class Command(BaseCommand):
    help = "Seed all coding problems in LeetCode-style function mode (self-verifying)."

    def handle(self, *args, **options):
        n_created = n_updated = 0

        # LRU (stdio design problem)
        lru = LRU_PROBLEM
        stdio_cases = []
        for c in lru["stdin_cases"]:
            stdio_cases.append({"name": c["name"], "stdin": c["stdin"],
                                "expected_output": _lru_stdio(c["stdin"])})
        lru_examples = [{"input": c["stdin"], "output": c["expected_output"], "explanation": ""}
                        for c in stdio_cases[:1]]
        lru_sol = SOLUTIONS.get(lru["slug"], {})
        created = self._upsert(dict(
            slug=lru["slug"], title=lru["title"], difficulty=lru["difficulty"], topics=lru["topics"],
            description=lru["description"], examples=lru_examples, constraints=lru["constraints"],
            starter_code=lru["starter_code"], judge_mode="stdio", entry_point="", param_types=[],
            return_type="json", compare_mode="exact", test_cases=stdio_cases,
            solution_code=lru_sol.get("code", ""), solution_explanation=lru_sol.get("explanation", ""),
            solution_complexity=lru_sol.get("complexity", ""),
        ))
        n_created += created; n_updated += (0 if created else 1)

        for p in PROBLEMS:
            pt = p.get("param_types", [])
            rt = p.get("return_type", "json")
            cmp = p.get("compare", "exact")
            ref = p["reference"]
            test_cases = []
            for i, c in enumerate(p["cases"]):
                got = run_ref(ref, c["args"], pt, rt)
                if "expected" in c:
                    if canonical(got, cmp) != canonical(c["expected"], cmp):
                        raise AssertionError(
                            f"{p['slug']} case {i}: reference produced {got!r} but expected {c['expected']!r}")
                    exp = c["expected"]
                else:
                    exp = got
                test_cases.append({"name": c.get("name", f"case {i+1}"), "args": c["args"], "expected": exp})

            examples = [{"input": json.dumps(tc["args"]), "output": json.dumps(tc["expected"]),
                         "explanation": ""} for tc in test_cases[:2]]
            sol = SOLUTIONS.get(p["slug"], {})

            created = self._upsert(dict(
                slug=p["slug"], title=p["title"], difficulty=p["difficulty"], topics=p["topics"],
                description=p["description"], examples=examples, constraints=p.get("constraints", []),
                starter_code=make_starter(p["sig"], p.get("node")),
                judge_mode="function", entry_point=p["entry"], param_types=pt,
                return_type=rt, compare_mode=cmp, test_cases=test_cases,
                solution_code=sol.get("code", ""), solution_explanation=sol.get("explanation", ""),
                solution_complexity=sol.get("complexity", ""),
            ))
            n_created += created; n_updated += (0 if created else 1)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(PROBLEMS) + 1} problems ({n_created} created, {n_updated} updated)."))

    def _upsert(self, fields) -> bool:
        obj, created = CodingProblem.objects.get_or_create(slug=fields["slug"], defaults=fields)
        if not created:
            for k, v in fields.items():
                setattr(obj, k, v)
            obj.save()
        return created
