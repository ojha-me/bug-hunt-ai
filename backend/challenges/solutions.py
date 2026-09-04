"""
Editorial solutions per problem slug: {code (class Solution / program),
explanation, complexity}. The logic mirrors the verified reference solutions in
seed_problems.py; every one is re-checked through the sandbox after seeding.
"""

SOLUTIONS = {
    "two-sum": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "Keep a hash map from value to index. For each number, check whether its complement (target - x) has already been seen; if so you have the pair.",
        "code": '''class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, x in enumerate(nums):
            if target - x in seen:
                return [seen[target - x], i]
            seen[x] = i''',
    },
    "contains-duplicate": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "A set discards duplicates, so if its size differs from the list length, a value repeated.",
        "code": '''class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        return len(set(nums)) != len(nums)''',
    },
    "first-non-repeating": {
        "complexity": "O(n) time, O(1) space (fixed alphabet)",
        "explanation": "Count every character, then scan again and return the first index whose count is exactly 1.",
        "code": '''class Solution:
    def firstUniqChar(self, s: str) -> int:
        c = Counter(s)
        for i, ch in enumerate(s):
            if c[ch] == 1:
                return i
        return -1''',
    },
    "fizzbuzz": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "Check divisibility by 15 first (both 3 and 5), then 3, then 5, else the number itself.",
        "code": '''class Solution:
    def fizzBuzz(self, n: int) -> List[str]:
        out = []
        for i in range(1, n + 1):
            if i % 15 == 0:
                out.append("FizzBuzz")
            elif i % 3 == 0:
                out.append("Fizz")
            elif i % 5 == 0:
                out.append("Buzz")
            else:
                out.append(str(i))
        return out''',
    },
    "invert-binary-tree": {
        "complexity": "O(n) time, O(h) space",
        "explanation": "Recursively swap the two children of every node.",
        "code": '''class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if root:
            root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root''',
    },
    "last-stone-weight": {
        "complexity": "O(n log n) time, O(n) space",
        "explanation": "Use a max-heap (negate values). Pop the two heaviest; if unequal, push back their difference.",
        "code": '''class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        h = [-x for x in stones]
        heapq.heapify(h)
        while len(h) > 1:
            a = -heapq.heappop(h)
            b = -heapq.heappop(h)
            if a != b:
                heapq.heappush(h, -(a - b))
        return -h[0] if h else 0''',
    },
    "majority-element": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Boyer-Moore voting: maintain a candidate and a count; the true majority survives net cancellation.",
        "code": '''class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        count = cand = 0
        for x in nums:
            if count == 0:
                cand = x
            count += 1 if x == cand else -1
        return cand''',
    },
    "max-depth-binary-tree": {
        "complexity": "O(n) time, O(h) space",
        "explanation": "Depth of a node is 1 plus the max depth of its two subtrees.",
        "code": '''class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        return 0 if not root else 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))''',
    },
    "meeting-rooms": {
        "complexity": "O(n log n) time, O(1) space",
        "explanation": "Sort by start time; a meeting that starts before the previous one ends is a conflict.",
        "code": '''class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        intervals.sort()
        return all(intervals[i][0] >= intervals[i - 1][1] for i in range(1, len(intervals)))''',
    },
    "merge-sorted-array": {
        "complexity": "O(n + m) time, O(n + m) space",
        "explanation": "Two pointers walk both arrays, always taking the smaller front element.",
        "code": '''class Solution:
    def mergeSortedArrays(self, a: List[int], b: List[int]) -> List[int]:
        i = j = 0
        out = []
        while i < len(a) and j < len(b):
            if a[i] <= b[j]:
                out.append(a[i]); i += 1
            else:
                out.append(b[j]); j += 1
        out.extend(a[i:])
        out.extend(b[j:])
        return out''',
    },
    "move-zeroes": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "A write pointer marks the next non-zero slot; swap each non-zero forward, pushing zeros to the end.",
        "code": '''class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        z = 0
        for i in range(len(nums)):
            if nums[i] != 0:
                nums[z], nums[i] = nums[i], nums[z]
                z += 1''',
    },
    "number-of-1-bits": {
        "complexity": "O(1) time (32-bit), O(1) space",
        "explanation": "Count set bits directly from the binary representation.",
        "code": '''class Solution:
    def hammingWeight(self, n: int) -> int:
        return bin(n).count("1")''',
    },
    "ransom-note": {
        "complexity": "O(n + m) time, O(1) space",
        "explanation": "Count the magazine letters; the note is buildable only if it never needs more of a letter than is available.",
        "code": '''class Solution:
    def canConstruct(self, ransomNote: str, magazine: str) -> bool:
        have = Counter(magazine)
        need = Counter(ransomNote)
        return all(have[c] >= need[c] for c in need)''',
    },
    "reverse-linked-list": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Walk the list, re-pointing each node's next to the previous node.",
        "code": '''class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        while head:
            head.next, prev, head = prev, head, head.next
        return prev''',
    },
    "reverse-string": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "Slice with a step of -1.",
        "code": '''class Solution:
    def reverseString(self, s: str) -> str:
        return s[::-1]''',
    },
    "single-number": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "XOR is associative and self-cancelling, so XOR-ing everything leaves only the lone number.",
        "code": '''class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        x = 0
        for v in nums:
            x ^= v
        return x''',
    },
    "valid-anagram": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Two strings are anagrams iff their character counts are identical.",
        "code": '''class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        return Counter(s) == Counter(t)''',
    },
    "valid-palindrome": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "Keep only alphanumeric characters, lowercase them, and compare with the reverse.",
        "code": '''class Solution:
    def isPalindrome(self, s: str) -> bool:
        f = [c.lower() for c in s if c.isalnum()]
        return f == f[::-1]''',
    },
    "valid-parentheses": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "Push openers; on a closer, the top of the stack must be its matching opener.",
        "code": '''class Solution:
    def isValid(self, s: str) -> bool:
        pairs = {")": "(", "]": "[", "}": "{"}
        st = []
        for ch in s:
            if ch in "([{":
                st.append(ch)
            elif not st or st.pop() != pairs[ch]:
                return False
        return not st''',
    },
    "three-sum": {
        "complexity": "O(n^2) time, O(1) extra space",
        "explanation": "Sort, then for each number two-pointer the rest for a pair summing to its negation; skip duplicates.",
        "code": '''class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        res = []
        for i in range(len(nums)):
            if i and nums[i] == nums[i - 1]:
                continue
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s < 0:
                    l += 1
                elif s > 0:
                    r -= 1
                else:
                    res.append([nums[i], nums[l], nums[r]])
                    l += 1
                    r -= 1
                    while l < r and nums[l] == nums[l - 1]:
                        l += 1
        return res''',
    },
    "best-time-to-buy": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Track the lowest price seen so far and the best profit against it.",
        "code": '''class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        lo = float("inf")
        best = 0
        for p in prices:
            lo = min(lo, p)
            best = max(best, p - lo)
        return best''',
    },
    "binary-search": {
        "complexity": "O(log n) time, O(1) space",
        "explanation": "Halve the search range each step based on how the midpoint compares to the target.",
        "code": '''class Solution:
    def search(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1''',
    },
    "climbing-stairs": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Ways(n) = Ways(n-1) + Ways(n-2) — it's the Fibonacci sequence.",
        "code": '''class Solution:
    def climbStairs(self, n: int) -> int:
        a, b = 1, 1
        for _ in range(n):
            a, b = b, a + b
        return a''',
    },
    "coin-change": {
        "complexity": "O(amount * coins) time, O(amount) space",
        "explanation": "dp[a] = fewest coins to make amount a; try every coin as the last one used.",
        "code": '''class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        dp = [0] + [float("inf")] * amount
        for a in range(1, amount + 1):
            for c in coins:
                if c <= a:
                    dp[a] = min(dp[a], dp[a - c] + 1)
        return dp[amount] if dp[amount] != float("inf") else -1''',
    },
    "container-with-most-water": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Two pointers from the ends; always move the shorter wall inward, since it limits the area.",
        "code": '''class Solution:
    def maxArea(self, height: List[int]) -> int:
        l, r, best = 0, len(height) - 1, 0
        while l < r:
            best = max(best, (r - l) * min(height[l], height[r]))
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
        return best''',
    },
    "course-schedule": {
        "complexity": "O(V + E) time, O(V + E) space",
        "explanation": "Kahn's topological sort: repeatedly remove zero-indegree nodes. If all get processed there's no cycle.",
        "code": '''class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        graph = defaultdict(list)
        indeg = [0] * numCourses
        for a, b in prerequisites:
            graph[b].append(a)
            indeg[a] += 1
        q = deque(i for i in range(numCourses) if indeg[i] == 0)
        seen = 0
        while q:
            node = q.popleft()
            seen += 1
            for nxt in graph[node]:
                indeg[nxt] -= 1
                if indeg[nxt] == 0:
                    q.append(nxt)
        return seen == numCourses''',
    },
    "daily-temperatures": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "A monotonic decreasing stack of indices waits for a warmer day; each pop records the gap.",
        "code": '''class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        res = [0] * len(temperatures)
        st = []
        for i, x in enumerate(temperatures):
            while st and temperatures[st[-1]] < x:
                j = st.pop()
                res[j] = i - j
            st.append(i)
        return res''',
    },
    "evaluate-reverse-polish-notation": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "Push numbers; on an operator, pop two operands and push the result. int(a/b) truncates toward zero.",
        "code": '''class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        st = []
        for t in tokens:
            if t in ("+", "-", "*", "/"):
                b = st.pop()
                a = st.pop()
                st.append(a + b if t == "+" else a - b if t == "-" else a * b if t == "*" else int(a / b))
            else:
                st.append(int(t))
        return st[0]''',
    },
    "group-anagrams": {
        "complexity": "O(n * k log k) time, O(n * k) space",
        "explanation": "Two words are anagrams iff their sorted letters match, so key each word by its sorted form.",
        "code": '''class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        groups = defaultdict(list)
        for s in strs:
            groups["".join(sorted(s))].append(s)
        return list(groups.values())''',
    },
    "house-robber": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "At each house, either skip it (keep prev best) or rob it (best before the neighbour plus its value).",
        "code": '''class Solution:
    def rob(self, nums: List[int]) -> int:
        prev = cur = 0
        for x in nums:
            prev, cur = cur, max(cur, prev + x)
        return cur''',
    },
    "jump-game": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Track the furthest reachable index; if you ever stand beyond it, you're stuck.",
        "code": '''class Solution:
    def canJump(self, nums: List[int]) -> bool:
        reach = 0
        for i, x in enumerate(nums):
            if i > reach:
                return False
            reach = max(reach, i + x)
        return True''',
    },
    "koko-eating-bananas": {
        "complexity": "O(n log(max pile)) time, O(1) space",
        "explanation": "Feasible eating speeds form a monotonic boundary, so binary-search the smallest speed that finishes within h hours.",
        "code": '''class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        lo, hi = 1, max(piles)
        while lo < hi:
            mid = (lo + hi) // 2
            if sum(math.ceil(p / mid) for p in piles) <= h:
                hi = mid
            else:
                lo = mid + 1
        return lo''',
    },
    "kth-largest-element-in-an-array": {
        "complexity": "O(n log k) time, O(k) space",
        "explanation": "A size-k min-heap keeps the k largest seen; its smallest is the k-th largest.",
        "code": '''class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        return heapq.nlargest(k, nums)[-1]''',
    },
    "longest-common-subsequence": {
        "complexity": "O(n * m) time, O(n * m) space",
        "explanation": "dp[i][j] = LCS of the suffixes; match extends the diagonal, else take the best of dropping one character.",
        "code": '''class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        dp = [[0] * (len(text2) + 1) for _ in range(len(text1) + 1)]
        for i in range(len(text1) - 1, -1, -1):
            for j in range(len(text2) - 1, -1, -1):
                dp[i][j] = dp[i + 1][j + 1] + 1 if text1[i] == text2[j] else max(dp[i + 1][j], dp[i][j + 1])
        return dp[0][0]''',
    },
    "longest-increasing-subsequence": {
        "complexity": "O(n log n) time, O(n) space",
        "explanation": "Patience sorting: keep the smallest possible tail for each subsequence length; binary-search each number's slot.",
        "code": '''class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        tails = []
        for x in nums:
            i = bisect.bisect_left(tails, x)
            if i == len(tails):
                tails.append(x)
            else:
                tails[i] = x
        return len(tails)''',
    },
    "longest-substring": {
        "complexity": "O(n) time, O(1) space (charset)",
        "explanation": "Sliding window; on a repeat, jump the window start past the character's previous position.",
        "code": '''class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        seen = {}
        start = best = 0
        for i, ch in enumerate(s):
            if ch in seen and seen[ch] >= start:
                start = seen[ch] + 1
            seen[ch] = i
            best = max(best, i - start + 1)
        return best''',
    },
    "max-subarray": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Kadane's algorithm: at each element, either extend the running sum or restart from it.",
        "code": '''class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        best = cur = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)
            best = max(best, cur)
        return best''',
    },
    "merge-intervals": {
        "complexity": "O(n log n) time, O(n) space",
        "explanation": "Sort by start; extend the last interval when the next one overlaps, otherwise begin a new one.",
        "code": '''class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        out = []
        for s, e in sorted(intervals):
            if out and s <= out[-1][1]:
                out[-1][1] = max(out[-1][1], e)
            else:
                out.append([s, e])
        return out''',
    },
    "number-of-islands": {
        "complexity": "O(R * C) time, O(R * C) space",
        "explanation": "Scan the grid; each unvisited land cell starts an island that you sink with DFS flood-fill.",
        "code": '''class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid:
            return 0
        R, C = len(grid), len(grid[0])

        def sink(i, j):
            if 0 <= i < R and 0 <= j < C and grid[i][j] == "1":
                grid[i][j] = "0"
                sink(i + 1, j); sink(i - 1, j); sink(i, j + 1); sink(i, j - 1)

        count = 0
        for i in range(R):
            for j in range(C):
                if grid[i][j] == "1":
                    count += 1
                    sink(i, j)
        return count''',
    },
    "partition-equal-subset-sum": {
        "complexity": "O(n * sum) time, O(sum) space",
        "explanation": "If the total is odd it's impossible; otherwise it's a subset-sum for total/2, tracked as a set of reachable sums.",
        "code": '''class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        total = sum(nums)
        if total % 2:
            return False
        target = total // 2
        dp = {0}
        for x in nums:
            dp |= {x + v for v in dp if x + v <= target}
        return target in dp''',
    },
    "product-except-self": {
        "complexity": "O(n) time, O(1) extra space",
        "explanation": "Multiply a running prefix product, then a running suffix product, into the result — no division.",
        "code": '''class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        res = [1] * n
        pre = 1
        for i in range(n):
            res[i] = pre
            pre *= nums[i]
        suf = 1
        for i in range(n - 1, -1, -1):
            res[i] *= suf
            suf *= nums[i]
        return res''',
    },
    "rotate-image": {
        "complexity": "O(n^2) time, O(1) space",
        "explanation": "Reversing the rows then transposing equals a 90-degree clockwise rotation, done in place.",
        "code": '''class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        matrix.reverse()
        for i in range(len(matrix)):
            for j in range(i):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]''',
    },
    "search-in-rotated-sorted-array": {
        "complexity": "O(log n) time, O(1) space",
        "explanation": "Binary search, but at each step one half is sorted; decide which half to keep by checking if target lies in it.",
        "code": '''class Solution:
    def search(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[lo] <= nums[mid]:
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:
                if nums[mid] < target <= nums[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return -1''',
    },
    "top-k-frequent": {
        "complexity": "O(n) time, O(n) space",
        "explanation": "Count frequencies and take the k most common.",
        "code": '''class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        return [x for x, _ in Counter(nums).most_common(k)]''',
    },
    "unique-paths": {
        "complexity": "O(1) time, O(1) space",
        "explanation": "Every path is a sequence of (m-1) downs and (n-1) rights, so the count is the binomial C(m+n-2, m-1).",
        "code": '''class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        return math.comb(m + n - 2, m - 1)''',
    },
    "validate-bst": {
        "complexity": "O(n) time, O(h) space",
        "explanation": "Recurse with an allowed (lo, hi) range for each node; a BST keeps every value strictly inside its range.",
        "code": '''class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        def ok(node, lo, hi):
            if not node:
                return True
            if not (lo < node.val < hi):
                return False
            return ok(node.left, lo, node.val) and ok(node.right, node.val, hi)
        return ok(root, float("-inf"), float("inf"))''',
    },
    "word-break": {
        "complexity": "O(n^2) time, O(n) space",
        "explanation": "dp[i] = can the prefix of length i be segmented; true if some split point j has dp[j] and s[j:i] in the dictionary.",
        "code": '''class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        words = set(wordDict)
        dp = [True] + [False] * len(s)
        for i in range(1, len(s) + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[len(s)]''',
    },
    "word-search": {
        "complexity": "O(R * C * 4^L) time, O(L) space",
        "explanation": "DFS from each cell, matching the word letter by letter and marking cells visited (backtracking on return).",
        "code": '''class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        R, C = len(board), len(board[0])

        def dfs(i, j, k):
            if k == len(word):
                return True
            if i < 0 or j < 0 or i >= R or j >= C or board[i][j] != word[k]:
                return False
            tmp = board[i][j]
            board[i][j] = "#"
            found = dfs(i + 1, j, k + 1) or dfs(i - 1, j, k + 1) or dfs(i, j + 1, k + 1) or dfs(i, j - 1, k + 1)
            board[i][j] = tmp
            return found

        return any(dfs(i, j, 0) for i in range(R) for j in range(C))''',
    },
    "edit-distance": {
        "complexity": "O(n * m) time, O(m) space",
        "explanation": "Classic Levenshtein DP over one rolling row: match keeps the diagonal, else 1 + min(insert, delete, replace).",
        "code": '''class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        dp = list(range(len(word2) + 1))
        for i in range(1, len(word1) + 1):
            prev = dp[0]
            dp[0] = i
            for j in range(1, len(word2) + 1):
                cur = dp[j]
                dp[j] = prev if word1[i - 1] == word2[j - 1] else 1 + min(prev, dp[j], dp[j - 1])
                prev = cur
        return dp[len(word2)]''',
    },
    "median-two-sorted-arrays": {
        "complexity": "O((n + m) log(n + m)) time — the optimal is O(log(min(n, m)))",
        "explanation": "Merge and take the middle. For the optimal, binary-search a partition of the smaller array so left halves <= right halves.",
        "code": '''class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        m = sorted(nums1 + nums2)
        n = len(m)
        return float(m[n // 2]) if n % 2 else (m[n // 2 - 1] + m[n // 2]) / 2.0''',
    },
    "merge-k-sorted-lists": {
        "complexity": "O(N log k) time, O(k) space",
        "explanation": "A min-heap holds the current head of each list; repeatedly pop the smallest and push its successor.",
        "code": '''class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        h = []
        for i, node in enumerate(lists):
            if node:
                heapq.heappush(h, (node.val, i, node))
        dummy = tail = ListNode()
        while h:
            val, i, node = heapq.heappop(h)
            tail.next = node
            tail = node
            if node.next:
                heapq.heappush(h, (node.next.val, i, node.next))
        return dummy.next''',
    },
    "sliding-window-maximum": {
        "complexity": "O(n) time, O(k) space",
        "explanation": "A monotonic decreasing deque of indices; the front is always the current window's maximum.",
        "code": '''class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        dq = deque()
        out = []
        for i, x in enumerate(nums):
            while dq and nums[dq[-1]] <= x:
                dq.pop()
            dq.append(i)
            if dq[0] <= i - k:
                dq.popleft()
            if i >= k - 1:
                out.append(nums[dq[0]])
        return out''',
    },
    "trapping-rain-water": {
        "complexity": "O(n) time, O(1) space",
        "explanation": "Two pointers; water above each bar is bounded by the smaller of the tallest walls seen from each side.",
        "code": '''class Solution:
    def trap(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        lm = rm = res = 0
        while l < r:
            if height[l] < height[r]:
                lm = max(lm, height[l])
                res += lm - height[l]
                l += 1
            else:
                rm = max(rm, height[r])
                res += rm - height[r]
                r -= 1
        return res''',
    },
    "lru-cache": {
        "complexity": "O(1) per operation",
        "explanation": "An OrderedDict acts as hash map + doubly linked list: move_to_end on every access; popitem(last=False) evicts the least-recently-used key.",
        "code": '''from collections import OrderedDict
import sys

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.d = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.d:
            return -1
        self.d.move_to_end(key)
        return self.d[key]

    def put(self, key: int, value: int) -> None:
        if key in self.d:
            self.d.move_to_end(key)
        self.d[key] = value
        if len(self.d) > self.cap:
            self.d.popitem(last=False)

def main():
    lines = [l for l in sys.stdin.read().split("\\n") if l.strip()]
    cache = LRUCache(int(lines[0]))
    out = []
    for ln in lines[1:]:
        p = ln.split()
        if p[0] == "put":
            cache.put(int(p[1]), int(p[2]))
        else:
            out.append(str(cache.get(int(p[1]))))
    print("\\n".join(out))

if __name__ == "__main__":
    main()''',
    },
}
