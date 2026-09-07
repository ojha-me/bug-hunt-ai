// Pattern-based interview DSA track. Each pattern teaches the recognition cue,
// the core idea, a code template, and pitfalls — then lists its problems (graded
// easy -> hard, drawn from the seeded problem set by slug).

export interface Pattern {
  slug: string;
  name: string;
  cue: string; // how to recognize the pattern in a problem statement
  idea: string; // the core mental model
  template: string; // python skeleton
  complexity: string;
  pitfalls: string[];
  problemSlugs: string[]; // ordered easy -> hard
}

export const PATTERNS: Pattern[] = [
  {
    slug: "arrays-hashing",
    name: "Arrays & Hashing",
    cue: "You need fast lookups, dedup, counting, or grouping — “have I seen this before?”, “how many times?”, “which items share a key?”",
    idea: "Trade space for time. A hash map/set turns a repeated O(n) scan (O(n²) overall) into O(1) lookups (O(n) total): count with a frequency map, dedup with a set, group by a computed key.",
    template: `seen = {}                      # or set()
for i, x in enumerate(nums):
    if x in seen:              # O(1) membership
        ...
    seen[x] = i                # store index / count

from collections import Counter, defaultdict
freq = Counter(nums)           # counting
groups = defaultdict(list)     # grouping
for s in strs:
    groups[key(s)].append(s)`,
    complexity: "Usually O(n) time, O(n) space.",
    pitfalls: [
      "Reaching for nested loops (O(n²)) when a hash map makes it O(n).",
      "Storing the value when you need the index (or vice versa).",
      "Assuming hash maps keep sorted or insertion-critical order.",
    ],
    problemSlugs: [
      "contains-duplicate", "two-sum", "valid-anagram", "ransom-note",
      "majority-element", "first-non-repeating", "group-anagrams",
      "top-k-frequent", "product-except-self",
    ],
  },
  {
    slug: "two-pointers",
    name: "Two Pointers",
    cue: "A sorted array/string, or you're pairing/comparing from both ends (or at different speeds) — “find a pair summing to X”, “is it a palindrome”, “partition in place”.",
    idea: "Two indices moving toward each other (or the same way at different speeds) replace a nested loop. On sorted data, comparing the ends tells you which pointer to move — O(n) instead of O(n²).",
    template: `l, r = 0, len(a) - 1
while l < r:
    if condition(a[l], a[r]):
        l += 1
    else:
        r -= 1

# fast/slow (same direction) — e.g. compact in place
slow = 0
for fast in range(len(a)):
    if keep(a[fast]):
        a[slow] = a[fast]
        slow += 1`,
    complexity: "O(n) time, O(1) space.",
    pitfalls: [
      "Using two pointers on unsorted data when the logic assumes sorted.",
      "Off-by-one on the `l < r` vs `l <= r` boundary.",
      "Forgetting to skip duplicates (e.g. in 3Sum).",
    ],
    problemSlugs: [
      "valid-palindrome", "merge-sorted-array", "move-zeroes", "reverse-string",
      "three-sum", "container-with-most-water", "trapping-rain-water",
    ],
  },
  {
    slug: "sliding-window",
    name: "Sliding Window",
    cue: "A contiguous subarray/substring question — “longest/shortest/max window that satisfies X”, or “window of size k”.",
    idea: "Grow the window with the right pointer; when it violates the constraint, shrink from the left. Each element enters and leaves once → O(n), versus checking all O(n²) windows.",
    template: `left = 0
window = {}            # state of the current window
best = 0
for right in range(len(s)):
    add(s[right], window)
    while invalid(window):        # shrink until valid again
        remove(s[left], window)
        left += 1
    best = max(best, right - left + 1)
return best`,
    complexity: "O(n) time, O(k) space for the window state.",
    pitfalls: [
      "Recomputing the window from scratch each step — that's back to O(n²).",
      "Fixed-size vs variable-size window need different shrink logic.",
      "Updating `best` at the wrong moment (before vs after shrinking).",
    ],
    problemSlugs: ["longest-substring", "best-time-to-buy", "sliding-window-maximum"],
  },
  {
    slug: "stack",
    name: "Stack & Monotonic Stack",
    cue: "Match/undo the most recent thing, track “next greater/smaller”, or parse nested structure — brackets, expressions, temperatures.",
    idea: "A stack is LIFO: the last thing pushed is first available. A monotonic stack (kept increasing or decreasing) answers “next greater/smaller element” in O(n) by popping while the new element beats the top.",
    template: `st = []
for i, x in enumerate(items):
    while st and should_pop(st[-1], x):   # monotonic
        top = st.pop()
        resolve(top, x)
    st.append(i)                          # often store indices

# matching:
for ch in s:
    if opener(ch): st.append(ch)
    elif not st or st.pop() != match(ch): return False`,
    complexity: "O(n) time, O(n) space.",
    pitfalls: [
      "Popping an empty stack — always check `if st` first.",
      "Storing values when you need indices (monotonic stacks usually store indices).",
      "Forgetting to handle items left on the stack at the end.",
    ],
    problemSlugs: ["valid-parentheses", "evaluate-reverse-polish-notation", "daily-temperatures"],
  },
  {
    slug: "binary-search",
    name: "Binary Search",
    cue: "Sorted input — OR you can phrase the answer as “smallest/largest value that satisfies a monotonic condition” (“min speed to finish in time”, “search a rotated array”).",
    idea: "Halve the search space each step: O(log n). Beyond sorted arrays, binary-search the ANSWER: if feasible(x) is monotonic (false…false, true…true), find the boundary.",
    template: `lo, hi = 0, len(a) - 1
while lo <= hi:                 # exact match
    mid = (lo + hi) // 2
    if a[mid] == target: return mid
    if a[mid] < target: lo = mid + 1
    else: hi = mid - 1
return -1

# binary search on the answer:
lo, hi = min_ans, max_ans
while lo < hi:                  # find boundary
    mid = (lo + hi) // 2
    if feasible(mid): hi = mid
    else: lo = mid + 1
return lo`,
    complexity: "O(log n) per search.",
    pitfalls: [
      "Infinite loops from wrong mid/boundary updates.",
      "`lo <= hi` (find exact) vs `lo < hi` (find boundary) — choose deliberately.",
      "Missing that the answer itself can be binary-searched, not just the array.",
    ],
    problemSlugs: ["binary-search", "koko-eating-bananas", "search-in-rotated-sorted-array", "median-two-sorted-arrays"],
  },
  {
    slug: "linked-list",
    name: "Linked List",
    cue: "Singly/doubly linked-list operations — reverse, detect a cycle, merge, find the middle, remove the nth node.",
    idea: "A dummy head kills edge cases; careful prev/curr/next rewiring does the work. Fast & slow pointers find the middle or a cycle. Most ops are O(n), O(1) space.",
    template: `dummy = ListNode(0, head)

prev, curr = None, head        # reverse
while curr:
    nxt = curr.next            # save before rewiring
    curr.next = prev
    prev, curr = curr, nxt

slow = fast = head             # fast/slow: middle or cycle
while fast and fast.next:
    slow, fast = slow.next, fast.next.next`,
    complexity: "O(n) time, O(1) space.",
    pitfalls: [
      "Losing the rest of the list — save `curr.next` before rewiring.",
      "Skipping the dummy head, then special-casing the head everywhere.",
      "Null-pointer errors on `fast.next.next`.",
    ],
    problemSlugs: ["reverse-linked-list", "lru-cache", "merge-k-sorted-lists"],
  },
  {
    slug: "trees",
    name: "Trees (DFS / BFS)",
    cue: "Anything on a binary tree/BST — depth, validate, traverse, path sums, lowest common ancestor.",
    idea: "Recursion mirrors the tree: solve the children, combine at the node. DFS for depth/paths; BFS (a queue) for level-order. For BSTs, exploit the ordering to prune.",
    template: `def dfs(node):
    if not node:                # base case!
        return base
    left = dfs(node.left)
    right = dfs(node.right)
    return combine(node.val, left, right)

from collections import deque    # BFS / level order
q = deque([root])
while q:
    node = q.popleft()
    if node.left: q.append(node.left)
    if node.right: q.append(node.right)`,
    complexity: "O(n) time, O(h) space (recursion depth = height).",
    pitfalls: [
      "Forgetting the null base case → crashes.",
      "Validating a BST by comparing only parent–child instead of carrying a (lo, hi) range.",
      "Confusing depth (nodes) with height (edges).",
    ],
    problemSlugs: ["invert-binary-tree", "max-depth-binary-tree", "validate-bst"],
  },
  {
    slug: "heap",
    name: "Heap / Priority Queue",
    cue: "You need the k largest/smallest, a running median, or to repeatedly pull the min/max — “top k”, “merge k lists”, “schedule by priority”.",
    idea: "A heap gives O(log n) push/pop of the min (max via negation). For “top k”, keep a size-k heap → O(n log k). For merging sorted streams, keep a heap of the current heads.",
    template: `import heapq
h = []
for x in nums:                 # keep the k largest
    heapq.heappush(h, x)
    if len(h) > k:
        heapq.heappop(h)
# h[0] of a size-k min-heap == the k-th largest
# max-heap: push -x`,
    complexity: "O(n log k) for top-k; O(N log k) to merge k lists.",
    pitfalls: [
      "Python's heapq is a MIN-heap — negate values for a max-heap.",
      "Sorting the whole array (O(n log n)) when a size-k heap (O(n log k)) is enough.",
      "Pushing tuples that can tie on the sort key — add an index to break ties.",
    ],
    problemSlugs: ["last-stone-weight", "kth-largest-element-in-an-array", "top-k-frequent", "merge-k-sorted-lists"],
  },
  {
    slug: "backtracking",
    name: "Backtracking",
    cue: "Enumerate all subsets/combinations/permutations, or search for a valid configuration — “all subsets”, “word search”, “combination sum”, “N-queens”.",
    idea: "Build a candidate incrementally: choose, recurse, then UNDO the choice (backtrack). Prune branches that can't succeed. Exponential in the worst case, but pruning keeps it tractable.",
    template: `def backtrack(path, choices):
    if is_solution(path):
        results.append(path[:])   # copy!
        return
    for c in choices:
        if not valid(c): continue
        path.append(c)            # choose
        backtrack(path, next_choices(c))
        path.pop()                # undo`,
    complexity: "Exponential — O(2^n) subsets, O(n!) permutations — cut down by pruning.",
    pitfalls: [
      "Appending the path without copying — every result ends up identical.",
      "Forgetting to undo (`pop`) the choice on the way back up.",
      "No pruning, so it times out.",
    ],
    problemSlugs: ["word-search"],
  },
  {
    slug: "graphs",
    name: "Graphs (BFS / DFS / Topo)",
    cue: "Nodes and edges — grids (islands), dependencies (course order), reachability. “Can I get to X?”, “is there a cycle?”, “what order?”",
    idea: "Model as an adjacency list or grid. BFS (queue) for shortest unweighted path/levels; DFS for reachability/components; topological sort for dependency ordering. Always track visited to avoid infinite loops.",
    template: `from collections import deque, defaultdict
graph = defaultdict(list)
for a, b in edges: graph[a].append(b)

q, seen = deque([start]), {start}      # BFS
while q:
    node = q.popleft()
    for nxt in graph[node]:
        if nxt not in seen:
            seen.add(nxt)              # mark on enqueue
            q.append(nxt)`,
    complexity: "O(V + E).",
    pitfalls: [
      "Forgetting `visited` → infinite loops / re-processing.",
      "Marking visited on pop instead of on enqueue → duplicates in the queue.",
      "Mixing up directed vs undirected edges.",
    ],
    problemSlugs: ["number-of-islands", "course-schedule"],
  },
  {
    slug: "dynamic-programming",
    name: "Dynamic Programming",
    cue: "Overlapping subproblems + optimal substructure — “count the ways”, “min/max cost”, “can you reach/partition”, “longest/shortest …”. Often “at each step, choose”.",
    idea: "Define a state (dp[i] or dp[i][j]) = the answer to a subproblem, and a recurrence built from smaller states. Memoize (top-down) or fill a table (bottom-up). Turns exponential recursion into polynomial.",
    template: `# 1D
dp = [base] * (n + 1)
for i in range(1, n + 1):
    dp[i] = combine(dp[i - 1], dp[i - 2], ...)   # transition
return dp[n]

# 2D (two sequences)
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        dp[i][j] = ...    # from dp[i-1][j], dp[i][j-1], dp[i-1][j-1]`,
    complexity: "Usually O(states × transition) — e.g. O(n) or O(n·m).",
    pitfalls: [
      "Wrong base cases or off-by-one on the table size.",
      "Wrong iteration order — using a state before it's computed.",
      "Missing that a 2D table can often be compressed to one row.",
    ],
    problemSlugs: [
      "climbing-stairs", "house-robber", "coin-change", "jump-game", "unique-paths",
      "max-subarray", "longest-increasing-subsequence", "longest-common-subsequence",
      "word-break", "partition-equal-subset-sum", "edit-distance",
    ],
  },
  {
    slug: "intervals",
    name: "Intervals",
    cue: "Ranges with start/end — “merge overlapping”, “can attend all meetings”, “insert an interval”, “minimum rooms”.",
    idea: "Sort by start (or end), then a single pass decides overlaps: the current interval overlaps the previous if its start ≤ the previous end. Sorting is the unlock.",
    template: `intervals.sort()
merged = []
for s, e in intervals:
    if merged and s <= merged[-1][1]:      # overlap -> extend
        merged[-1][1] = max(merged[-1][1], e)
    else:
        merged.append([s, e])
return merged`,
    complexity: "O(n log n) for the sort, O(n) pass.",
    pitfalls: [
      "Forgetting to sort first.",
      "Off-by-one on whether touching endpoints ([1,2],[2,3]) count as overlapping.",
      "Sorting by the wrong key (start vs end) for the specific problem.",
    ],
    problemSlugs: ["meeting-rooms", "merge-intervals"],
  },
  {
    slug: "greedy",
    name: "Greedy",
    cue: "You can make a locally optimal choice at each step and never regret it — “maximum reach”, “best time to act”, “fewest of something”.",
    idea: "Take the best immediate option (furthest reach, lowest price so far, earliest finish) and carry a running best. The hard part is proving the greedy choice is actually optimal.",
    template: `running = init
best = start
for x in items:
    running = update(running, x)   # min-so-far / furthest reach
    best = better(best, use(running, x))
return best`,
    complexity: "Usually O(n) or O(n log n).",
    pitfalls: [
      "Assuming greedy works when the problem actually needs DP — verify the greedy choice is safe.",
      "Tracking the wrong “running best”.",
      "Confusing greedy with brute force over all options.",
    ],
    problemSlugs: ["best-time-to-buy", "jump-game", "max-subarray"],
  },
  {
    slug: "bit-manipulation",
    name: "Bit Manipulation",
    cue: "Parity, toggling/checking bits, XOR tricks, or O(1)-space counting — “the number that appears once”, “count set bits”, “is it a power of two”.",
    idea: "Bits are a set of flags. XOR cancels pairs (a ^ a = 0), AND masks, OR sets, shifts move. `n & (n - 1)` clears the lowest set bit — handy for counting bits and power-of-two checks.",
    template: `x = 0
for v in nums:
    x ^= v            # pairs cancel; the lone value remains

count = 0             # count set bits
while n:
    n &= n - 1        # clear the lowest set bit
    count += 1`,
    complexity: "O(n) or O(#bits), O(1) extra space.",
    pitfalls: [
      "Forgetting XOR is its own inverse — that's the whole trick.",
      "Sign/overflow in fixed-width-int languages (less of an issue in Python).",
      "Reaching for a hash set when XOR gives the same answer in O(1) space.",
    ],
    problemSlugs: ["single-number", "number-of-1-bits"],
  },
];
