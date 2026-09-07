// Interactive layer for each pattern: recognition drills (spot the pattern) and
// a guided worked example. Keyed by pattern slug so it stays decoupled from the
// lesson content in patterns.ts.

export interface PatternDrill {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface WalkStep {
  prompt: string;
  reveal: string;
}

export interface Walkthrough {
  problem: string;
  steps: WalkStep[];
  outcome: string;
}

export interface PatternInteractive {
  drills: PatternDrill[];
  walkthrough: Walkthrough;
}

export const PATTERN_INTERACTIVE: Record<string, PatternInteractive> = {
  "arrays-hashing": {
    drills: [
      {
        question: "“Given an array, return true if any value appears at least twice.” Which pattern?",
        options: ["Two Pointers", "Arrays & Hashing (a set)", "Binary Search"],
        answerIndex: 1,
        explanation: "“Have I seen this before?” over an unsorted array → a hash set gives O(1) membership and O(n) overall.",
      },
      {
        question: "You're grouping words that are anagrams of each other. What's the key idea?",
        options: [
          "Sort the whole list and scan neighbours",
          "Use each word's sorted letters as a hash-map key",
          "Compare every pair of words",
        ],
        answerIndex: 1,
        explanation: "Anagrams share the same sorted letters, so a map from sorted-letters → list groups them in one pass.",
      },
      {
        question: "Which of these is the WRONG reason to reach for a hash map?",
        options: [
          "You need O(1) lookups by key",
          "You need the elements kept in sorted order",
          "You're counting frequencies",
        ],
        answerIndex: 1,
        explanation: "Hash maps don't maintain sorted order — if you need ordering, sort or use a different structure.",
      },
    ],
    walkthrough: {
      problem: "Two Sum — find indices of two numbers in `nums` that add to `target`.",
      steps: [
        { prompt: "Brute force is O(n²). What lookup do we actually repeat?", reveal: "For each x, we ask “is target − x somewhere in the array?” — a membership question." },
        { prompt: "How do we make that lookup O(1)?", reveal: "Store values we've seen in a hash map (value → index) as we scan." },
        { prompt: "For nums=[2,7,11,15], target=9, walk index 0 then 1.", reveal: "i=0: need 7, not seen → store {2:0}. i=1: need 2, it's in the map at 0 → answer [0,1]." },
      ],
      outcome: "One pass, O(n) time / O(n) space — the hash map turned a nested loop into a single scan.",
    },
  },

  "two-pointers": {
    drills: [
      {
        question: "“In a SORTED array, find a pair summing to target.” Which pattern, and why?",
        options: [
          "Hashing — store complements",
          "Two Pointers — the array is sorted, so converge from the ends",
          "Sliding Window — it's a subarray",
        ],
        answerIndex: 1,
        explanation: "Sorted + find-a-pair is the classic two-pointer tell: compare the ends; the sum tells you which pointer to move.",
      },
      {
        question: "Sum of the two pointers is TOO BIG. Which pointer moves?",
        options: ["Move left rightward (increase)", "Move right leftward (decrease)", "Move both inward"],
        answerIndex: 1,
        explanation: "To shrink the sum on sorted data, move the right pointer down to a smaller value.",
      },
      {
        question: "What quietly breaks a two-pointer solution?",
        options: [
          "Running it on unsorted data when the logic assumes sorted",
          "Using O(1) space",
          "Reading from both ends",
        ],
        answerIndex: 0,
        explanation: "The “move this pointer based on the comparison” logic only holds if the data is sorted.",
      },
    ],
    walkthrough: {
      problem: "Two Sum II (sorted input) — find a pair in sorted `a` summing to target=9, a=[2,7,11,15].",
      steps: [
        { prompt: "Where do the pointers start?", reveal: "l=0 (2), r=3 (15) — the smallest and largest." },
        { prompt: "Sum = 2+15 = 17 > 9. Which pointer moves?", reveal: "Too big → move r left. r=2 (11)." },
        { prompt: "Sum = 2+11 = 13 > 9. Again?", reveal: "Still too big → r=1 (7)." },
        { prompt: "Sum = 2+7 = 9. Done.", reveal: "Return [l, r] = [0, 1]. Each pointer moved at most n steps → O(n)." },
      ],
      outcome: "Converging pointers replace the nested loop: O(n) time, O(1) space, no extra map.",
    },
  },

  "sliding-window": {
    drills: [
      {
        question: "“Longest substring without repeating characters.” Which pattern?",
        options: ["Two Pointers on sorted data", "Sliding Window", "Backtracking"],
        answerIndex: 1,
        explanation: "A “longest/shortest contiguous substring satisfying X” question is the sliding-window signature.",
      },
      {
        question: "The window becomes invalid (a duplicate appears). What do you do?",
        options: ["Restart from scratch", "Shrink from the left until it's valid again", "Expand the right faster"],
        answerIndex: 1,
        explanation: "Move the left pointer inward (removing elements) until the constraint holds — each element leaves once, keeping it O(n).",
      },
      {
        question: "What turns a sliding window secretly back into O(n²)?",
        options: [
          "Recomputing the whole window each step instead of incrementally updating it",
          "Using a hash map for the window state",
          "Tracking the best length in a variable",
        ],
        answerIndex: 0,
        explanation: "The win comes from updating window state incrementally as pointers move — recomputing it defeats the purpose.",
      },
    ],
    walkthrough: {
      problem: "Longest substring without repeating characters in “abcabcbb”.",
      steps: [
        { prompt: "What state does the window need?", reveal: "The last index seen for each character, and a `start` marking the window's left edge." },
        { prompt: "Scan a,b,c (indices 0–2). Any repeat?", reveal: "No repeats → window “abc”, length 3, best=3." },
        { prompt: "Index 3 is 'a', last seen at 0 (inside the window). What now?", reveal: "Jump start to 0+1 = 1. Window becomes “bca”." },
        { prompt: "Keep going — the best never beats 3 here.", reveal: "Answer 3. Each index processed once → O(n)." },
      ],
      outcome: "Grow-right / shrink-left with per-char last-seen indices: O(n), not O(n²) over all substrings.",
    },
  },

  "stack": {
    drills: [
      {
        question: "“Is this string of ()[]{} validly nested?” Which structure?",
        options: ["Queue (FIFO)", "Stack (LIFO)", "Hash set"],
        answerIndex: 1,
        explanation: "The most recent opener must close first — last-in-first-out — which is exactly a stack.",
      },
      {
        question: "“For each day, how many days until a warmer temperature?” Which variant?",
        options: ["Monotonic stack", "Binary search", "Two pointers"],
        answerIndex: 0,
        explanation: "“Next greater/smaller element” is answered in O(n) by a monotonic stack of indices.",
      },
      {
        question: "What should a monotonic stack usually store?",
        options: ["The values", "The indices", "The differences"],
        answerIndex: 1,
        explanation: "Store indices so that when you pop you can compute the distance/relationship to the current position.",
      },
    ],
    walkthrough: {
      problem: "Daily Temperatures — waits for [73,74,75,71,69,72,76,73].",
      steps: [
        { prompt: "We keep a stack of indices with DECREASING temps. Push 0 (73).", reveal: "Stack: [0]." },
        { prompt: "74 > temp[0]=73 → resolve index 0.", reveal: "res[0] = 1−0 = 1. Pop 0, push 1. Stack: [1]." },
        { prompt: "75 > 74 → resolve 1; then push 2. Then 71,69 just push.", reveal: "res[1]=1. Stack becomes [2,3,4] (75,71,69 decreasing)." },
        { prompt: "72 pops 69(4) and 71(3); 76 pops the rest; 73 pushes.", reveal: "res[4]=1, res[3]=2, res[2]=4, res[5]=1, res[6]=0, res[7]=0." },
      ],
      outcome: "Each index is pushed and popped once → O(n), versus O(n²) scanning forward for each day.",
    },
  },

  "binary-search": {
    drills: [
      {
        question: "“Minimum eating speed so Koko finishes all bananas within H hours.” Why binary search?",
        options: [
          "The piles are sorted",
          "feasible(speed) is monotonic — too-slow…too-slow, then fast-enough…fast-enough",
          "It's a two-pointer problem",
        ],
        answerIndex: 1,
        explanation: "You binary-search the ANSWER: as speed rises, “finishes in time?” flips false→true exactly once. Find that boundary.",
      },
      {
        question: "Finding an exact target vs. finding a boundary — the loop differs how?",
        options: [
          "`lo <= hi` for exact match; `lo < hi` to converge on a boundary",
          "They're identical",
          "Boundary search can't use binary search",
        ],
        answerIndex: 0,
        explanation: "Exact-match returns inside the loop with `lo <= hi`; boundary search narrows with `lo < hi` and returns `lo`.",
      },
      {
        question: "Most common binary-search bug?",
        options: ["Using O(log n) space", "Wrong mid/boundary update causing an infinite loop", "Sorting first"],
        answerIndex: 1,
        explanation: "If mid or the lo/hi updates don't strictly shrink the range, the loop never terminates.",
      },
    ],
    walkthrough: {
      problem: "Koko Eating Bananas — piles=[3,6,7,11], H=8. Find the min speed k.",
      steps: [
        { prompt: "What's the search range for the answer k?", reveal: "lo=1 (slowest), hi=max(piles)=11 (eat any pile in an hour)." },
        { prompt: "Define feasible(k): hours = Σ ceil(pile/k) ≤ H. Try mid=6.", reveal: "ceil: 1+1+2+2 = 6 ≤ 8 → feasible → search lower half, hi=6." },
        { prompt: "mid=3 → hours = 1+2+3+4 = 10 > 8 → not feasible.", reveal: "Not feasible → lo=4." },
        { prompt: "Narrow 4..6 → mid=5 feasible (1+2+2+3=8), mid=4 (1+2+2+3=8) feasible → converge.", reveal: "Answer k=4. ~log(11) feasibility checks, each O(n)." },
      ],
      outcome: "Binary-searching the answer over a monotonic feasibility test: O(n log(maxPile)).",
    },
  },

  "linked-list": {
    drills: [
      {
        question: "Reversing a singly linked list in O(1) space — what must you do each step?",
        options: [
          "Save `curr.next` before rewiring `curr.next = prev`",
          "Recurse with a second list",
          "Sort the nodes",
        ],
        answerIndex: 0,
        explanation: "Rewiring `curr.next` loses the rest of the list unless you first stash the next node.",
      },
      {
        question: "Find the middle of a list in one pass. Which trick?",
        options: ["Count then re-walk", "Fast & slow pointers", "Binary search"],
        answerIndex: 1,
        explanation: "Advance fast by 2 and slow by 1; when fast reaches the end, slow is at the middle.",
      },
      {
        question: "Why add a dummy head node?",
        options: [
          "It makes the list sorted",
          "It removes special-casing when the head itself changes",
          "It saves memory",
        ],
        answerIndex: 1,
        explanation: "A dummy head gives a stable node to attach to, so inserting/removing at the front needs no separate code path.",
      },
    ],
    walkthrough: {
      problem: "Reverse a linked list 1→2→3.",
      steps: [
        { prompt: "Init pointers.", reveal: "prev=None, curr=1." },
        { prompt: "Step 1 on node 1: save next, rewire, advance.", reveal: "nxt=2; 1.next=None; prev=1, curr=2. (None←1)" },
        { prompt: "Step 2 on node 2.", reveal: "nxt=3; 2.next=1; prev=2, curr=3. (None←1←2)" },
        { prompt: "Step 3 on node 3, then curr=None → stop.", reveal: "3.next=2; prev=3. Return prev = 3→2→1." },
      ],
      outcome: "Iterative pointer rewiring: O(n) time, O(1) space — no recursion stack needed.",
    },
  },

  "trees": {
    drills: [
      {
        question: "Maximum depth of a binary tree — natural approach?",
        options: ["Recursion: 1 + max(depth(left), depth(right))", "Sort the nodes", "Two pointers"],
        answerIndex: 0,
        explanation: "Tree problems mirror the structure: solve the children, combine at the node. Depth is 1 + the deeper subtree.",
      },
      {
        question: "Validating a BST — the classic mistake is…",
        options: [
          "Only comparing each node to its direct parent",
          "Using recursion",
          "Visiting every node",
        ],
        answerIndex: 0,
        explanation: "A node must fit within a (lo, hi) range inherited from ALL ancestors, not just its parent.",
      },
      {
        question: "You need level-order (breadth-first) output. Which tool?",
        options: ["A stack", "A queue (BFS)", "A heap"],
        answerIndex: 1,
        explanation: "BFS with a queue visits nodes level by level; DFS/stack goes deep first.",
      },
    ],
    walkthrough: {
      problem: "Validate BST for  [5, 1, 4, null, null, 3, 6].",
      steps: [
        { prompt: "Root 5 starts with range (−∞, +∞). Recurse left (1) and right (4).", reveal: "Left child 1 gets range (−∞, 5); right child 4 gets (5, +∞)." },
        { prompt: "Check node 4 against its range (5, +∞).", reveal: "4 is NOT > 5 → invalid. The tree fails." },
        { prompt: "Why did parent-only comparison miss this?", reveal: "4 < its parent 5 looks fine locally, but 4 is in 5's RIGHT subtree, so it must exceed 5." },
      ],
      outcome: "Carry a (lo, hi) bound down the recursion: O(n), and it catches ancestor violations a parent-check misses.",
    },
  },

  "heap": {
    drills: [
      {
        question: "“Return the k largest elements.” Best structure?",
        options: ["Sort everything — O(n log n)", "A size-k min-heap — O(n log k)", "A hash set"],
        answerIndex: 1,
        explanation: "Keep only k elements in a min-heap; its root is the smallest of the top-k, so anything smaller gets evicted.",
      },
      {
        question: "Python's heapq is a MIN-heap. How do you get a max-heap?",
        options: ["It's already a max-heap", "Push negated values (−x)", "Call heapq.max()"],
        answerIndex: 1,
        explanation: "Negate on push and negate on pop to simulate a max-heap.",
      },
      {
        question: "Merging k sorted lists — what goes in the heap?",
        options: ["All elements at once", "The current head of each list", "Only the first list"],
        answerIndex: 1,
        explanation: "A heap of the k current heads lets you repeatedly pop the global minimum and push its successor → O(N log k).",
      },
    ],
    walkthrough: {
      problem: "Kth largest in [3,2,1,5,6,4], k=2.",
      steps: [
        { prompt: "We keep a size-2 MIN-heap of the largest seen. Push 3, 2.", reveal: "Heap: [2,3]. Root=2." },
        { prompt: "Next is 1. Push → [1,2,3], over size → pop min.", reveal: "Pop 1. Heap: [2,3]." },
        { prompt: "5 and 6 arrive.", reveal: "Push 5, pop 2 → [3,5]; push 6, pop 3 → [5,6]." },
        { prompt: "4 arrives.", reveal: "Push 4, pop 4 → [5,6]. Root=5 = the 2nd largest." },
      ],
      outcome: "A size-k heap yields the k-th largest in O(n log k) — cheaper than sorting the whole array.",
    },
  },

  "backtracking": {
    drills: [
      {
        question: "“Generate all subsets / permutations / combinations.” Which pattern?",
        options: ["Dynamic Programming", "Backtracking", "Binary Search"],
        answerIndex: 1,
        explanation: "Enumerating all valid configurations = build incrementally, recurse, and undo — backtracking.",
      },
      {
        question: "Why append `path[:]` (a copy) to results instead of `path`?",
        options: [
          "It's faster",
          "`path` keeps mutating, so every stored reference would end up identical",
          "Copies use less memory",
        ],
        answerIndex: 1,
        explanation: "You mutate `path` as you recurse; storing the live list means all results point at the same (final) list.",
      },
      {
        question: "What keeps backtracking from timing out?",
        options: ["Sorting the input", "Pruning branches that can't lead to a solution", "Using a queue"],
        answerIndex: 1,
        explanation: "It's exponential in the worst case; pruning invalid partial candidates early is what makes it tractable.",
      },
    ],
    walkthrough: {
      problem: "Word Search — does “SEE” exist in the grid starting near the S/E cells?",
      steps: [
        { prompt: "From a matching 'S', we try all 4 neighbours for the next letter 'E'. What must we do first?", reveal: "Mark the current cell visited (e.g. set it to '#') so the path can't reuse it." },
        { prompt: "Recurse to a neighbouring 'E', then to the final 'E'. What if a branch dead-ends?", reveal: "Return false up the stack — and crucially, restore the cell (unmark it) so other paths can use it." },
        { prompt: "That restore step — what's it called?", reveal: "Backtracking: undo the choice on the way back up (`board[i][j] = saved`)." },
      ],
      outcome: "Choose → recurse → undo, with visited-marking to prevent reuse: correct DFS search over the grid.",
    },
  },

  "graphs": {
    drills: [
      {
        question: "“Count islands in a grid of 1s and 0s.” Which pattern?",
        options: ["Binary Search", "Graph traversal (DFS/BFS flood fill)", "Two Pointers"],
        answerIndex: 1,
        explanation: "A grid is a graph; each unvisited land cell starts a component you flood-fill and sink.",
      },
      {
        question: "“Can all courses be finished given prerequisites?” This is really…",
        options: ["Detecting a cycle in a directed graph (topological sort)", "Sorting the courses", "A heap problem"],
        answerIndex: 0,
        explanation: "If a valid order exists (no cycle), a topological sort processes every node — otherwise it can't.",
      },
      {
        question: "The bug that causes infinite loops in graph traversal?",
        options: ["Forgetting to mark nodes visited", "Using a queue", "Sorting edges"],
        answerIndex: 0,
        explanation: "Without a visited set you revisit nodes endlessly; mark them (ideally on enqueue to avoid duplicates).",
      },
    ],
    walkthrough: {
      problem: "Course Schedule — numCourses=2, prerequisites=[[1,0]] (take 0 before 1). Finishable?",
      steps: [
        { prompt: "Build the graph and indegrees.", reveal: "Edge 0→1. indegree = [0, 1]. Course 0 has no prereqs." },
        { prompt: "Kahn's algorithm: start with indegree-0 nodes.", reveal: "Queue = [0]. Process 0, decrement 1's indegree → 0, enqueue 1." },
        { prompt: "Process 1. How many did we process?", reveal: "Processed 2 of 2 nodes → no cycle → finishable = true." },
        { prompt: "What if prerequisites were [[1,0],[0,1]]?", reveal: "Both start at indegree 1 → queue empty immediately → processed 0 → cycle → false." },
      ],
      outcome: "Topological sort via indegrees: process every node iff there's no cycle. O(V + E).",
    },
  },

  "dynamic-programming": {
    drills: [
      {
        question: "Which phrase most signals dynamic programming?",
        options: [
          "“Return the indices of…”",
          "“Count the number of ways / min cost, where each step you choose”",
          "“Is the array sorted?”",
        ],
        answerIndex: 1,
        explanation: "Overlapping subproblems + “at each step, choose” + count/min/max is the DP fingerprint.",
      },
      {
        question: "Coin Change (fewest coins for an amount) — what is dp[a]?",
        options: [
          "The number of coins of value a",
          "The fewest coins to make amount a",
          "Whether amount a is prime",
        ],
        answerIndex: 1,
        explanation: "Define the state as the answer to a subproblem: dp[a] = min coins for amount a, built from dp[a − coin] + 1.",
      },
      {
        question: "A DP gives wrong answers. Most likely cause?",
        options: [
          "Wrong base case or iterating in an order that uses a state before it's computed",
          "Using a list",
          "Too much memory",
        ],
        answerIndex: 0,
        explanation: "Base cases and iteration order are the usual DP bugs — every state must be ready before it's used.",
      },
    ],
    walkthrough: {
      problem: "Coin Change — coins=[1,2,5], amount=11. Fewest coins?",
      steps: [
        { prompt: "State and base case?", reveal: "dp[a] = fewest coins for a. dp[0]=0; everything else starts at ∞." },
        { prompt: "Transition for amount a?", reveal: "dp[a] = min over coins c≤a of dp[a−c] + 1." },
        { prompt: "Spot-check dp[5] and dp[6].", reveal: "dp[5]=1 (one 5). dp[6]=min(dp[5],dp[4],dp[1])+1 = 2 (5+1)." },
        { prompt: "Build up to dp[11].", reveal: "dp[11] = dp[6]+1 = 3 (5+5+1). Answer 3." },
      ],
      outcome: "Fill dp[0..amount] once, O(amount × coins) — no re-solving the same subamount twice.",
    },
  },

  "intervals": {
    drills: [
      {
        question: "“Merge all overlapping intervals.” First move?",
        options: ["Sort by start time", "Use a heap", "Binary search"],
        answerIndex: 0,
        explanation: "Sorting by start lets a single pass decide overlaps — it's the unlock for almost every interval problem.",
      },
      {
        question: "After sorting, when does the current interval overlap the previous one?",
        options: ["start > previous end", "start ≤ previous end", "end < previous start"],
        answerIndex: 1,
        explanation: "If the current start is at or before the previous end, they overlap — extend the previous end.",
      },
      {
        question: "“Could a person attend all meetings?” reduces to…",
        options: ["Any two intervals overlap after sorting → false", "Counting intervals", "A DP"],
        answerIndex: 0,
        explanation: "Sort by start; if any interval begins before the previous ends, there's a conflict → false.",
      },
    ],
    walkthrough: {
      problem: "Merge Intervals — [[1,3],[2,6],[8,10],[15,18]].",
      steps: [
        { prompt: "Sort by start (already sorted). Take [1,3] as the current.", reveal: "merged = [[1,3]]." },
        { prompt: "Next [2,6]: 2 ≤ 3 (prev end) → overlap.", reveal: "Extend: merged[-1][1] = max(3,6) = 6 → [[1,6]]." },
        { prompt: "Next [8,10]: 8 ≤ 6? No.", reveal: "No overlap → append → [[1,6],[8,10]]." },
        { prompt: "Next [15,18]: 15 ≤ 10? No.", reveal: "Append → [[1,6],[8,10],[15,18]]. Done." },
      ],
      outcome: "Sort then one linear pass: O(n log n). The sort is what makes overlaps a simple neighbour check.",
    },
  },

  "greedy": {
    drills: [
      {
        question: "“Max profit from one buy and one later sell.” Greedy state?",
        options: [
          "Track the lowest price so far and the best profit against it",
          "Sort the prices",
          "Try every pair of days",
        ],
        answerIndex: 0,
        explanation: "Carry the min price seen; at each day the best sale is price − min-so-far. One pass, O(n).",
      },
      {
        question: "Jump Game (can you reach the last index?) — the greedy quantity is…",
        options: ["The furthest index reachable so far", "The number of jumps", "The sum of values"],
        answerIndex: 0,
        explanation: "Track the furthest reach; if your current index ever exceeds it, you're stuck.",
      },
      {
        question: "The danger with greedy?",
        options: [
          "Assuming a local choice is optimal when the problem actually needs DP",
          "It uses too much memory",
          "It's always slower than brute force",
        ],
        answerIndex: 0,
        explanation: "Greedy only works if the locally-best choice is provably globally optimal — otherwise you need DP.",
      },
    ],
    walkthrough: {
      problem: "Best Time to Buy and Sell Stock — prices=[7,1,5,3,6,4].",
      steps: [
        { prompt: "Carry min-so-far and best-profit. Start at 7.", reveal: "min=7, best=0." },
        { prompt: "Day 1 (1): update min, then profit.", reveal: "min=1; profit 1−1=0; best=0." },
        { prompt: "Day 2 (5): profit vs min?", reveal: "5−1=4 → best=4." },
        { prompt: "Days 3–5 (3,6,4).", reveal: "6−1=5 → best=5. Final answer 5." },
      ],
      outcome: "One greedy pass tracking the running minimum: O(n), O(1) — no need to compare all pairs.",
    },
  },

  "bit-manipulation": {
    drills: [
      {
        question: "“Every number appears twice except one — find it,” in O(1) space. Trick?",
        options: ["Hash set of counts", "XOR everything together", "Sort and scan"],
        answerIndex: 1,
        explanation: "a ^ a = 0, so XOR of all values cancels the pairs and leaves the lone number — O(1) space.",
      },
      {
        question: "`n & (n - 1)` does what?",
        options: ["Doubles n", "Clears the lowest set bit of n", "Reverses n's bits"],
        answerIndex: 1,
        explanation: "It's the classic trick for counting set bits (loop until 0) and checking powers of two.",
      },
      {
        question: "Why prefer XOR over a hash set for “single number”?",
        options: ["XOR is O(1) extra space; the set is O(n)", "XOR is easier to read", "They're identical"],
        answerIndex: 0,
        explanation: "Both are O(n) time, but XOR uses a single accumulator — O(1) space vs the set's O(n).",
      },
    ],
    walkthrough: {
      problem: "Single Number — [4,1,2,1,2].",
      steps: [
        { prompt: "Accumulate with XOR. Start x=0.", reveal: "x = 0 ^ 4 = 4." },
        { prompt: "XOR in 1, then 2.", reveal: "x = 4^1 = 5; x = 5^2 = 7." },
        { prompt: "XOR the second 1, then second 2.", reveal: "x = 7^1 = 6; x = 6^2 = 4." },
        { prompt: "Why 4?", reveal: "The two 1s and two 2s cancelled (a^a=0); only 4 survived." },
      ],
      outcome: "A single XOR pass isolates the unpaired value: O(n) time, O(1) space.",
    },
  },
};
