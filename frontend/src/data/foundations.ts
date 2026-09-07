// Data-structure foundations — the prerequisites to the Patterns track. Each is
// taught hands-on by the AI tutor; the slug doubles as the tutor topic.

export interface Foundation {
  slug: string;
  name: string;
  whatItIs: string;
  operations: { op: string; big_o: string }[];
  inPython: string;
  whenToUse: string;
  problemSlugs: string[]; // easy problems to try after the lesson
}

export const FOUNDATIONS: Foundation[] = [
  {
    slug: "arrays-strings",
    name: "Arrays & Strings",
    whatItIs:
      "An array stores elements in contiguous memory, so any element is reachable in O(1) by its index. A string is essentially an immutable array of characters. Arrays are the workhorse structure most other things are built on.",
    operations: [
      { op: "Access by index a[i]", big_o: "O(1)" },
      { op: "Update a[i] = x", big_o: "O(1)" },
      { op: "Append (amortized)", big_o: "O(1)" },
      { op: "Insert / delete in the middle", big_o: "O(n)" },
      { op: "Search (unsorted)", big_o: "O(n)" },
      { op: "Slice a[i:j]", big_o: "O(k)" },
    ],
    inPython:
      "a = [3, 1, 4, 1, 5]\n" +
      "a[2]            # 4  — O(1) index\n" +
      "a.append(9)     # amortized O(1)\n" +
      "a[1:4]          # [1, 4, 1] — new list, O(k)\n" +
      "s = 'hello'\n" +
      "s[0]            # 'h'  (strings are immutable — s[0]='H' is an error)",
    whenToUse:
      "Default choice for ordered collections and index-based access. Watch out for O(n) inserts/deletes in the middle and the cost of building new lists via slicing.",
    problemSlugs: ["move-zeroes", "merge-sorted-array", "reverse-string", "majority-element", "product-except-self"],
  },
  {
    slug: "hashing-maps",
    name: "Hash Maps & Sets",
    whatItIs:
      "A hash map (dict) stores key→value pairs with O(1) average lookup by hashing the key to a bucket. A set is the same idea without values — just membership. This is how you avoid O(n²) scans: ask “have I seen this?” in O(1).",
    operations: [
      { op: "Insert / update d[k] = v", big_o: "O(1) avg" },
      { op: "Lookup d[k] / k in d", big_o: "O(1) avg" },
      { op: "Delete", big_o: "O(1) avg" },
      { op: "Iterate all keys", big_o: "O(n)" },
    ],
    inPython:
      "from collections import Counter, defaultdict\n" +
      "seen = set()\n" +
      "if x in seen: ...        # O(1) membership\n" +
      "count = Counter(nums)    # frequency map\n" +
      "groups = defaultdict(list)\n" +
      "groups[key].append(x)    # no KeyError on first use",
    whenToUse:
      "Counting, dedup, grouping, or any repeated lookup by key. Keys must be hashable (immutable). No sorted order — if you need ordering, sort or use another structure.",
    problemSlugs: ["two-sum", "contains-duplicate", "valid-anagram", "ransom-note", "first-non-repeating", "group-anagrams"],
  },
  {
    slug: "stacks-queues",
    name: "Stacks & Queues",
    whatItIs:
      "A stack is Last-In-First-Out — the most recent item comes off first (like a stack of plates). A queue is First-In-First-Out — items leave in arrival order (like a line). Both give O(1) add/remove at their working end.",
    operations: [
      { op: "Stack push / pop / peek", big_o: "O(1)" },
      { op: "Queue enqueue / dequeue (deque)", big_o: "O(1)" },
      { op: "list.pop(0) — DON'T for a queue", big_o: "O(n)" },
    ],
    inPython:
      "stack = []\n" +
      "stack.append(x)   # push\n" +
      "stack.pop()       # pop the last (LIFO)\n\n" +
      "from collections import deque\n" +
      "q = deque()\n" +
      "q.append(x)       # enqueue\n" +
      "q.popleft()       # dequeue (FIFO) — O(1)",
    whenToUse:
      "Stack: undo/matching, parsing nesting, “next greater” (monotonic stack), DFS. Queue: BFS, scheduling, anything processed in arrival order. Use deque for queues — never list.pop(0).",
    problemSlugs: ["valid-parentheses", "evaluate-reverse-polish-notation", "daily-temperatures"],
  },
  {
    slug: "linked-lists",
    name: "Linked Lists",
    whatItIs:
      "A chain of nodes, each holding a value and a pointer to the next node. There's no index — you follow pointers. The payoff is O(1) insert/delete once you're at a node, without shifting everything like an array.",
    operations: [
      { op: "Insert / delete at a known node", big_o: "O(1)" },
      { op: "Access / search by position", big_o: "O(n)" },
      { op: "Reverse", big_o: "O(n)" },
    ],
    inPython:
      "class ListNode:\n" +
      "    def __init__(self, val=0, next=None):\n" +
      "        self.val = val\n" +
      "        self.next = next\n\n" +
      "# traverse\n" +
      "node = head\n" +
      "while node:\n" +
      "    print(node.val)\n" +
      "    node = node.next",
    whenToUse:
      "When you insert/delete a lot at known positions and don't need random access. Use a dummy head to avoid special-casing the front, and always save `node.next` before rewiring.",
    problemSlugs: ["reverse-linked-list", "merge-k-sorted-lists"],
  },
  {
    slug: "recursion",
    name: "Recursion",
    whatItIs:
      "A function that solves a problem by calling itself on a smaller version, until it hits a base case. Not a data structure, but the technique that trees, backtracking, and DP all rest on. Each call gets its own frame on the call stack.",
    operations: [
      { op: "Base case (stops the recursion)", big_o: "—" },
      { op: "Recursive case (smaller subproblem)", big_o: "—" },
      { op: "Max call-stack depth", big_o: "O(depth)" },
    ],
    inPython:
      "def factorial(n):\n" +
      "    if n <= 1:          # base case\n" +
      "        return 1\n" +
      "    return n * factorial(n - 1)   # recursive case\n\n" +
      "# every unresolved call waits on the stack until the base case returns",
    whenToUse:
      "When a problem is naturally self-similar — trees, divide-and-conquer, backtracking, DP. Always define the base case first, and watch stack depth (Python's default limit is ~1000).",
    problemSlugs: ["max-depth-binary-tree", "invert-binary-tree"],
  },
  {
    slug: "trees-bst",
    name: "Trees & BSTs",
    whatItIs:
      "A hierarchy of nodes: a root, each node pointing to children. A binary tree has ≤2 children per node. A Binary Search Tree adds an ordering rule — left subtree < node < right subtree — enabling O(log n) search when balanced.",
    operations: [
      { op: "Traverse (DFS / BFS)", big_o: "O(n)" },
      { op: "BST search / insert (balanced)", big_o: "O(log n)" },
      { op: "BST search (skewed)", big_o: "O(n)" },
    ],
    inPython:
      "class TreeNode:\n" +
      "    def __init__(self, val=0, left=None, right=None):\n" +
      "        self.val = val; self.left = left; self.right = right\n\n" +
      "def inorder(node):        # left, node, right\n" +
      "    if not node: return\n" +
      "    inorder(node.left)\n" +
      "    print(node.val)\n" +
      "    inorder(node.right)",
    whenToUse:
      "Hierarchical data, ordered data with fast search (BST), or anything you traverse recursively. Remember: BST guarantees hold only when the tree is reasonably balanced.",
    problemSlugs: ["max-depth-binary-tree", "invert-binary-tree", "validate-bst"],
  },
  {
    slug: "heaps-pq",
    name: "Heaps / Priority Queues",
    whatItIs:
      "A binary heap keeps the smallest (min-heap) or largest (max-heap) element at the root, so you can peek it in O(1) and pop it in O(log n). It's the go-to for “give me the next most important item” without fully sorting.",
    operations: [
      { op: "Peek min/max", big_o: "O(1)" },
      { op: "Push", big_o: "O(log n)" },
      { op: "Pop min/max", big_o: "O(log n)" },
      { op: "Build from a list (heapify)", big_o: "O(n)" },
    ],
    inPython:
      "import heapq\n" +
      "h = []\n" +
      "heapq.heappush(h, 3)\n" +
      "heapq.heappush(h, 1)\n" +
      "heapq.heappop(h)     # 1  (min-heap)\n\n" +
      "# max-heap: push negatives\n" +
      "heapq.heappush(h, -x); -heapq.heappop(h)",
    whenToUse:
      "Top-k, k-th largest, merging sorted streams, scheduling by priority, running median. Python's heapq is a MIN-heap — negate values for a max-heap.",
    problemSlugs: ["last-stone-weight", "kth-largest-element-in-an-array", "top-k-frequent"],
  },
  {
    slug: "graphs-basics",
    name: "Graphs",
    whatItIs:
      "Vertices connected by edges — a general model for networks, maps, and dependencies. Edges can be directed or undirected. You usually store a graph as an adjacency list (each node → its neighbours) and explore it with BFS or DFS.",
    operations: [
      { op: "BFS / DFS traversal", big_o: "O(V + E)" },
      { op: "Add edge (adjacency list)", big_o: "O(1)" },
      { op: "Check neighbours of a node", big_o: "O(degree)" },
    ],
    inPython:
      "from collections import defaultdict, deque\n" +
      "graph = defaultdict(list)\n" +
      "for a, b in edges:\n" +
      "    graph[a].append(b)      # (and graph[b].append(a) if undirected)\n\n" +
      "q, seen = deque([start]), {start}   # BFS\n" +
      "while q:\n" +
      "    node = q.popleft()\n" +
      "    for nxt in graph[node]:\n" +
      "        if nxt not in seen:\n" +
      "            seen.add(nxt); q.append(nxt)",
    whenToUse:
      "Connectivity, shortest paths, dependencies/ordering, grids (a grid is a graph). Always track visited nodes to avoid infinite loops.",
    problemSlugs: ["number-of-islands", "course-schedule"],
  },
  {
    slug: "tries",
    name: "Tries (Prefix Trees)",
    whatItIs:
      "A tree where each edge is a character, so a path from the root spells a word. It makes prefix queries — “which words start with ‘pre’?” — fast, in time proportional to the word length rather than the number of words.",
    operations: [
      { op: "Insert a word", big_o: "O(L)" },
      { op: "Search a word", big_o: "O(L)" },
      { op: "startsWith(prefix)", big_o: "O(L)" },
    ],
    inPython:
      "class TrieNode:\n" +
      "    def __init__(self):\n" +
      "        self.children = {}     # char -> TrieNode\n" +
      "        self.is_word = False\n\n" +
      "def insert(root, word):\n" +
      "    node = root\n" +
      "    for ch in word:\n" +
      "        node = node.children.setdefault(ch, TrieNode())\n" +
      "    node.is_word = True",
    whenToUse:
      "Autocomplete, prefix search, dictionary/word problems, or when a hash set can't answer prefix questions. Costs more memory than a set — one node per character.",
    problemSlugs: [],
  },
];
