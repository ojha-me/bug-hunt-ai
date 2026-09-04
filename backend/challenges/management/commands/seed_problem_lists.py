from django.core.management.base import BaseCommand
from challenges.models import CodingProblem, ProblemList


LISTS = [
    {
        "slug": "blind-75",
        "name": "Blind 75",
        "order": 0,
        "description": "The classic interview canon — the highest-frequency patterns, grouped by category. Work top to bottom.",
        "problem_slugs": [
            # Arrays & Hashing
            "two-sum", "contains-duplicate", "valid-anagram", "group-anagrams",
            "top-k-frequent", "product-except-self",
            # Two Pointers
            "valid-palindrome", "three-sum", "container-with-most-water",
            # Sliding Window
            "best-time-to-buy", "longest-substring", "sliding-window-maximum",
            # Stack
            "valid-parentheses", "evaluate-reverse-polish-notation", "daily-temperatures",
            # Binary Search
            "binary-search", "search-in-rotated-sorted-array", "koko-eating-bananas",
            "median-two-sorted-arrays",
            # Linked List
            "reverse-linked-list", "merge-k-sorted-lists",
            # Trees
            "invert-binary-tree", "max-depth-binary-tree", "validate-bst",
            # Heap
            "kth-largest-element-in-an-array", "last-stone-weight",
            # Backtracking
            "word-search",
            # Graphs
            "number-of-islands", "course-schedule",
            # Dynamic Programming
            "climbing-stairs", "house-robber", "coin-change", "jump-game", "unique-paths",
            "max-subarray", "longest-increasing-subsequence", "longest-common-subsequence",
            "word-break", "partition-equal-subset-sum",
            # Intervals
            "merge-intervals", "meeting-rooms",
            # Math & Bit
            "single-number", "number-of-1-bits",
            # Hard
            "edit-distance", "trapping-rain-water", "rotate-image",
        ],
    },
    {
        "slug": "easy-warmups",
        "name": "Easy Warm-ups",
        "order": 1,
        "description": "Build momentum and get comfortable with the editor before tackling mediums.",
        "problem_slugs": [
            "two-sum", "contains-duplicate", "valid-anagram", "valid-palindrome",
            "valid-parentheses", "fizzbuzz", "reverse-string", "first-non-repeating",
            "ransom-note", "majority-element", "single-number", "number-of-1-bits",
            "move-zeroes", "merge-sorted-array", "reverse-linked-list",
            "max-depth-binary-tree", "invert-binary-tree", "meeting-rooms",
            "last-stone-weight", "climbing-stairs",
        ],
    },
    {
        "slug": "dp-ladder",
        "name": "DP Ladder",
        "order": 2,
        "description": "Dynamic programming from first principles up to hard — the pattern interviewers lean on most.",
        "problem_slugs": [
            "climbing-stairs", "house-robber", "coin-change", "jump-game", "unique-paths",
            "max-subarray", "longest-increasing-subsequence", "word-break",
            "partition-equal-subset-sum", "longest-common-subsequence", "edit-distance",
        ],
    },
    {
        "slug": "two-pointers-sliding-window",
        "name": "Two Pointers & Sliding Window",
        "order": 3,
        "description": "The array/string workhorses — scan with two indices or a moving window.",
        "problem_slugs": [
            "valid-palindrome", "two-sum", "three-sum", "container-with-most-water",
            "merge-sorted-array", "move-zeroes", "best-time-to-buy", "longest-substring",
            "sliding-window-maximum", "trapping-rain-water",
        ],
    },
    {
        "slug": "trees-graphs-heaps",
        "name": "Trees, Graphs & Heaps",
        "order": 4,
        "description": "Traversals, connectivity, ordering, and priority — the non-linear data structures.",
        "problem_slugs": [
            "max-depth-binary-tree", "invert-binary-tree", "validate-bst",
            "number-of-islands", "course-schedule", "kth-largest-element-in-an-array",
            "last-stone-weight", "top-k-frequent", "merge-k-sorted-lists",
        ],
    },
]


class Command(BaseCommand):
    help = "Seed curated problem study lists (Blind 75, tracks)."

    def handle(self, *args, **options):
        valid = set(CodingProblem.objects.values_list("slug", flat=True))
        for spec in LISTS:
            missing = [s for s in spec["problem_slugs"] if s not in valid]
            if missing:
                self.stdout.write(self.style.WARNING(
                    f"List '{spec['slug']}' references unknown slugs: {missing}"))
            obj, created = ProblemList.objects.get_or_create(slug=spec["slug"], defaults=spec)
            if not created:
                for k, v in spec.items():
                    setattr(obj, k, v)
                obj.save()
            self.stdout.write(f"{'Created' if created else 'Updated'} list: {obj.name} ({len(spec['problem_slugs'])} problems)")
